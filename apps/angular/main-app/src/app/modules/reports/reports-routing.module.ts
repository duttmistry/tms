import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportLayoutComponent } from './report-layout/report-layout.component';
import { WorkReportComponent } from './work-report/work-report.component';
import { ActionPermissionGuard } from '../../core/services/gaurds/permission/action-permission.guard';
import { ProjectReportComponent } from './project-report/project-report.component';
import { TaskReportComponent } from './task-report/task-report.component';
import { TimingReportComponent } from './timing-report/timing-report.component';
import { LeavesComponent } from './leaves/leaves.component';
import { BillingConfigurationComponent } from './billing-configuration/billing-configuration.component';
import { BillingDetailsFormComponent } from './billing-details-form/billing-details-form.component';
import { ReportsComponent } from './reports/reports.component';
import { LeaveMasterDataComponent } from './leave-master-data/leave-master-data.component';
import { AttendancesComponent } from './attendances/attendances.component';

const routes: Routes = [
  {
    path: '',
    component: ReportLayoutComponent,
  },
  {
    path: 'manual-update-leaves',
    component: LeavesComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'reports.leave_management',
      actionType: 'view',
    },
  },
  {
    path: 'billing-configuration',
    component: BillingConfigurationComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'reports.billing_configuration',
      actionType: 'view',
    },
  },
  {
    path: 'billing-configuration/:id',
    component: BillingDetailsFormComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'reports.billing_configuration',
      actionType: 'view',
    },
  },
  {
    path: 'work-reports',
    component: WorkReportComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'reports.work_reports',
      actionType: 'view',
    },
  },
  {
    path: 'current-leave-details',
    component: ReportsComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'reports.current_leave_details',
      actionType: 'view',
    },
  },
  {
    path: 'project-reports',
    component: ProjectReportComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'reports.project_reports',
      actionType: 'view',
    },
  },
  {
    path: 'attendance',
    component: AttendancesComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'reports.attendance_report',
      actionType: 'view',
    },
  },
  {
    path: 'leave-master-data',
    component: LeaveMasterDataComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'reports.leave_master_data',
      actionType: 'view',
    },
  },
  {
    path: 'task-reports',
    component: TaskReportComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'reports.task_reports',
      actionType: 'view',
    },
  },
  {
    path: 'timing-reports',
    component: TimingReportComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'reports.timing_report',
      actionType: 'view',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule {}
