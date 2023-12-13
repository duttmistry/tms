import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeaveApprovalComponent } from './leave-approval/leave-approval.component';
import { LeaveDetailsComponent } from './leave-details/leave-details.component';

import { LeaveViewComponent } from './leave-view/leave-view.component';
import { TeamLeaveContainerComponent } from './team-leave-container/team-leave-container.component';
import { LeavesTransactionHistoryComponent } from './leaves-transaction-history/leaves-transaction-history.component';
import { AddLeaveContainerComponent } from './add-leave-container/add-leave-container.component';
import { ActionPermissionGuard } from '../../core/services/gaurds/permission/action-permission.guard';
import { LeaveHistoryComponent } from './leave-history/leave-history.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'view',
    pathMatch: 'full',
  },
  {
    path: 'view',
    component: LeaveViewComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'leaves',
      actionType: 'dashboard',
    },
  },
  {
    path: 'add',
    component: AddLeaveContainerComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'leaves',
      actionType: 'request_leave',
    },
  },
  {
    path: 'edit/:id',
    component: AddLeaveContainerComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'leaves',
      actionType: 'request_leave',
    },
  },
  {
    path: 'details/:id',
    component: LeaveDetailsComponent,
  },
  {
    path: 'team',
    component: TeamLeaveContainerComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'leaves',
      actionType: 'team_leave',
    },
  },
  {
    path: 'approval',
    component: LeaveApprovalComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'leaves',
      actionType: 'leave_approval',
    },
  },
  {
    path: 'history/:id',
    component: LeaveHistoryComponent,
  },
  {
    path: 'transection-history',
    component: LeavesTransactionHistoryComponent,
  },
  {
    path: 'transection-history/:id',
    component: LeavesTransactionHistoryComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeaveRoutingModule {}
