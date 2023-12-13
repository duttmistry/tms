import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[mainAppSpinner]',
})
export class SpinnerDirective implements OnInit {
  @Input('mainAppSpinner') isLoading!: boolean;
  @Input() border_Top!: string;
  @Input() border!: string;
  // @Input('bord') isLoading!: boolean;
  constructor(private el: ElementRef, private renderer: Renderer2) { }
  border_Top_default = '4px solid #333366;'
  border_default = '4px solid rgba(0, 0, 0, 0.1);'
  ngOnInit() {
    // console.log('mainAppSpinner onInit', this.isLoading);
    this.addSpinner();
  }

  private addSpinner() {
    if (this.isLoading) {
      const container = this.renderer.createElement('div');
      this.renderer.addClass(container, 'spinner-container');

      // Create an img element for the spinner GIF
      // const spinnerGif = this.renderer.createElement('img');
      // this.renderer.setAttribute(spinnerGif, 'src', 'assets/images/ccc_loader.gif');
      // this.renderer.setStyle(spinnerGif, 'height', '50px');

      //  Create a spinner element using css
      const spinner = this.renderer.createElement('div');
      this.renderer.addClass(spinner, 'spinner-directive');
      this.renderer.appendChild(container, spinner);
      this.renderer.setStyle(spinner, 'border', (this.border ? this.border : this.border_default));
      this.renderer.setStyle(spinner, 'border-top', (this.border_Top ? this.border_Top : this.border_Top_default));

      // this.renderer.appendChild(container, spinnerGif);
      this.renderer.appendChild(this.el.nativeElement, container);
    } else {
      // Remove any existing spinner containers
      const container = this.el.nativeElement.querySelector('.spinner-container');
      if (container) {
        this.renderer.removeChild(this.el.nativeElement, container);
      }
    }
  }
}
