import { Component, OnInit, Inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import moment from 'moment';
import { UserService } from '../../../../core/services/module/users/users.service';

@Component({
  selector: 'app-update-time-model',
  templateUrl: './update-time-model.component.html',
  styleUrls: ['./update-time-model.component.scss'],
})
export class UpdateTimeModelComponent {
  updateTimeFormGroup;
  userId: any;
  maxDate = moment();

  hours: string[] = Array.from({ length: 24 }, (_, i) => (i <= 9 ? '0' + i : i + '')); // Create an array from 0 to 23 for hours
  minutes: string[] = Array.from({ length: 60 }, (_, i) => (i <= 9 ? '0' + i : i + '')); // Create an array from 0 to 59 for minutes

  actionOptions = [
    {
      id: 1,
      title: 'Add',
    },
    {
      id: 2,
      title: 'Reduce',
    },
  ];
  isSubmitted = false;
  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    public dialogRef: MatDialogRef<UpdateTimeModelComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userId = data.userId;
    this.updateTimeFormGroup = this.initializeForm();
  }

  get _updateTimeFormGroup() {
    return this.updateTimeFormGroup.controls;
  }
  initializeForm() {
    return this.formBuilder.group({
      actionControl: [null, Validators.required],
      dateControl: [null, Validators.required],
      timeControl: this.formBuilder.group(
        {
          hoursControl: ['', Validators.required],
          minutesControl: ['', Validators.required],
        },
        { validator: this.notBothDoubleZeroValidator }
      ),
      reasonControl: ['', [Validators.maxLength(1000)]],
    });
  }

  onClose() {
    this.dialogRef.close({
      timeUpdated: false,
      message: '',
    });
  }

  onSave() {
    this.updateTimeFormGroup.markAllAsTouched();
    if (this.updateTimeFormGroup.valid) {
      let formValue = this.updateTimeFormGroup.value;

      let body = {
        type: formValue.actionControl && formValue.actionControl == 1 ? 'ADD' : 'REMOVE',
        date: (formValue.dateControl as any).format('YYYY-MM-DD'),
        time: formValue.timeControl?.hoursControl + ':' + formValue.timeControl?.minutesControl,
        reason: formValue.reasonControl,
      };
      console.log(this.userId, body);

      this.userService.updateTimeManually(this.userId, body).subscribe((res: any) => {
        if (res.success) {
          this.dialogRef.close({
            timeUpdated: true,
            message: res.message,
          });
        }
      });
    }
  }
  notBothDoubleZeroValidator(group: FormGroup): { [key: string]: boolean } | null {
    const hours = group.get('hoursControl')?.value;
    // console.log('%c  hours:', 'color: #0e93e0;background: #aaefe5;', hours);
    const minutes = group.get('minutesControl')?.value;
    // console.log('%c  minutes:', 'color: #0e93e0;background: #aaefe5;', minutes);

    if (hours === '00' && minutes === '00') {
      return { notBothDoubleZero: true };
    }

    return null;
  }
}
