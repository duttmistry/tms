import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing.module';
import { ReportLayoutComponent } from './report-layout/report-layout.component';
import { WorkReportComponent } from './work-report/work-report.component';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FreeUserListComponent } from './work-report/free-user-list/free-user-list.component';
import { LoggedOutUserListComponent } from './work-report/logged-out-user-list/logged-out-user-list.component';
import { NotLoggedInUserListComponent } from './work-report/not-logged-in-user-list/not-logged-in-user-list.component';
import { OnLeaveUserListComponent } from './work-report/on-leave-user-list/on-leave-user-list.component';
import { ProjectReportComponent } from './project-report/project-report.component';
import { SharedModule } from '../../shared/shared.module';
import { WorkingUserListComponent } from './work-report/working-user-list/working-user-list.component';
import { TaskReportComponent } from './task-report/task-report.component';
import { TimingReportComponent } from './timing-report/timing-report.component';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DefaultMatCalendarRangeStrategy, MAT_DATE_RANGE_SELECTION_STRATEGY } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ReportsComponent } from './reports/reports.component';
import { BillingConfigurationComponent } from './billing-configuration/billing-configuration.component';
import { BillingDetailsFormComponent } from './billing-details-form/billing-details-form.component';
import { AttendancesComponent } from './attendances/attendances.component';
import { LeavesComponent } from './leaves/leaves.component';
import { LeaveMasterDataComponent } from './leave-master-data/leave-master-data.component';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomMatPaginator } from '../../core/services/common/customMatPaginator';
const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'MM/DD/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@NgModule({
  declarations: [
    ReportLayoutComponent,
    WorkReportComponent,
    ProjectReportComponent,
    FreeUserListComponent,
    LoggedOutUserListComponent,
    NotLoggedInUserListComponent,
    OnLeaveUserListComponent,
    WorkingUserListComponent,
    TaskReportComponent,
    TimingReportComponent,
    ReportsComponent,
    BillingConfigurationComponent,
    BillingDetailsFormComponent,
    AttendancesComponent,
    LeavesComponent,
    LeaveMasterDataComponent,
  ],
  imports: [
    FormsModule,
    CommonModule,
    ReportsRoutingModule,
    UiMaterialControlsModule,
    SharedModule,
    ReactiveFormsModule,
    NgxDaterangepickerMd.forRoot(),
  ],
  exports: [TimingReportComponent],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
      useClass: DefaultMatCalendarRangeStrategy,
    },
    {
      provide: MatPaginatorIntl,
      useClass: CustomMatPaginator,
    },
  ],
})
export class ReportsModule {}
