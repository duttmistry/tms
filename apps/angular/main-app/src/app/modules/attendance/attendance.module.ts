import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { FullCalendarModule } from '@fullcalendar/angular';
import { AttendanceCalendarComponent } from './attendance-calendar/attendance-calendar.component';
import { AttendanceRoutingModule } from './attendance-routing.module';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [AttendanceCalendarComponent],
  imports: [
    CommonModule,

    UiMaterialControlsModule,
    RouterModule,

    SharedModule,

    FormsModule,
    ReactiveFormsModule,

    FullCalendarModule,
    AttendanceRoutingModule,
  ],
})
export class AttendanceModule {}
