import { AfterViewInit, Component, ViewChild, TemplateRef, EventEmitter, Output, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { STORAGE_CONSTANTS } from '../../../core/services/common/constants';
import moment from 'moment';
import { UpdateTaskWorkHistoryModel } from '../../../core/model/task/task.model';
import { TaskService } from '../../../core/services/module/tasks/task.service';
import { Subscription } from 'rxjs';
import { StorageService } from '../../../core/services/common/storage.service';
import { Encryption } from '@tms-workspace/encryption';
import { SnackbarComponent } from '@tms-workspace/material-controls';

@Component({
  selector: 'main-app-tms-workspace-work-history-comment-popup',
  templateUrl: './work-history-comment-popup.component.html',
  styleUrls: ['./work-history-comment-popup.component.scss'],
})
export class WorkHistoryCommentPopupComponent implements AfterViewInit, OnDestroy {
  //#region properties
  @ViewChild('workHistoryCommentPopupModal') workHistoryCommentPopup!: TemplateRef<any>;
  @Output() emitModal: EventEmitter<any> = new EventEmitter();

  @Output() onUpdateTimeHistory: EventEmitter<any> = new EventEmitter();
  // @Input() temporaryTaskWorkHistoryBindList!: any[];
  @Input() loggedInUserId!: any;
  // @Input() WorkHistoryObject!: any;
  @Input() reportTo!: any;
  @Input()
  stoppedTimeSlotByUser!: any;
  subscriptions: Subscription[] = [];
  heading = 'Work Description';
  workDescriptionForm!: FormGroup;
  isFormSubmitted = false;
  startTime = new FormControl('', Validators.required);
  endTime = new FormControl('', Validators.required);
  userRole!: string;
  isAllControlsEditable = true;
  dialogRef: any;

  //#endregion

  constructor(
    private dialog: MatDialog,
    private formBuilder: FormBuilder,
    private snackbar: MatSnackBar,
    private taskService: TaskService,
    private storageService: StorageService
  ) {
    this.initializeForm();
  }

  ngAfterViewInit(): void {
    // if (this.temporaryTaskWorkHistoryBindList) {
    //   let stoppedTimeSlotObject: any;
    //   if (this.editableWorkHistoryObject) {
    //     stoppedTimeSlotObject = this.temporaryTaskWorkHistoryBindList.find(
    //       (workHistoryObject: any) => workHistoryObject._id == this.editableWorkHistoryObject._id
    //     );
    //   } else {
    //     stoppedTimeSlotObject = this.temporaryTaskWorkHistoryBindList.find(
    //       (workHistoryObject: any) => workHistoryObject.user_id == this.loggedInUserId
    //     );
    //   }
    if (this.stoppedTimeSlotByUser) {
      //   this.stoppedTimeSlotByUser = stoppedTimeSlotObject;
      this.setFormData();
    }
    // }
    this.openModal();
    this.setPermissions();
  }

  initializeForm() {
    this.workDescriptionForm = this.formBuilder.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      workDescription: ['', [Validators.minLength(3), Validators.maxLength(512)]],
    });
  }

  get _workDescription() {
    return this.workDescriptionForm.controls;
  }

  // in the case of edit, only comment can be editable. from and to time and delete timeslot will be only changed by the responsible person and super admin.
  setPermissions() {
    let getLoggedInUser: any = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA);
    getLoggedInUser = getLoggedInUser ? JSON.parse(Encryption._doDecrypt(getLoggedInUser)) : '';
    if (getLoggedInUser && getLoggedInUser.user_role) {
      this.userRole = getLoggedInUser.user_role || '';
    }
    // if (this.userRole && this.userRole === USER_ROLES.SUPER_ADMIN) {
    //   this.isAllControlsEditable = true;
    // } else if (this.reportTo && this.reportTo.id && getLoggedInUser && getLoggedInUser.id == this.reportTo.id) {
    //   this.isAllControlsEditable = true;
    // } else {
    //   this.isAllControlsEditable = false;
    // }
    if (!this.isAllControlsEditable) {
      this.startTime.disable();
      this.endTime.disable();
      this._workDescription['startDate'].disable();
      this._workDescription['endDate'].disable();
    }
  }

  setFormData() {
    this.workDescriptionForm.patchValue({
      startDate: this.stoppedTimeSlotByUser.start_time || '',
      endDate: this.stoppedTimeSlotByUser.end_time || '',
      workDescription: this.stoppedTimeSlotByUser.comment || '',
    });
    this.startTime.setValue(moment(this.stoppedTimeSlotByUser.start_time).format('hh:mm A'));
    this.endTime.setValue(moment(this.stoppedTimeSlotByUser.end_time).format('hh:mm A'));
  }

  openModal() {
    this.dialogRef = this.dialog.open(this.workHistoryCommentPopup, {
      hasBackdrop: true,
      disableClose: true,
      width: '455px',
      height: '321px',
    });
  }

  onSubmit() {
    this.isFormSubmitted = true;
    if (this._workDescription['workDescription'].value) {
      this._workDescription['workDescription'].setValue(this._workDescription['workDescription'].value.trim());
    }
    if (this.workDescriptionForm.valid) {
      const formValue = this.workDescriptionForm.getRawValue();

      let startDate = moment(formValue.startDate);
      let endDate = moment(formValue.endDate);

      if (this.startTime.value) {
        let hours = +moment(this.startTime.value, ['h:mm A']).format('HH');
        let minutes = +moment(this.startTime.value, ['h:mm A']).format('mm');

        // let hours = this.startTime.value.includes('AM') ? +this.startTime.value.split(':')[0] : 12 + +this.startTime.value.split(':')[0];
        // let minutes = +this.startTime.value.split(':')[1].split(' ')[0];

        startDate = moment(startDate).set({ hours: hours, minutes: minutes });
      }
      if (this.endTime.value) {
        let hours = +moment(this.endTime.value, ['h:mm A']).format('HH');
        let minutes = +moment(this.endTime.value, ['h:mm A']).format('mm');

        // let hours = this.endTime.value.includes('AM') ? +this.endTime.value.split(':')[0] : 12 + +this.endTime.value.split(':')[0];
        // let minutes = +this.endTime.value.split(':')[1].split(' ')[0];

        endDate = moment(endDate).set({ hours: hours, minutes: minutes });
      }

      if (endDate.isBefore(startDate)) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { message: "Task's From date/time must be earlier than the To date/time." },
        });
        // const startDateTask = moment(startDate).format('DD/MM/YYYY');
        // const endDateTask = moment(endDate).format('DD/MM/YYYY');
        // if (startDateTask == endDateTask) {
        //   this.snackbar.openFromComponent(SnackbarComponent, {
        //     data: { message: `Task's ${this.startTime.value} must be earlier than the ${this.endTime.value}.` },
        //   });
        // } else {
        //   this.snackbar.openFromComponent(SnackbarComponent, {
        //     data: { message: `Task's ${startDateTask} must be earlier than the ${endDateTask}.` },
        //   });
        // }
        return;
      }
      const taskWorkHistory: UpdateTaskWorkHistoryModel = {
        comment: formValue.workDescription || '',
        start_time: startDate || '',
        end_time: endDate || '',
      };
      this.onUpdateTimeHistory.emit({ taskWorkHistory, id: this.stoppedTimeSlotByUser._id });
      this.dialog.closeAll();

      // this.subscriptions.push(
      //   this.taskService.updateTaskWorkHistory(updateTaskWorkHistory, this.stoppedTimeSlotByUser._id).subscribe({
      //     next: (response: any) => {
      //       if (response) {
      //         if (response.status) {
      //           if (response.data) {
      //             this.emitModal.emit({ isTaskWorkHistoryUpdated: true, updatedResponse: response.data });
      //             this.dialog.closeAll();
      //           }
      //         }
      //       }
      //     },
      //     error: (error) => {
      //       console.log('error:', error);
      //     },
      //   })
      // );
    } else {
      this.workDescriptionForm.markAllAsTouched();
    }
    // else {
    //   this.snackbar.open(ERROR_MESSAGE_CONSTANTS.REQUIRED_AND_INVALID_FORM);
    // }
  }

  onTaskDateChange() {
    //
  }

  onCloseModal() {
    this.dialog.closeAll();
    this.emitModal.emit({ isModalCancelled: true });
  }

  onEndTimeChange(event: any) {
    this.endTime.setValue(event);
  }

  onStartTimeChange(event: any) {
    this.startTime.setValue(event);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
