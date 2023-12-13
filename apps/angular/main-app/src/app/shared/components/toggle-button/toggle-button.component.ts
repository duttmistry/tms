import { Component, Output, EventEmitter, OnInit, Input } from '@angular/core';

@Component({
  selector: 'main-app-toggle-button',
  templateUrl: './toggle-button.component.html',
  styleUrls: ['./toggle-button.component.scss'],
})
export class ToggleButtonComponent implements OnInit {
  @Output() changed = new EventEmitter<boolean>();
  @Input() toggleValue!: any;

  ngOnInit() {
    // console.log('toggleValue', this.toggleValue, this.changed);
  }

  onToggleChange(evt: any) {
    evt.is_notify = !evt.is_notify;
    // console.log('on toggle change', evt);
    this.changed.emit(evt);
  }
}
