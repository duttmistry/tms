import { TaskService } from './../../../core/services/module/tasks/task.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../../core/services/common/storage.service';

@Component({
  selector: 'main-app-task-documents',
  templateUrl: './task-documents.component.html',
  styleUrls: ['./task-documents.component.scss'],
})
export class TaskDocumentsComponent implements OnInit {
  workspaceID: any;
  filterData: any;
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private tasksService: TaskService,
    private storageService: StorageService
  ) {
    this.workspaceID = this.activatedRoute.snapshot.params['id'] || null;
    if (this.workspaceID) {
      // this.tasksService.setWorkspaceId(this.workspaceID);
      const workspaceObject = {
        id: this.workspaceID,
      };
      this.storageService.setIntoLocalStorage('workspace', JSON.stringify(workspaceObject));
    }
  }

  ngOnInit() {
    this.tasksService.currentFilteredData.subscribe((data: any) => (this.filterData = data));
  }

  navigateToGivenPath(path: string) {
    const workspaceFromStorage = this.storageService.getFromLocalStorage('workspace');
    let workspaceId;
    if (workspaceFromStorage) {
      workspaceId = JSON.parse(workspaceFromStorage).id || '';
    }
    this.router.navigate([path, workspaceId || '']);
  }
}
