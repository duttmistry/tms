import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Output, EventEmitter, OnInit, Input, OnDestroy } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Subscription } from 'rxjs';
import { ProjectsRequestDataModel } from '../../../core/model/task/task.model';
import { TaskService } from '../../../core/services/module/tasks/task.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { Encryption } from '@tms-workspace/encryption';
import { ThemePalette } from '@angular/material/core';

//#region [Supporting Structures]
export interface projectNode {
  name: string;
  id?: number;
  selected?: boolean;
}
export interface WorkSpaceNode {
  title: string;
  id?: number;
  projects?: projectNode[];
  selected?: boolean;
  parent?: WorkSpaceNode;
  task_count: number;
}
//#endregion

@Component({
  selector: 'workspace-grouped-project-selection',
  templateUrl: './workspace-grouped-project-selection.component.html',
  styleUrls: ['./workspace-grouped-project-selection.component.scss'],
})
export class WorkspaceGroupedProjectSelectionComponent implements OnInit, OnDestroy {
  projectSelectionDataSource = new MatTreeNestedDataSource<WorkSpaceNode>();
  @Input() displayCount = false;
  @Input() hideNoTaskCount = false;
  @Input() selectedWorkSpaceID: any = null;
  @Input() selectedProjectID: any = null;
  @Output() getSelectedProjects = new EventEmitter<any[]>();
  @Input() prefName = '';
  treeControl = new NestedTreeControl<WorkSpaceNode>((node: any) => node.projects);
  subscriptions: Subscription[] = [];
  workspaceData = [];
  selectedProjects: any = [];
  public selectedOptions: any = [];
  itemSelectedCount = 0;
  topSelectedItem = '';
  PLACEHOLDER_FOR_EMPTY_SELECTION = 'Workspace and Project';
  changedSelection = false;
  standloneProjects: any = [];
  searchText = '';
  hasStandloneProjects = true;
  constructor(private taskService: TaskService, private storageService: StorageService) {}

  ngOnInit(): void {
    // console.log(this.prefName);
    this.getProjectsData();
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((_subscription: Subscription) => _subscription?.unsubscribe());
  }
  getMatTriggerForWorkspaceSelection() {
    let selectedProjects = this.projectSelectionDataSource.data
      ?.filter((workspace: any) => workspace?.projects?.some((projects: any) => projects?.selected))
      ?.map((_workspace: any) => _workspace?.projects?.filter((proj: any) => proj?.selected).map((_proj: any) => _proj?.name));
    selectedProjects = selectedProjects?.flat(1);
    if (selectedProjects && selectedProjects.length > 0) {
      this.topSelectedItem = selectedProjects[0];
      this.itemSelectedCount = selectedProjects.length;
    } else {
      this.topSelectedItem = '';
      this.itemSelectedCount = 0;
    }
    let selectedStandLoneProjects = this.standloneProjects
      ?.filter((proj: any) => proj.checked)
      ?.map((proj: any) => {
        return {
          id: proj.id,
          name: proj.name,
        };
      });
    selectedStandLoneProjects = selectedStandLoneProjects && Array.isArray(selectedStandLoneProjects) ? selectedStandLoneProjects : [];

    if (selectedStandLoneProjects && selectedStandLoneProjects.length > 0) {
      if (!this.topSelectedItem) {
        this.topSelectedItem = selectedStandLoneProjects[0].name;
      }
      this.itemSelectedCount += selectedStandLoneProjects.length;
    }
  }
  selectAll() {
    this.selectedOptions = [];
    this.selectedProjects = [];

    this.updateNodeSelection(this.projectSelectionDataSource.data, true);
    this.standloneProjects.forEach((_proj: any) => (_proj['checked'] = true));
    this.getMatTriggerForWorkspaceSelection();
    this.changedSelection = true;
  }
  clearAll() {
    this.selectedOptions = [];
    this.selectedProjects = [];
    this.updateNodeSelection(this.projectSelectionDataSource.data, false);
    this.standloneProjects
      ?.filter((proj: any) => proj.name.toLowerCase().includes(this.searchText.toLowerCase()))
      .forEach((_proj: any) => (_proj.checked = false));
    this.getMatTriggerForWorkspaceSelection();
    this.changedSelection = true;
  }
  getSelectedProjectList(eventArgs: any) {
    const listofAllProjects = this.workspaceData.map((workspace: any) => workspace.projects).flat(1);
    let selectedStandLoneProjects = this.standloneProjects
      ?.filter((proj: any) => proj.checked)
      ?.map((proj: any) => {
        return {
          id: proj.id,
          name: proj.name,
        };
      });
    selectedStandLoneProjects = selectedStandLoneProjects && Array.isArray(selectedStandLoneProjects) ? selectedStandLoneProjects : [];
    if (this.changedSelection && !eventArgs) {
      this.changedSelection = false;
      try {
        this.selectedProjects = this.projectSelectionDataSource.data.reduce(
          (acc: string[], node: WorkSpaceNode) =>
            acc.concat(
              this.treeControl
                .getDescendants(node)
                .filter((descendant) => descendant.selected)
                .map((descendant: any) => {
                  return descendant
                    ? JSON.stringify({
                        id: descendant.id,
                        name: descendant.name,
                      })
                    : '';
                }) // Check if id exists before accessing it
            ),
          [] as string[]
        );
        if (this.selectedProjects) {
          let selectedProjects = this.selectedProjects.map((project: any) => JSON.parse(project));
          selectedProjects = [...selectedProjects, ...selectedStandLoneProjects];
          this.getSelectedProjects.emit([selectedProjects, listofAllProjects]);
        } else {
          this.getSelectedProjects.emit([[...selectedStandLoneProjects], listofAllProjects]);
        }
      } catch {
        this.getSelectedProjects.emit([[...selectedStandLoneProjects], listofAllProjects]);
      }
    }
  }
  itemToggle(checked: boolean, node: WorkSpaceNode) {
    node.selected = checked;
    if (node.projects) {
      node.projects.forEach((child: any) => {
        this.itemToggle(checked, child);
      });
    }
    this.checkAllParents(node);
    this.getMatTriggerForWorkspaceSelection();
    this.changedSelection = true;
  }
  itemToggle_Sub(checked: boolean, node: WorkSpaceNode) {
    // console.log('node: ', node);
    node.selected = checked;
    if (node.projects) {
      node.projects.forEach((child: any) => {
        this.itemToggle(checked, child);
      });
    }
    this.checkAllParents(node);
    this.getMatTriggerForWorkspaceSelection();
    this.changedSelection = true;
  }

