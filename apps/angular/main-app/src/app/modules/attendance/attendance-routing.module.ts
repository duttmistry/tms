import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttendanceCalendarComponent } from './attendance-calendar/attendance-calendar.component';
import { ActionPermissionGuard } from '../../core/services/gaurds/permission/action-permission.guard';

const routes: Routes = [
  {
    path: '',
    component: AttendanceCalendarComponent,
    canMatch: [ActionPermissionGuard],
    data: {
      moduleName: 'attendance',
      actionType: 'view',
    },
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AttendanceRoutingModule {}
