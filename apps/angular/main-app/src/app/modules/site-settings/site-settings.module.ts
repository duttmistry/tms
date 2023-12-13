import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TimingConfigurationComponent } from './timing-configuration/timing-configuration.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { TagsComponent } from './tags/tags.component';
import { SiteSettingsRoutingModule } from './site-settings-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { MAT_CHIPS_DEFAULT_OPTIONS } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { SiteSettingsContainerComponent } from './site-settings-container/site-settings-container.component';
import { LeaveAdminComponent } from './leave-admin/leave-admin.component';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomMatPaginator } from '../../core/services/common/customMatPaginator';
import { CeoProfileComponent } from './ceo-profile/ceo-profile.component';
import { NetworkConfigurationComponent } from './netowrk-configuration/network-configuration.component';

@NgModule({
  declarations: [
    SiteSettingsContainerComponent,
    LeaveAdminComponent,
    TimingConfigurationComponent,
    NotificationsComponent,
    TagsComponent,
    CeoProfileComponent,
    NetworkConfigurationComponent,
  ],
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

  imports: [CommonModule, SiteSettingsRoutingModule, UiMaterialControlsModule, FormsModule, ReactiveFormsModule, SharedModule],
  exports: [CeoProfileComponent],
})
export class SiteSettingsModule {}
