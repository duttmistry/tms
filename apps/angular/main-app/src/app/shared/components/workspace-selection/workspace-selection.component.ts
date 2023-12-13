import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { WorkspaceService } from '../../../core/services/module/workspace/workspace.service';

@Component({
  selector: 'main-app-workspace-selection',
  templateUrl: './workspace-selection.component.html',
  styleUrls: ['./workspace-selection.component.scss'],
})
export class WorkspaceSelectionComponent implements OnInit {
  @Output() getSelectedWorkspace = new EventEmitter<any>();
  subscriptions: Subscription[] = [];
  workspaceList: any = [];
  @Input() selctedWorkspace: any = [];
  workspaceControl = new FormControl();
  changedSelection = false;
  filteredList = [...this.workspaceList];
  @Input() isInProjectReport = false;
  searchControl = new FormControl('');
  selectedWorkspaceProjects: any = [];
  constructor(private workspaceService: WorkspaceService) {
    // console.log();
  }
  ngOnInit(): void {
    this.getWorkSpaceList();
  }

  onChangeSearch(eventArgs: any) {
    if (eventArgs.target.value.length > 0) {
      this.filteredList = this.workspaceList.filter((proj: any) => proj.title.toLowerCase().includes(eventArgs.target.value.toLowerCase()));
      this.workspaceList = this.filteredList;
      // this.workspaceControl.patchValue([...this.workspaceList]);
    } else {
      this.getWorkSpaceList();
    }
  }
  selectAllWorkspace() {
    // console.log('cosnole.log: ', this.workspaceControl.value);
    this.workspaceControl.patchValue([...this.workspaceList]);
    this.onSelectWorkspace();
  }
  clearAllWorkspace() {
    this.workspaceControl.reset();
    this.searchControl.reset();
    this.getWorkSpaceList();
    const emitObj = {
      data: [],
      isClearAll: true,
    };
    this.getSelectedWorkspace.emit(emitObj);
  }
  checkChange(workspace: any) {
    const index = this.selctedWorkspace.findIndex((proj: any) => proj.id === workspace.id);
    if (index !== -1) {
      this.selctedWorkspace.splice(index, 1);
    } else {
      this.selctedWorkspace.push(workspace);
    }
    this.workspaceControl.patchValue(this.selctedWorkspace);
  }
  onSelectWorkspace(event?: any) {
    this.selectedWorkspaceProjects = [];
    if (event instanceof PointerEvent) {
      event.stopPropagation();
    }
    const selectedWorkspace = this.workspaceControl.value ? this.workspaceControl.value.map((item: any) => item) : [];
    // console.log('selectedWorkspace', selectedWorkspace);
    if (selectedWorkspace && selectedWorkspace.length > 0) {
      // console.log('selectedWorkspaceOptions', { ws: selectedWorkspace });
      selectedWorkspace.forEach((ws: any) => {
        if (ws && ws.projects.length > 0) {
          ws.projects.forEach((proj: any) => {
            if (proj && proj?.id) {
              this.selectedWorkspaceProjects.push(proj);
            }
          });
        }
      });
      const emitObj = {
        data: this.selectedWorkspaceProjects,
        isClearAll: false,
      };
      this.getSelectedWorkspace.emit(emitObj);
    } else {
      const emitObj = {
        data: this.selectedWorkspaceProjects,
        isClearAll: false,
      };
      // console.log('selectedWorkspaceOptions else=-===========', { ws: selectedWorkspace });
      this.getSelectedWorkspace.emit(emitObj);
    }
  }

  getWorkSpaceList(workspace_id?: any) {
    this.workspaceService.getWorkspaceListForFilter().subscribe(
      (res: any) => {
        if (res && res?.data) {
          this.workspaceList = res?.data || [];
          if (workspace_id) {
            const w = this.workspaceList.filter((workspace: any) => workspace.id == workspace_id);
            this.workspaceControl.setValue(w);
          }
        }
      },
      (err: any) => {
        this.workspaceList = [];
        throw err;
      }
    );
  }
}
