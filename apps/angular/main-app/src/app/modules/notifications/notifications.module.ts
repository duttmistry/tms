import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotificationsRoutingModule } from './notifications-routing.module';
import { NotificationsComponent } from './notifications/notifications.component';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [NotificationsComponent],
  imports: [CommonModule, NotificationsRoutingModule, UiMaterialControlsModule, SharedModule],
})
export class NotificationsModule {}
