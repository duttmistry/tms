import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActionPermissionGuard } from '../../core/services/gaurds/permission/action-permission.guard';
import { AddProjectContainerComponent } from './add-project-container/add-project-container.component';
import { ProjectSettingComponent } from './project-setting/project-setting.component';
import { ProjectsComponent } from './projects/projects.component';
import { ACTION_CONSTANTS, MODULE_CONSTANTS } from '../../core/services/common/constants';
const routes: Routes = [
  {
    path: '',
    component: ProjectsComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: MODULE_CONSTANTS.PROJECT,
      actionType: ACTION_CONSTANTS.VIEW,
    },
  },

  {
    path: 'add',
    component: AddProjectContainerComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: MODULE_CONSTANTS.PROJECT,
      actionType: ACTION_CONSTANTS.CREATE,
    },
  },
  {
    path: 'edit/:id',
    component: AddProjectContainerComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: MODULE_CONSTANTS.PROJECT,
      actionType: ACTION_CONSTANTS.EDIT,
    },
  },
  {
    path: 'settings/:id',
    component: ProjectSettingComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: MODULE_CONSTANTS.PROJECT,
      actionType: ACTION_CONSTANTS.SETTINGS,
    },
  },
  // {
  //   path: ':id',
  //   component: ProjectsComponent,
  //   canMatch: [ActionPermissionGuard],
  //   data: {
  //     moduleName: MODULE_CONSTANTS.PROJECT,
  //     actionType: ACTION_CONSTANTS.VIEW,
  //   },
  // },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectRoutingModule {}
