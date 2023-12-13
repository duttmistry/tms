import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { HolidaysComponent } from './holidays/holidays.component';
import { HolidayRoutingModule } from './holiday-routing.module';
import { AddHolidayComponent } from './add-holiday/add-holiday.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter, MomentDateModule } from '@angular/material-moment-adapter';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FullCalendarModule } from '@fullcalendar/angular';
import { SharedModule } from '../../shared/shared.module';
const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'MM/DD/YYYY',
  },
  display: {
    dateInput: 'DD, MMM YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
@NgModule({
  imports: [
    CommonModule,
    MomentDateModule,
    MatDatepickerModule,
    UiMaterialControlsModule,
    HolidayRoutingModule,
    ReactiveFormsModule,
    FullCalendarModule,
    SharedModule,
  ],
  declarations: [HolidaysComponent, AddHolidayComponent],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
})
export class HolidayModule {}
