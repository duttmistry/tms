import { AdministrationLayoutComponent } from './administration-layout/administration-layout.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
const routes: Routes = [
  { path: '', component: AdministrationLayoutComponent },

  // {
  //   path: 'manual-update-leaves',
  //   component: LeavesComponent,
  //   canMatch: [ActionPermissionGuard],
  //   data: {
  //     moduleName: 'admin_dashboard.leave_management',
  //     actionType: 'view',
  //   },
  // },
  // {
  //   path: 'billing-configuration',
  //   component: BillingConfigurationComponent,
  //   canMatch: [ActionPermissionGuard],
  //   data: {
  //     moduleName: 'admin_dashboard.billing_configuration',
  //     actionType: 'view',
  //   },
  // },
  // {
  //   path: 'billing-configuration/:id',
  //   component: BillingDetailsFormComponent,
  //   canMatch: [ActionPermissionGuard],
  //   data: {
  //     moduleName: 'admin_dashboard.billing_configuration',
  //     actionType: 'view',
  //   },
  // },
  // {
  //   path: 'reports',
  //   component: ReportsComponent,
  //   canMatch: [ModulePermissionGuard],
  //   data: {
  //     name: 'administration.reports',
  //   }
  // },
  // {
  //   path: 'current-leave-details',
  //   component: ReportsComponent,
  //   canMatch: [ActionPermissionGuard],
  //   data: {
  //     moduleName: 'admin_dashboard.current_leave_details',
  //     actionType: 'view',
  //   },
  // },
  // { path: 'work-reports',
  //   component: WorkReportComponent,
  //   canMatch: [ActionPermissionGuard],
  //   data: {
  //     moduleName: 'administration.reports',
  //     actionType: 'view',
  //   }
  // },
  // {
  //   path: 'attendance',
  //   component: AttendancesComponent,
  //   canMatch: [ActionPermissionGuard],
  //   data: {
  //     moduleName: 'admin_dashboard.attendance',
  //     actionType: 'view',
  //   },
  // },
  // {
  //   path: 'leave-master-data',
  //   component: LeaveMasterDataComponent,
  //   canMatch: [ActionPermissionGuard],
  //   data: {
  //     moduleName: 'admin_dashboard.leave-master-data',
  //     actionType: 'view',
  //   },
  // },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdministrationRoutingModule {}
