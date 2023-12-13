import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Output, EventEmitter, OnInit, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Subscription } from 'rxjs';
import { ProjectsRequestDataModel } from '../../../core/model/task/task.model';
import { TaskService } from '../../../core/services/module/tasks/task.service';
import { FormControl } from '@angular/forms';

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
}
//#endregion

@Component({
  selector: 'main-app-project-selection',
  templateUrl: './project-selection.component.html',
  styleUrls: ['./project-selection.component.scss'],
})
export class ProjectSelectionComponent implements OnDestroy, OnChanges {
  @Output() getSelectedProjects = new EventEmitter<any[]>();
  subscriptions: Subscription[] = [];
  @Input() projectList: any = [];
  @Input() selctedProjects: any = [];
  projectFormControl = new FormControl();
  changedSelection = false;
  filteredList = [...this.projectList];
  @Input() isInProjectReport = false;
  searchControl = new FormControl('');
  constructor(private taskService: TaskService) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.filteredList = changes['projectList']?.currentValue || this.filteredList;
    this.projectList = changes['projectList']?.currentValue || this.filteredList;

    if (changes['selctedProjects'] && changes['selctedProjects'].currentValue) {
      this.projectFormControl.patchValue(changes['selctedProjects'].currentValue);
    } else {
      if (changes['projectList'] && changes['projectList'].currentValue) {
        this.projectFormControl.patchValue(changes['projectList'].currentValue);
      }
    }
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((_subscription: Subscription) => _subscription?.unsubscribe());
  }
  // getProjectsData() {
  //   const requestBody: ProjectsRequestDataModel = {
  //     status: true,
  //     custom_fields: false,
  //     tag: false,
  //     team: true,
  //     billing_configuration: false,
  //     documents: false,
  //     workspace: true,
  //   };
  //   this.subscriptions.push(
  //     this.taskService.getProjectsData(requestBody).subscribe({
  //       next: (response: any) => {
  //         if (response) {
  //           if (response.data) {
  //             if (response.data.list) {
  //               this.pojectList = response.data.list;
  //               this.selectAll();
  //               this.getSelectedProjectList(false);
  //             }
  //           }
  //         }
  //       },
  //     })
  //   );
  // }

  selectAll() {
    const additionalItems = this.filteredList.filter((project: any) => this.selctedProjects.findIndex((proj: any) => proj.id === project.id) === -1);
    this.selctedProjects = [...this.selctedProjects, ...additionalItems];

    this.projectFormControl.patchValue([...this.selctedProjects]);
    this.changedSelection = true;
  }
  clearAll() {
    this.changedSelection = true;
    const itemsAfterRemoved = this.selctedProjects.filter(
      (project: any) => this.filteredList.findIndex((proj: any) => proj.id === project.id) === -1
    );
    this.selctedProjects = [...itemsAfterRemoved];

    this.projectFormControl.patchValue([...this.selctedProjects]);
  }
  getSelectedProjectList(eventArgs: any) {
    if (this.changedSelection && !eventArgs) {
      this.changedSelection = false;
      this.getSelectedProjects.emit(this.selctedProjects);
    }
    this.searchControl.patchValue('');
    this.filteredList = [...this.projectList];
  }
  onChangeSearch(eventArgs: any) {
    this.filteredList = this.projectList.filter((proj: any) => proj.name.toLowerCase().includes(eventArgs.target.value.toLowerCase()));
    this.projectFormControl.patchValue(this.selctedProjects);
  }
  checkChange(project: any) {
    const index = this.selctedProjects.findIndex((proj: any) => proj.id === project.id);
    if (index !== -1) {
      this.selctedProjects.splice(index, 1);
    } else {
      this.selctedProjects.push(project);
    }
    this.projectFormControl.patchValue(this.selctedProjects);
  }
}
