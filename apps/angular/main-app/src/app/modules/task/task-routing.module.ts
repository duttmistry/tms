import { TaskListComponent } from './task-list/task-list.component';
import { TaskLayoutComponent } from './task-layout/task-layout.component';
import { TaskBoardComponent } from './task-board/task-board.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskDocumentsComponent } from './task-documents/task-documents.component';

import { TaskAddComponent } from './task-add/task-add.component';
import { ActionPermissionGuard } from '../../core/services/gaurds/permission/action-permission.guard';
import { ACTION_CONSTANTS, MODULE_CONSTANTS } from '../../core/services/common/constants';
import { ViewUpdateTaskComponent } from './view-update-task/view-update-task.component';

const routes: Routes = [
  {
    path: 'add',
    component: TaskAddComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: MODULE_CONSTANTS.TASKS,
      actionType: ACTION_CONSTANTS.CREATE,
    },
  },
  {
    path: 'view/:id',
    component: ViewUpdateTaskComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: MODULE_CONSTANTS.TASKS,
      actionType: ACTION_CONSTANTS.EDIT,
    },
  },
  // {
  //   path: 'update/:id',
  //   component: TaskAddComponent,
  //   canMatch: [ActionPermissionGuard],
  //   data: {
  //     moduleName: MODULE_CONSTANTS.TASKS,
  //     actionType: ACTION_CONSTANTS.EDIT,
  //   },
  // },
  {
    path: '',
    component: TaskLayoutComponent,
    children: [
      {
        path: '',
        // component: TaskComponent,
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        component: TaskListComponent,
        canMatch: [ActionPermissionGuard],
        data: {
          moduleName: MODULE_CONSTANTS.PROJECT,
          actionType: ACTION_CONSTANTS.TASKS,
        },
      },

      {
        path: 'list/:id',
        component: TaskListComponent,
        canMatch: [ActionPermissionGuard],
        data: {
          moduleName: MODULE_CONSTANTS.PROJECT,
          actionType: ACTION_CONSTANTS.TASKS,
        },
      },
      {
        path: 'board',
        component: TaskBoardComponent,
        canMatch: [ActionPermissionGuard],
        data: {
          moduleName: MODULE_CONSTANTS.PROJECT,
          actionType: ACTION_CONSTANTS.TASKS,
        },
      },
      {
        path: 'board/:id',
        component: TaskBoardComponent,
        canMatch: [ActionPermissionGuard],
        data: {
          moduleName: MODULE_CONSTANTS.PROJECT,
          actionType: ACTION_CONSTANTS.TASKS,
        },
      },
      {
        path: 'docs',
        component: TaskDocumentsComponent,
        canMatch: [ActionPermissionGuard],
        data: {
          moduleName: MODULE_CONSTANTS.PROJECT,
          actionType: ACTION_CONSTANTS.TASKS,
        },
      },
      {
        path: 'docs/:id',
        component: TaskDocumentsComponent,
        canMatch: [ActionPermissionGuard],
        data: {
          moduleName: MODULE_CONSTANTS.PROJECT,
          actionType: ACTION_CONSTANTS.TASKS,
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TaskRoutingModule {}
