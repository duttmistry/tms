import { Inject, InjectionToken, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotificationsComponent } from './notifications/notifications.component';
import { TimingConfigurationComponent } from './timing-configuration/timing-configuration.component';
import { TagsComponent } from './tags/tags.component';
import { ModulePermissionGuard } from '../../core/services/gaurds/permission/module-permission.guard';
import { SiteSettingsContainerComponent } from './site-settings-container/site-settings-container.component';
import { LeaveAdminComponent } from './leave-admin/leave-admin.component';
import { PermissionService } from '../../core/services/module/settings/permission/permission.service';
import { CeoProfileComponent } from './ceo-profile/ceo-profile.component';
import { NetworkConfigurationComponent } from './netowrk-configuration/network-configuration.component';

const routes: Routes = [
  {
    path: '',
    component: SiteSettingsContainerComponent,
    children: [
      // {
      //   path: '',
      //   redirectTo: 'leave',
      //   pathMatch: 'full',
      // },
      // {
      //   path: 'notifications',
      //   component: NotificationsComponent,
      //   // canMatch: [ModulePermissionGuard],
      //   data: {
      //     name: 'settings.notifications',
      //   },
      // },
      {
        path: 'leave',
        component: LeaveAdminComponent,
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'site_settings.leave',
        },
      },
      {
        path: 'timing-config',
        component: TimingConfigurationComponent,
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'site_settings.timing_configuration',
        },
      },
      {
        path: 'tags',
        component: TagsComponent,
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'site_settings.tags',
        },
      },
      {
        path: 'user_configuration',
        component: CeoProfileComponent,
        // canMatch: [ModulePermissionGuard],
        data: {
          name: 'site_settings.user_config',
        },
      },
      {
        path: 'network_configuration',
        component: NetworkConfigurationComponent,
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'site_settings.network_configuration',
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SiteSettingsRoutingModule {}
