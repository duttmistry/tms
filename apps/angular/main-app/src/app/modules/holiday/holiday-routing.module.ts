import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddHolidayComponent } from './add-holiday/add-holiday.component';
import { HolidaysComponent } from './holidays/holidays.component';

const routes: Routes = [
  { path: '', component: HolidaysComponent },
  // { path: 'add', component: AddHolidayComponent },
  // { path: 'edit/:id', component: AddHolidayComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HolidayRoutingModule {}
