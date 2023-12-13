import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListPopupComponent } from './list-popup/list-popup.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { ETAPopupComponent } from './eta-popup/eta-popup.component';
import { LabelsPopupComponent } from './labels-popup/labels-popup.component';
import { PkgCustomDirectivesModule } from '@tms-workspace/custom-directives';
import { MultiUserSelectionPopupComponent } from './multi-user-selection-popup/multi-user-selection-popup.component';
@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, UiMaterialControlsModule, PkgCustomDirectivesModule],
  declarations: [ListPopupComponent, ETAPopupComponent, LabelsPopupComponent, MultiUserSelectionPopupComponent],
  exports: [ListPopupComponent, ReactiveFormsModule, ETAPopupComponent, LabelsPopupComponent, MultiUserSelectionPopupComponent],
})
export class PkgPopupModule {}
