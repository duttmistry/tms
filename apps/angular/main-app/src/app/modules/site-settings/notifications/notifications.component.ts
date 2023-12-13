import { FormBuilder } from '@angular/forms';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'main-app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  isChecked = true;
  toggleColor = 'primary';
  thumbLabel = true;
  disabled = false;

  notificationForm = this._formBuilder.group({
    sendTaskUpdateEmail: [true],
    sendLeaveEmail: [true],
    sendInstructionEmail: [false],
    otherEmail: [true],
  });
  constructor(private _formBuilder: FormBuilder) {
    // console.log('call');
  }

  ngOnInit() {
    // console.log('call');
  }

  onSave() {
    // console.log('form value', this.notificationForm.value);
  }

  onCancel() {
    // console.log('--');
  }

  onToggleChange(event: any) {
    // console.log('form controls', this.notificationForm.controls);
  }
}
