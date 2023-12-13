import { FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { SiteSettingService } from '../../../core/services/common/site-setting.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '@tms-workspace/material-controls';

@Component({
  selector: 'main-app-timing-configuration',
  templateUrl: './timing-configuration.component.html',
  styleUrls: ['./timing-configuration.component.scss'],
})
export class TimingConfigurationComponent  {
  weekOfDayData = [
    {
      id: 1,
      day: 'Monday',
      option: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
      formControlName: 'monday',
    },
    {
      id: 2,
      day: 'Tuesday',
      option: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
      formControlName: 'tuesday',
    },
    {
      id: 3,
      day: 'Wednesday',
      option: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
      formControlName: 'wednesday',
    },
    {
      id: 4,
      day: 'Thursday',
      option: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
      formControlName: 'thursday',
    },
    {
      id: 5,
      day: 'Friday',
      option: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
      formControlName: 'friday',
    },
    {
      id: 6,
      day: 'Saturday',
      option: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
      formControlName: 'saturday',
    },
    {
      id: 7,
      day: 'Sunday',
      option: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
      formControlName: 'sunday',
    },
  ];
  
  dailyHoursData: any;
  timingConfigForm = this.formBuilder.group({
    dailyHours: ['', Validators.pattern('([01]?[0-9]|2[0-3]):[0-5][0-9]')],
    weeklyHours: [''],
    weekStartDate: [''],
    monday: [true],
    tuesday: [true],
    wednesday: [true],
    thursday: [true],
    friday: [true],
    saturday: [false],
    sunday: [false],
    lateArrivalThreshold: ['', Validators.pattern('([01]?[0-9]|2[0-3]):[0-5][0-9]')],
  });
  weekoffResData: any;
  selectedOptionColor = '#5EAD56';
  lateArrivalHoursData: any;
  constructor(private siteSettingsService: SiteSettingService, private formBuilder: FormBuilder, private spinnerService: SpinnerService, private _snackBar: MatSnackBar) {
    this.getModuleWiseSiteSettingsData();
  }



  getModuleWiseSiteSettingsData() {
    this.spinnerService.showSpinner();
    this.siteSettingsService.getModuleWiseSiteSettingsData('timing_configuration').subscribe(
      (res: any) => {
        this.spinnerService.hideSpinner();
        if (res.data) {
          this.dailyHoursData = res.data.find((item: any) => item.identifier == 'daily_hours');

          if (this.dailyHoursData) {
            this.timingConfigForm.get('dailyHours')?.setValue(this.dailyHoursData.value);
          }

          this.weekoffResData = res.data.find((item: any) => item.identifier == 'week_off_days');
          // console.log(this.weekoffResData);

          if (this.weekoffResData) {
            this.weekOfDayData.forEach((week: any) => {
              this.timingConfigForm.get(week.formControlName)?.setValue(this.weekoffResData.value[week.day]);
            });
            // console.log(this.weekOfDayData);
          }
          this.lateArrivalHoursData = res.data.find((item: any) => item.identifier == 'late_arrival_hours');
          // console.log('%c  this.lateArrivalHoursData:', 'color: #0e93e0;background: #aaefe5;', this.lateArrivalHoursData);
          // console.log('%c  this.lateArrivalHoursData :', 'color: #0e93e0;background: #aaefe5;', this.lateArrivalHoursData );
          if(this.lateArrivalHoursData){
            this.timingConfigForm.get('lateArrivalThreshold')?.setValue(this.lateArrivalHoursData.value);
          }
          // console.log('%c  this.timingConfigForm.get(lateArrivalThreshold):', 'color: #0e93e0;background: #aaefe5;', this.timingConfigForm.get('lateArrivalThreshold'));
        }
      },
      (error) => {
        this.spinnerService.hideSpinner();
      }
    );
  }
  onCancel() {
    // console.log('on save call');
    this.getModuleWiseSiteSettingsData();
  }

  onSave() {
    // console.log('on save call', this.timingConfigForm.value);

    if (this.timingConfigForm.valid) {
      let obj: any = {};
      this.weekOfDayData.forEach((data: any) => {
        obj[data.day] = this.timingConfigForm.get(data.formControlName)?.value ? true : false;
      });
      this.weekoffResData.value = obj;

      this.dailyHoursData.value = this.timingConfigForm.get('dailyHours')?.value ? this.timingConfigForm.get('dailyHours')?.value : '08:30';
      this.lateArrivalHoursData.value = this.timingConfigForm.get('lateArrivalThreshold')?.value ? this.timingConfigForm.get('lateArrivalThreshold')?.value : '10:30';
      let body = {
        module: 'timing_configuration',
        fields: [this.weekoffResData, this.dailyHoursData,this.lateArrivalHoursData],
      };
// console.log(this.timingConfigForm.get('lateArrivalThreshold')?.value)
      this.spinnerService.showSpinner();
      this.siteSettingsService.setModuleWiseSiteSettingsData(body).subscribe(
        (res: any) => {
          this.spinnerService.hideSpinner();
          if (res.status == 201 || res.status == 200) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: res.message },
              duration: 45000,
            });
            this.getModuleWiseSiteSettingsData();
          }
        },
        (error) => {
          this.spinnerService.hideSpinner();
        }
      );
    }
  }

  // onSelectionChange(event: any, item: any) {
  //   console.log('weekOfDayData', this.weekOfDayData);

  //   console.log(event.value); // 'yes' or 'no'
  //   console.log('item', item);

  //   switch (item.value) {
  //     case 0:
  //       this.selectedOptionColor = '#FF5959'; // orange color for option1
  //       break;
  //     case 1:
  //       this.selectedOptionColor = '#5EAD56'; // blue color for option2
  //       break;
  //     default:
  //       this.selectedOptionColor = '#F9F9F9'; // default green color
  //       break;
  //   }
  // }
}
