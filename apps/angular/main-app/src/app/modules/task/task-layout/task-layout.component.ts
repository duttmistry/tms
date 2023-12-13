import { TaskDocumentsComponent } from './../task-documents/task-documents.component';
import { TaskBoardComponent } from './../task-board/task-board.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { TaskListComponent } from '../task-list/task-list.component';

@Component({
  selector: 'main-app-task-layout',
  templateUrl: './task-layout.component.html',
  styleUrls: ['./task-layout.component.scss'],
  providers: [TaskListComponent, TaskBoardComponent, TaskDocumentsComponent],
})
export class TaskLayoutComponent {
  workspaceID: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public taskListComp: TaskListComponent,
    public taskBoardComp: TaskBoardComponent,
    public taskDocumentsComp: TaskDocumentsComponent
  ) {
    this.workspaceID = this.activatedRoute.snapshot.params['id'] || null;
  }



  navigateToSelectedPath(event: any) {
    // console.log('path::', event);
    this.router.url.includes('tasks/list')
      ? this.taskListComp.navigateToGivenPath(event.path)
      : this.router.url.includes('tasks/board')
      ? this.taskBoardComp.navigateToGivenPath(event.path)
      : this.router.url.includes('tasks/docs')
      ? this.taskDocumentsComp.navigateToGivenPath(event.path)
      : this.router.navigate([event.path]);
  }
}
