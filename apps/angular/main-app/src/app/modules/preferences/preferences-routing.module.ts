import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PreferencesComponent } from './preferences/preferences.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { ModulePermissionGuard } from '../../core/services/gaurds/permission/module-permission.guard';
import { PrefProjectComponent } from './pref-project/pref-project.component';
import { PrefLeavesComponent } from './pref-leaves/pref-leaves.component';
import { PrefTaskComponent } from './pref-task/pref-task.component';

const routes: Routes = [
  {
    path: '',
    component: PreferencesComponent,
    // children: [
    // {
    //   path: '',
    //   redirectTo: 'notifications',
    //   pathMatch: 'full',
    // },
    // {
    //   path: 'notifications',
    //   component: NotificationsComponent,
    //   canMatch: [ModulePermissionGuard],
    //   data: {
    //     name: 'preferences.notifications',
    //   },
    // },
    // {
    //   path: 'leaves',
    //   component: PrefLeavesComponent,
    //   canMatch: [ModulePermissionGuard],
    //   data: {
    //     name: 'preferences.leaves',
    //   },
    // },
    // {
    //   path: 'task',
    //   component: PrefTaskComponent,
    //   canMatch: [ModulePermissionGuard],
    //   data: {
    //     name: 'preferences.task',
    //   },
    // },
    // ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PreferencesRoutingModule {}
