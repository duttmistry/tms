import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HelpRoutingModule } from './help-routing.module';
import { HelpComponent } from './help/help.component';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';

@NgModule({
  declarations: [HelpComponent],
  imports: [CommonModule, HelpRoutingModule, UiMaterialControlsModule],
  schemas: [NO_ERRORS_SCHEMA],
})
export class HelpModule {}
