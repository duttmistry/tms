import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutoFocusInputDirective } from './auto-focus-input.directive';
import { CustomToolTipComponent } from './custom-tooltip/custom-tooltip.component';
import { ToolTipRendererDirective } from './tooltip-renderer.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [AutoFocusInputDirective, CustomToolTipComponent, ToolTipRendererDirective],
  exports: [AutoFocusInputDirective, CustomToolTipComponent, ToolTipRendererDirective],
})
export class PkgCustomDirectivesModule {}
