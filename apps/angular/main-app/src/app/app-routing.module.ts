import { NgModule } from '@angular/core';
import { RouterModule, Routes, CanLoad, CanActivate } from '@angular/router';
import { LayoutComponent } from './core/components/layout/layout.component';
import { AuthGuard } from './core/services/gaurds/auth/auth.guard';

import { LoginComponent } from './core/components/login/login.component';
import { ModulePermissionGuard } from './core/services/gaurds/permission/module-permission.guard';
import { PageNotFoundComponent } from './shared/components/page-not-found/page-not-found.component';
import { UnauthorizedAccessComponent } from './shared/components/unauthorized-access/unauthorized-access.component';
import { ActionPermissionGuard } from './core/services/gaurds/permission/action-permission.guard';
import { MaintenanceComponent } from './core/components/maintenance/maintenance.component';
import { BreakTimeComponent } from './core/components/break-time/break-time.component';
import { BreakTimeAuthGuard } from './core/services/gaurds/break-time-auth/break-time-auth.guard';
import { BackFromBackGuard } from './core/services/gaurds/break-time-auth/back-from-back.guard';
import { SetPreferenceComponent } from './core/components/set-preference/set-preference.component';
import { IspreferenceGuard } from './core/services/gaurds/preference/ispreference.guard';
import { PreferenceGuard } from './core/services/gaurds/preference/preference.guard';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthGuard, PreferenceGuard],
  },
  {
    path: 'maintenance',
    component: MaintenanceComponent,
  },
  {
    path: 'breaktime',
    canActivate: [BreakTimeAuthGuard],
    component: BreakTimeComponent,
  },
  {
    path: 'setpreferences',
    component: SetPreferenceComponent,
    canActivate: [IspreferenceGuard],
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./modules/dashboard/dashboard.module').then((m) => m.DashboardModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'dashboard',
        },
      },
      {
        path: 'documents',
        loadChildren: () => import('./modules/documents/documents.module').then((m) => m.DocumentsModule),
        canLoad: [AuthGuard, PreferenceGuard],
      },
      {
        path: 'users',
        loadChildren: () => import('./modules/user/user.module').then((m) => m.UserModule),
        canLoad: [AuthGuard, PreferenceGuard],
      },
      {
        path: 'workspace',
        loadChildren: () => import('./modules/workspace/workspace.module').then((m) => m.WorkspaceModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'workspace',
        },
      },
      {
        path: 'project',
        loadChildren: () => import('./modules/projects/projects.module').then((m) => m.ProjectsModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'project',
        },
      },
      {
        path: 'site-settings',
        loadChildren: () => import('./modules/site-settings/site-settings.module').then((m) => m.SiteSettingsModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'site_settings',
        },
      },
      {
        path: 'permissions',
        loadChildren: () => import('./modules/permissions/permissions.module').then((m) => m.PermissionModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'permissions',
        },
      },
      {
        path: 'tasks',
        loadChildren: () => import('./modules/task/task.module').then((m) => m.TaskModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'tasks',
        },
      },
      {
        path: 'holiday',
        loadChildren: () => import('./modules/holiday/holiday.module').then((m) => m.HolidayModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'holiday',
        },
      },
      {
        path: 'leave',
        loadChildren: () => import('./modules/leave/leave.module').then((m) => m.LeaveModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'leaves',
        },
      },
      {
        path: 'attendance',
        loadChildren: () => import('./modules/attendance/attendance.module').then((m) => m.AttendanceModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'leaves',
        },
      },
      {
        path: 'administration',
        loadChildren: () => import('./modules/administration/administration.module').then((m) => m.AdministrationModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'admin_dashboard',
        },
      },
      {
        path: 'preferences',
        loadChildren: () => import('./modules/preferences/preferences.module').then((m) => m.PreferencesModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'preferences',
        },
      },
      {
        path: 'reports',
        loadChildren: () => import('./modules/reports/reports.module').then((m) => m.ReportsModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'reports',
        },
      },
      {
        path: 'notifications',
        loadChildren: () => import('./modules/notifications/notifications.module').then((m) => m.NotificationsModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'notifications',
        },
      },
      {
        path: 'templates',
        loadChildren: () => import('./modules/templates/templates.module').then((m) => m.TemplatesModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'templates',
        },
      },
      {
        path: 'help',
        loadChildren: () => import('./modules/help/help.module').then((m) => m.HelpModule),
        canLoad: [AuthGuard, PreferenceGuard],
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'help',
        },
      },
      {
        path: 'page-not-found',
        canActivate: [BackFromBackGuard, PreferenceGuard],
        component: PageNotFoundComponent,
      },
      {
        path: 'unauthorized-access',
        canActivate: [BackFromBackGuard, PreferenceGuard],
        component: UnauthorizedAccessComponent,
      },
      {
        path: '**',
        redirectTo: 'page-not-found',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'page-not-found',
    pathMatch: 'full',
    canLoad: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking' })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
