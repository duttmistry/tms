import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActionPermissionGuard } from '../../core/services/gaurds/permission/action-permission.guard';
import { AddWorkspaceContainerComponent } from './add-workspace-container/add-workspace-container.component';
import { WorkspaceComponent } from './workspace/workspace.component';
import { ACTION_CONSTANTS, MODULE_CONSTANTS } from '../../core/services/common/constants';

const routes: Routes = [
  {
    path: '',
    component: WorkspaceComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: MODULE_CONSTANTS.WORKSPACE,
      actionType: ACTION_CONSTANTS.VIEW,
    },
  },
  {
    path: 'add',
    component: AddWorkspaceContainerComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: MODULE_CONSTANTS.WORKSPACE,
      actionType: ACTION_CONSTANTS.CREATE,
    },
  },
  {
    path: 'edit/:id',
    component: AddWorkspaceContainerComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: MODULE_CONSTANTS.WORKSPACE,
      actionType: ACTION_CONSTANTS.EDIT,
    },
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkspaceRoutingModule {}
