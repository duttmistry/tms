import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[mainAppHoverColor]',
})
export class HoverColorDirective {
  //#region properties
  @Input() mainAppHoverColor!: string;
  //#endregion

  constructor(private elment: ElementRef) {}

  // on mouse hover set status background color
  @HostListener('mouseenter') onHover() {
    this.elment.nativeElement.style.backgroundColor = this.mainAppHoverColor;
    this.elment.nativeElement.style.color = '#fff';
  }

  // on mouse leave remove status background color
  @HostListener('mouseleave') onLeave() {
    this.elment.nativeElement.style.backgroundColor = '';
    this.elment.nativeElement.style.color = '#000';
  }
}
