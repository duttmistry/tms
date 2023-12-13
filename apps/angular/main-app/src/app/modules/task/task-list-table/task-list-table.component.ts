import { TaskListTableService } from './task-list-table.service';
import { Component, AfterViewInit, OnInit, Input } from '@angular/core';
import { TableField, TablePagination, TableService, TableSetting } from 'dynamic-mat-table';
import { BehaviorSubject } from 'rxjs';
import { paginationConfig, tableListColumnsConfig, tableSettingsConfig } from './task-table-config';
import { TaskService } from '../../../core/services/module/tasks/task.service';

@Component({
  selector: 'main-app-task-list-table',
  templateUrl: './task-list-table.component.html',
  styleUrls: ['./task-list-table.component.scss'],
  providers: [TableSetting],
})
export class TaskListTableComponent implements OnInit {
  columns: TableField<any>[] = tableListColumnsConfig;
  settings: TableSetting = tableSettingsConfig;
  pagination: TablePagination = paginationConfig;
  currentState: any;
  projectObjects = {};
  taskList: any = [];
  constructor(private tls: TaskListTableService, private tasksService: TaskService) {
    this.getTaskData();
  }

  ngOnInit(): void {
    this.tls.setTableConfigSetting(tableListColumnsConfig);
  }


  getTaskData() {
    this.tasksService.getProjectWiseTasks().subscribe((projectWiseTask) => {
      if (projectWiseTask && projectWiseTask.length > 0) {
        const newData = projectWiseTask;
        const projectTasksMap = newData.reduce((map: any, task: any) => {
          const projectId = task?.project_id ? task?.project_id.toString() : '';
          this.currentState = task?.state;
          if (!map[projectId]) {
            map[projectId] = {
              projectTitle: task?.projects?.name || '-',
              projectKey: task?.projectKey || '-',
              projectTaskCount: task?.projectTaskCount || 0,
              isShowNewTask: false,
              projectId: parseInt(projectId),
              projectTasks: [],
            };
          }
          map[projectId].projectTasks.push(task);
          return map;
        }, []);

        // Convert the project tasks map to an array of project objects
        this.projectObjects = Object.values(projectTasksMap);
        this.taskList = this.projectObjects;
        // need task list as BehaviorSubject for table so converted on BehaviorSubject
        for (const projectTasks of this.taskList) {
          projectTasks.projectTasks = new BehaviorSubject(projectTasks.projectTasks);
        }
      } else {
        this.taskList = [];
      }
    });
  }

  onChangeTableSetting(ev: any) {
    // console.log('onChangeTableSetting call=>>', { event: ev });
    this.tls.setTableConfigSetting(tableListColumnsConfig);
    const { columnSetting } = ev.setting;
    this.columns = columnSetting;
  }
  onTableEvent(ev: any) {
    // console.log('onTableEvent event=>>', ev);
    if (ev && ev.event === 'SortChanged') {
      // console.log('SORTING CHANGE');
    }
  }
  onRowClick(ev: any) {
    // console.log('onRowClick event=>>', ev);
  }
  onRowSelectionChange(ev: any) {
    // console.log('onRowSelectionChange event=>>', ev);
  }
  applySorting(ev: any) {
    // console.log('applySorting event', ev);
  }

  onColumnMenuDropped(ev: any) {
    // console.log('onColumnMenuDropped event', ev);
  }
}
