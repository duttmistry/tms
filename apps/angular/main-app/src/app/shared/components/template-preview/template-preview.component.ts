import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'main-app-template-preview',
  templateUrl: './template-preview.component.html',
  styleUrls: ['./template-preview.component.scss'],
})
export class TemplatePreviewComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    // console.log('ck editor data:', this.data);
  }
}
