import { AfterViewInit, Directive } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

@Directive({
  selector: 'mat-menu[pgcCenter]',
})
export class PGCMenuCenterDirective implements AfterViewInit {
  constructor(private menu: MatMenu) {}

  ngAfterViewInit(): void {
    this.menu.overlayPanelClass = `center-${this.menu.xPosition}`;
  }
}
