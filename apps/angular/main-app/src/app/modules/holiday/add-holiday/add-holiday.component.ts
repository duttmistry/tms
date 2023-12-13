import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { HolidayService } from '../../../core/services/module/holiday/holiday.service';
import * as moment from 'moment';
import { SpinnerService } from '../../../core/services/common/spinner.service';
@Component({
  selector: 'main-app-add-holiday',
  templateUrl: './add-holiday.component.html',
  styleUrls: ['./add-holiday.component.scss'],
  providers: [],
})
export class AddHolidayComponent {
  holidayID: any = null;
  holidayForm!: FormGroup;

  holidayData: any;
  _todayDate: any;
  weekendDaysFilter = (d: moment.Moment | null): boolean => {
    const day = (d?.toDate() || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    return day !== 0 && day !== 6;
  };
  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private holidayService: HolidayService,
    private _router: Router,
    private _snackBar: MatSnackBar,
    private spinnerService: SpinnerService
  ) {
    this.spinnerService.hideSpinner();
    this._todayDate = moment().toISOString(); //date for disable past dates from today
    const _id = this.activatedRoute.snapshot.paramMap.get('id') || '';
    this.holidayID = (Encryption._doDecrypt(_id) as string) || null;
    this.initializeHolidayForm();
    if (this.holidayID && this.holidayID !== null) {
      this.getHolidayById(this.holidayID);
    }
  }

  initializeHolidayForm() {
    this.holidayForm = this.formBuilder.group({
      holidayDate: ['', Validators.required],
      holidayName: ['', Validators.required],
    });
  }

  onSubmitForm() {
    // console.log(this.holidayForm.value);

    this.spinnerService.showSpinner();
    if (this.holidayForm.valid) {
      const formValue = this.holidayForm.value;
      if (this.holidayID && this.holidayID !== null) {
        this.updateHoliday(
          {
            title: formValue.holidayName,
            holiday_date: formValue.holidayDate.format('YYYY-MM-DD hh:mm:ss'),
          },
          this.holidayID
        );
      } else {
        this.addNewHoliday({
          title: formValue.holidayName,
          holiday_date: formValue.holidayDate.format('YYYY-MM-DD hh:mm:ss'),
        });

        // moment(formValue.holidayDate).format('YYYY-MM-DD hh:mm:ss')
      }
    } else {
      this.holidayForm.markAllAsTouched();
      // console.log('invalid form data');
      this.spinnerService.hideSpinner();
    }
  }

  navigateToHolidayList() {
    this._router.navigate(['/holiday']);
  }

  getHolidayById(id: string) {
    this.spinnerService.showSpinner();
    this.holidayService.getHolidayById(id).subscribe(
      (response: any) => {
        if (response && response?.data) {
          this.holidayData = response.data;
          this.holidayForm.patchValue({
            holidayDate: moment(response.data.holiday_date),

            holidayName: response.data.title,
          });

          this.spinnerService.hideSpinner();
        } else {
          // console.log('no data found');
          this.spinnerService.hideSpinner();
        }
      },
      (err) => {
        this.spinnerService.hideSpinner();
        console.log('error getHolidayById=>>', err);
      }
    );
  }

  addNewHoliday(data: any) {
    this.holidayService.addHoliday(data).subscribe(
      (response: any) => {
        if (response && response?.success == true) {
          this._snackBar.open(response?.message);
          this.navigateToHolidayList();
        }
        this.spinnerService.hideSpinner();
      },
      (err) => {
        console.log('error addNewHoliday =>>', err);
        this.spinnerService.hideSpinner();
      }
    );
  }

  updateHoliday(data: any, id: string) {
    this.holidayService.updateHoliday(data, id).subscribe(
      (response: any) => {
        if (response && response?.success == true) {
          this._snackBar.open(response?.message);
          this.navigateToHolidayList();
        }
        this.spinnerService.hideSpinner();
      },
      (err) => {
        console.log('error updateHoliday =>>', err);
        this.spinnerService.hideSpinner();
      }
    );
  }
}
