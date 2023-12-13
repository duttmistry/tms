import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MAT_CHIPS_DEFAULT_OPTIONS } from '@angular/material/chips';
import { SharedModule } from '../../shared/shared.module';
import { UserRoleComponent } from './user-role/user-role.component';
import { ContainerComponent } from './container/container.component';
import { RolesComponent } from './roles/roles.component';
import { RolePermissionComponent } from './role-permission/role-permission.component';
import { PermissionRoutingModule } from './permission-routing.module';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomMatPaginator } from '../../core/services/common/customMatPaginator';

@NgModule({
  declarations: [UserRoleComponent, ContainerComponent, RolesComponent, RolePermissionComponent],
  providers: [
    {
      provide: MAT_CHIPS_DEFAULT_OPTIONS,
      useValue: {
        separatorKeyCodes: [ENTER, COMMA],
      },
    },
    {
      provide: MatPaginatorIntl,
      useClass: CustomMatPaginator,
    },
  ],
  imports: [CommonModule, PermissionRoutingModule, UiMaterialControlsModule, FormsModule, ReactiveFormsModule, SharedModule],
})
export class PermissionModule {}
