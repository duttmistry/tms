import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ProjectsService } from '../../../core/services/module/projects/projects.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { Subscription } from 'rxjs';
import { FlatTreeControl, TreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { PreferencesService } from '../../../core/services/module/preferences/preferences.service';
interface INotification {
  module_name: string;
  id: string;
  notify?: boolean;
  children?: INotification[];
}

interface NotificationFlatNode {
  expandable: boolean;
  module_name: string;
  notify: boolean;
  level: number;
}
@Component({
  selector: 'main-app-pref-project',
  templateUrl: './pref-project.component.html',
  styleUrls: ['./pref-project.component.scss'],
})
export class PrefProjectComponent implements OnInit, OnDestroy {
  projectControl = new FormControl('');
  projectList: any[] = [];
  subscriptions: Subscription[] = [];
  displayedColumns: string[] = ['module_name', 'notify'];
  treeFlattener: any;
  treeControl = new FlatTreeControl<NotificationFlatNode>(
    (node) => node.level,
    (node) => node.expandable
  );
  dataSource: any;
  public options = ['True', 'False'];
  checked!: boolean;
  constructor(private projectService: ProjectsService, private spinnerService: SpinnerService, private preferenceService: PreferencesService) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      (node) => node.level,
      (node) => node.expandable,
      (node) => node.children
    );
  }
  ngOnInit(): void {
    // console.log('ngOnInit call');

    this.getProjectList();
    this.getPreferenceList();
  }

  getProjectList() {
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.projectService.getAllProjects().subscribe(
        (resonse) => {
          this.projectList = resonse.list ? resonse.list : [];
          this.spinnerService.hideSpinner();
        },
        (error) => {
          this.spinnerService.hideSpinner();
          console.log('error:', error);
        }
      )
    );
  }

  onSelectProject() {
    // console.log('project', this.projectControl.value);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private transformer = (node: INotification, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.module_name,
      id: node.id,
      notify: node.notify,
      level: level,
    };
  };

  onChangeStatus(event: any) {
    // console.log('Toggle button change event', event, this.dataSource.data);
  }

  getPreferenceList() {
    try {
      this.preferenceService.getPreferenceList().subscribe((res: any) => {
        // console.log('pref list', res);
        let projPref;
        if (res && res.data) {
          const { Projects } = res.data;
          // console.log('Projects ', Projects);
          projPref = Projects.map((m: any, index: number) => ({
            module_name: 'project' + index,
            id: 'project_' + index,
            notify: m.is_notify || false,
            children: m.children.map((child: any, ind: number) => ({
              module_name: child.action_name,
              notify: child.is_notify || false,
              id: this.generateNodeId(child.action_name) + '_' + ind,
            })),
          }));
          // console.log('PROJ PREF', projPref);
          this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
          this.dataSource.data = projPref;
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  generateNodeId(str: string) {
    return str.replace(/\s+/g, '_').toLowerCase();
  }

  onCancelClick() {
    // console.log('onCancelClick');
  }

  onSaveClick() {
    // console.log('this.dataSource.data', this.dataSource.data);
  }
}
