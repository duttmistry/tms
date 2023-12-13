import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashBoardRoutingModule } from './dashboard-routing.module';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MyTasksComponent } from './dashboard/my-tasks/my-tasks.component';
import { MyTeamTasksComponent } from './dashboard/my-team-tasks/my-team-tasks.component';
import { GeneralInfoComponent } from './dashboard/general-info/general-info.component';
import { ProjectsInfoComponent } from './dashboard/projects-info/projects-info.component';
import { SharedModule } from '../../shared/shared.module';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomMatPaginator } from '../../core/services/common/customMatPaginator';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DefaultMatCalendarRangeStrategy, MAT_DATE_RANGE_SELECTION_STRATEGY } from '@angular/material/datepicker';
import { PkgPopupModule } from '@tms-workspace/popup';
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
  declarations: [DashboardComponent, MyTasksComponent, MyTeamTasksComponent, GeneralInfoComponent, ProjectsInfoComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DashBoardRoutingModule, UiMaterialControlsModule, SharedModule, PkgPopupModule],
  schemas: [NO_ERRORS_SCHEMA],
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
})
export class DashboardModule {}

// providers: [{ provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }],
