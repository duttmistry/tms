import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ModulePermissionGuard } from '../../core/services/gaurds/permission/module-permission.guard';
import { ContainerComponent } from './container/container.component';
import { UserRoleComponent } from './user-role/user-role.component';
import { RolesComponent } from './roles/roles.component';
import { RolePermissionComponent } from './role-permission/role-permission.component';

const routes: Routes = [
  {
    path: '',
    component: ContainerComponent,
    children: [
      {
        path: 'users',
        component: UserRoleComponent,
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'permissions.users',
        },
      },
      {
        path: 'roles',
        component: RolesComponent,
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'permissions.roles',
        },
      },
      {
        path: 'permissions',
        component: RolePermissionComponent,
        canMatch: [ModulePermissionGuard],
        data: {
          name: 'permissions.permissions',
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PermissionRoutingModule {}
