import { AfterContentInit, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[tmsWorkspaceAutoFocusInput]',
})
export class AutoFocusInputDirective implements AfterContentInit {
  constructor(private el: ElementRef) {}
  // This custom directive is used to focus input automatically
  ngAfterContentInit(): void {
    this.el.nativeElement.focus();
  }
}
