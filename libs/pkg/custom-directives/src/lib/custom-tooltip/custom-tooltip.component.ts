import { Component, OnInit, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-custom-tooltip',
  templateUrl: './custom-tooltip.component.html',
  styleUrls: ['./custom-tooltip.component.scss'],
})
export class CustomToolTipComponent implements OnInit {
  @Input() text!: string;

  @Input() contentTemplate!: TemplateRef<any>;

  constructor() {}

  ngOnInit() {}
}
