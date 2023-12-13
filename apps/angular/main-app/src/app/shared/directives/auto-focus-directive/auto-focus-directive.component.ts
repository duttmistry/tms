import { Directive, ElementRef, AfterContentInit } from '@angular/core';
@Directive({
  selector: '[autoFocusDirective]',
})
export class AutoFocusDirective implements AfterContentInit {
  constructor(private el: ElementRef) {}
  ngAfterContentInit(): void {
    this.el.nativeElement.focus();
  }
}