  allCompleted(node: any) {
    return node?.projects != null && node?.projects?.every((t: any) => t.selected);
  }
  someComplete(node: any) {
    // return node?.parent?.projects.some((proj: any) => proj.selected);
    if (node?.projects == null) {
      return false;
    }
    return node?.projects.filter((t: any) => t.selected).length > 0 && !(node?.projects != null && node?.projects?.every((t: any) => t.selected));
  }

  public hasChild = (_: number, node: WorkSpaceNode) => !!node.projects && node.projects.length >= 0;

  private setParent(node: WorkSpaceNode, parent?: WorkSpaceNode) {
    node.parent = parent;
    if (node.projects) {
      node.projects.forEach((childNode: any) => {
        this.setParent(childNode, node);
      });
    }
  }
  updateNodeSelection(nodes: WorkSpaceNode[], selected: boolean): void {
    nodes.forEach((node: any) => {
      if (this.searchText) {
        const nodeName = node.title || node.name;
        const parentNodeName = node?.parent?.title || null;
        if (nodeName.toLowerCase().includes(this.searchText.toLowerCase()) || parentNodeName?.toLowerCase().includes(this.searchText.toLowerCase())) {
          node.selected = selected;
          if (selected) {
            this.selectedOptions.push(node);
          }
          if (node.projects) {
            this.updateNodeSelection(node.projects, selected);
          }
        } else {
          if (node.projects) {
            this.updateNodeSelection(node.projects, selected);
            const isAllChecked = node.projects.every((proj: any) => proj.selected === true);
            if (isAllChecked) {
              node.selected = true;
              this.selectedOptions.push(node);
            } else {
              node.selected = false;
            }
          }
        }
      } else {
        node.selected = selected;
        if (selected) {
          this.selectedOptions.push(node);
        }
        if (node.projects) {
          this.updateNodeSelection(node.projects, selected);
          const isAllChecked = node.projects.every((proj: any) => proj.selected === true);
          if (isAllChecked) {
            node.selected = true;
            this.selectedOptions.push(node);
          } else {
            node.selected = false;
          }
        }
      }
    });
  }
  selectDefaultWorkspaceProject() {
    if (this.selectedWorkSpaceID) {
      const node: any = this.projectSelectionDataSource.data.find(
        (workspace: any) => workspace?.id?.toString() === this.selectedWorkSpaceID.toString()
      );
      if (node) {
        node.selected = true;
        this.selectedOptions.push(node);
        if (node.projects) {
          this.updateNodeSelection(node?.projects, true);
        }
      }
      this.standloneProjects.forEach((proj: any) => {
        proj.checked = false;
      });
    }

    if (this.selectedProjectID) {
      const node: any = this.projectSelectionDataSource.data.find(
        (workspace: any) =>
          workspace?.projects &&
          Array.isArray(workspace.projects) &&
          workspace.projects.some((project: any) => project?.id?.toString() === this.selectedProjectID)
      );
      if (node) {
        const projectNode = node.projects.find((project: any) => project.id.toString() === this.selectedProjectID);
        if (projectNode) {
          projectNode.selected = true;
          this.selectedOptions.push(projectNode);
        }
        const isSingleProjectNode = node.projects.every((project: any) => project.selected);
        if (isSingleProjectNode) {
          node.selected = true;
          this.selectedOptions.push(node);
        }
      }
      this.standloneProjects.forEach((proj: any) => {
        proj.checked = proj?.id?.toString() === this.selectedProjectID?.toString();
      });
    }
  }
  private checkAllParents(node: WorkSpaceNode) {
    if (node.parent) {
      const descendants = this.treeControl.getDescendants(node.parent);
      node.parent.selected = descendants.every((child) => child.selected);
      this.checkAllParents(node.parent);
    }
  }
  getProjectsData() {
    const requestBody: ProjectsRequestDataModel = {
      status: true,
      custom_fields: false,
      tag: false,
      team: true,
      billing_configuration: false,
      documents: false,
      workspace: true,
    };
    if (this.hideNoTaskCount) {
      this.subscriptions.push(
        this.taskService.getProjectTaskCount().subscribe({
          next: (response: any) => {
            if (response) {
              if (response.data) {
                if (response.data.list) {
                  const projectList = response.data.list;
                  projectList.forEach((proj: any) => {
                    proj['task_count'] = proj?.pending_task_count || 0;
                  });
                  this.groupProjectsBasedOnWorkspace(projectList);
                }
              }
            }
          },
        })
      );
    } else {
      this.subscriptions.push(
        this.taskService.getProjectListv2().subscribe({
          next: (response: any) => {
            if (response) {
              if (response.data) {
                if (response.data.list) {
                  const projectList = response.data.list;
                  projectList.forEach((proj: any) => {
                    proj['task_count'] = -1;
                  });
                  this.groupProjectsBasedOnWorkspace(projectList);
                }
              }
            }
          },
        })
      );
    }
  }
  groupProjectsBasedOnWorkspace(projectList: any) {
    projectList = projectList?.sort((project1:any,project2:any)=>{
      if (project1?.name?.toLowerCase() < project2?.name?.toLowerCase() ) {
        return -1;
      }
      if (project1?.name?.toLowerCase() > project2?.name?.toLowerCase() ) {
        return 1;
      }
      return 0;
      
    })
    
    // console.log('projectList: ', projectList);
    const workdpaceWiseList: any[] = [];
    const workspaceWiseProjects = projectList.reduce((groupedData: any, _project: any) => {
      const projectDetails = {
        id: _project.id,
        name: _project.name,
        task_count: _project?.task_count || 0,
      };
      let index = 0;
      if (_project.workspace_id) {
        index = groupedData.length > 0 ? groupedData.findIndex((group: any) => group.id == _project.workspace_id) : -1;
        if (index != -1) {
          groupedData[index].task_count = groupedData[index].task_count + (projectDetails?.task_count || 0);
          groupedData[index].projects.push(projectDetails);
        } else {
          groupedData.push({
            id: _project.workspace_id,
            title: _project.workspace_title,
            projects: [projectDetails],
            task_count: projectDetails?.task_count || 0,
          });
        }
      } else {
        index = groupedData.length > 0 ? groupedData.findIndex((group: any) => group.id == -1) : -1;
        if (index != -1) {
          groupedData[index].projects.push(projectDetails);
        } else {
          groupedData.push({ id: -1, title: '(No Workspace)', projects: [projectDetails], task_count: 0 });
        }
      }
      return groupedData;
    }, workdpaceWiseList)?.sort((workspace1:any,workspace2:any)=>{
      if (workspace1?.title?.toLowerCase() < workspace2?.title?.toLowerCase() ) {
        return -1;
      }
      if (workspace1?.title?.toLowerCase() > workspace2?.title?.toLowerCase() ) {
        return 1;
      }
      return 0;
      
    });
    
    this.workspaceData = workspaceWiseProjects;
    // console.log('this.workspaceData: ', this.workspaceData);

    const _noWorkspace = workspaceWiseProjects.filter((workspace: any) => workspace.id === -1);
    const projs = _noWorkspace && Array.isArray(_noWorkspace) && _noWorkspace.length > 0 ? (_noWorkspace[0] ? _noWorkspace[0].projects : []) : [];
    this.standloneProjects = projs.map((proj: any) => {
      return {
        ...proj,
        checked: false,
        visible: true,
      };
    })

    

    const treeData: any[] = this.workspaceData
      .filter((workspace: any) => workspace.id != -1)
      .map((item: any) => {
        const projects = item.projects?.map((project: any) => ({
          id: project.id,
          name: project.name,
          task_count: project?.task_count,
          selected: false,
        }));
        return {
          id: item.id,
          title: item.title,
          task_count: item?.task_count,
          projects,
          selected: false, // Set selected state based on child projects or default to true
        };
      });

    if (treeData && treeData.length > 0) {
      this.projectSelectionDataSource.data = treeData;
    }
    if (this.selectedWorkSpaceID || this.selectedProjectID) {
      this.selectDefaultWorkspaceProject();
    } else {
      this.checkAvailablePref();
    }
    Object.keys(this.projectSelectionDataSource.data).forEach((key: any) => {
      this.setParent(this.projectSelectionDataSource.data[key]);
    });
    this.changedSelection = true;
    this.getMatTriggerForWorkspaceSelection();
    this.getSelectedProjectList(false);
  }
  projectSelectionChange(proj: any) {
    const project = this.standloneProjects.find((_proj: any) => _proj.id === proj.id);
    project.checked = !project.checked;
    this.changedSelection = true;
    this.getMatTriggerForWorkspaceSelection();
  }
  onSerachTextChange(eventArgs: any) {
    this.searchText = eventArgs.target.value;

    this.standloneProjects?.forEach((proj: any) => {
      proj.visible = proj.name.toLowerCase().includes(this.searchText.toLowerCase());
    });

    this.hasStandloneProjects = this.standloneProjects?.some((proj: any) => proj.visible);
  }
  filterLeafNode(node: any) {
    if (!this.searchText) {
      return true;
    }
    return (
      node?.name?.toLowerCase().includes(this.searchText.toLowerCase()) || node?.parent?.title?.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }
  filterParentNode(node: any) {
    if (!this.searchText) {
      return true;
    } else {
      const indexOfnode = node?.title?.toLowerCase().indexOf(this.searchText.toLowerCase());
      if (indexOfnode === -1) {
        if (node.projects && Array.isArray(node.projects)) {
          return node.projects.some((proj: any) => proj?.name?.toLowerCase().indexOf(this.searchText.toLowerCase()) !== -1);
        } else {
          return false;
        }
      } else {
        return true;
      }
    }
  }
  checkAvailablePref() {
    if (this.prefName) {
      let prefDetails: any = this.storageService.getFromLocalStorage(this.prefName);
      if (prefDetails) {
        try {
          prefDetails = Encryption._doDecrypt(prefDetails);
          prefDetails = prefDetails ? JSON.parse(prefDetails) : null;

          if (prefDetails && prefDetails?.projects) {
            prefDetails?.projects?.forEach((__project: any) => {
              const node: any = this.projectSelectionDataSource.data.find(
                (workspace: any) =>
                  workspace?.projects &&
                  Array.isArray(workspace.projects) &&
                  workspace.projects.some((project: any) => project?.id?.toString() === __project?.id?.toString())
              );
              if (node) {
                const projectNode = node.projects.find((project: any) => project.id.toString() === __project?.id?.toString());
                if (projectNode) {
                  projectNode.selected = true;
                  this.selectedOptions.push(projectNode);
                }
                const isSingleProjectNode = node.projects.every((project: any) => project.selected);
                if (isSingleProjectNode) {
                  node.selected = true;
                  this.selectedOptions.push(node);
                }
              }
              const standloneProj = this.standloneProjects.find((proj: any) => proj?.id?.toString() === __project?.id?.toString());
              if (standloneProj) {
                standloneProj.checked = true;
              }
            });
            return;
          }
        } catch (error: any) {
          // console.log();
        }
      }
    }
    this.updateNodeSelection(this.projectSelectionDataSource.data, true);
    this.standloneProjects.forEach((proj: any) => {
      proj.checked = true;
    });
  }
}
