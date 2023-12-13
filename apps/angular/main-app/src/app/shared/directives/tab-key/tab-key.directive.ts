import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[mainAppTabKey]',
})
export class TabKeyDirective {
  //#region properties
  private tabPressStartTime = 0;
  private tabPressEndTime = 0;
  private isTabPressed = false;
  //#endregion

  constructor() {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // console.log('event:', event);
    if (event.key === 'Tab') {
      if (!this.isTabPressed) {
        this.isTabPressed = true;
        this.tabPressStartTime = Date.now();
      } else {
        event.preventDefault();
      }
    }
  }

  @HostListener('keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Tab' && this.isTabPressed) {
      this.isTabPressed = false;
      const tabPressDuration = Date.now() - this.tabPressStartTime;
      if (tabPressDuration > 300) {
        event.preventDefault();
      }
    }
  }
}
