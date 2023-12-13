import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AddLeaveComponent } from './add-leave/add-leave.component';
import { RouterModule } from '@angular/router';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { LeaveRoutingModule } from './leave-routing.module';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter, MomentDateModule } from '@angular/material-moment-adapter';
import { NgChartsModule } from 'ng2-charts';
import { DefaultMatCalendarRangeStrategy, MatDatepickerModule, MAT_DATE_RANGE_SELECTION_STRATEGY } from '@angular/material/datepicker';
import { TeamLeaveComponent } from './team-leave-container/team-leave/team-leave.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { LeaveViewComponent } from './leave-view/leave-view.component';

import { TeamLeaveContainerComponent } from './team-leave-container/team-leave-container.component';
import { LeaveDetailsComponent } from './leave-details/leave-details.component';
import { LeaveApprovalComponent } from './leave-approval/leave-approval.component';
import { SharedModule } from '../../shared/shared.module';
import { LeavesTransactionHistoryComponent } from './leaves-transaction-history/leaves-transaction-history.component';
import { CustomCalendarComponent } from './custom-calendar/custom-calendar.component';
import { AddLeaveContainerComponent } from './add-leave-container/add-leave-container.component';
import { LeaveApprovalDialogComponent } from './leave-approval-dialog/leave-approval-dialog.component';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomMatPaginator } from '../../core/services/common/customMatPaginator';
import { LeaveHistoryComponent } from './leave-history/leave-history.component';

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
    LeaveDetailsComponent,
    LeaveApprovalComponent,
    AddLeaveComponent,
    AddLeaveContainerComponent,
    LeaveViewComponent,
    TeamLeaveComponent,
    TeamLeaveContainerComponent,
    LeavesTransactionHistoryComponent,
    CustomCalendarComponent,
    LeaveApprovalDialogComponent,
    LeaveHistoryComponent,
  ],
  imports: [
    CommonModule,
    MomentDateModule,
    MatDatepickerModule,
    UiMaterialControlsModule,
    RouterModule,
    LeaveRoutingModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule,
    NgChartsModule,
    FullCalendarModule,
  ],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: CustomMatPaginator,
    },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
      useClass: DefaultMatCalendarRangeStrategy,
    },
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class LeaveModule {}
