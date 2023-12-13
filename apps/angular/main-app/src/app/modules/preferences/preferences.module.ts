import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PreferencesRoutingModule } from './preferences-routing.module';
import { PreferencesComponent } from './preferences/preferences.component';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { NotificationsComponent } from './notifications/notifications.component';
import { SharedModule } from '../../shared/shared.module';
import { PrefLeavesComponent } from './pref-leaves/pref-leaves.component';
import { PrefProjectComponent } from './pref-project/pref-project.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrefTaskComponent } from './pref-task/pref-task.component';

@NgModule({
  declarations: [PreferencesComponent, NotificationsComponent, PrefLeavesComponent, PrefProjectComponent, PrefTaskComponent],
  imports: [CommonModule, PreferencesRoutingModule, UiMaterialControlsModule, SharedModule, FormsModule, ReactiveFormsModule],
  schemas: [],
})
export class PreferencesModule {}
