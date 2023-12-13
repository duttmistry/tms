import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Encryption } from '@tms-workspace/encryption';
import { environment } from './../../../../environments/environment';

import { CountdownComponent, CountdownConfig } from 'ngx-countdown';
import { StorageService } from '../../services/common/storage.service';
import { LoginService } from '../../services/login/login.service';
import { UserService } from '../../services/module/users/users.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { STORAGE_CONSTANTS } from '../../services/common/constants';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { SnackbarComponent } from 'libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import moment from 'moment';
import { SiteSettingService } from '../../services/common/site-setting.service';
import { TaskService } from '../../services/module/tasks/task.service';
import { TaskTimerRequestModel, toggleTaskTimerResponseModel } from '../../model/task/task.model';
import { SpinnerService } from '../../services/common/spinner.service';

const CountdownTimeUnits: Array<[string, number]> = [
  ['Y', 1000 * 60 * 60 * 24 * 365],
  ['M', 1000 * 60 * 60 * 24 * 30], // months
  ['D', 1000 * 60 * 60 * 24], // days
  ['H', 1000 * 60 * 60], // hours
  ['m', 1000 * 60], // minutes
  ['s', 1000], // seconds
  ['S', 1], // million seconds
];
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dhCountdown', { static: false })
  private dhCountdown!: CountdownComponent;
  @ViewChild('whCountdown', { static: false })
  private whCountdown!: CountdownComponent;
  encryptedUserId: any
  _isBreakTime: any
  dhSpinValue: any;
  whSpinValue: any;
  intervalId: any;
  userData!: any;
  baseUrl = environment.base_url;
  dailyHoursConfig!: CountdownConfig;
  weeklyHoursConfig!: CountdownConfig;
  task_id: any
  breakControl = new FormControl(false);
  isLateLogin = false;
  isLateForWeeklyHours = false;
  fixedDailyHours: any = '8:30';
  fixedDailyMinutes = Number(this.fixedDailyHours.split(':')[0]) * 60 + Number(this.fixedDailyHours.split(':')[1]);
  weekOnDays: any = {
    '1': true,
    '2': true,
    '3': true,
    '4': true,
    '5': true,
    '6': false,
    '7': false
  }
  weekOnDaysCount = 5
  leaveMinutes = 0;
  totalDayWiseMinutes = this.weekOnDaysCount * this.fixedDailyMinutes
  dayWiseHours: any = {
    '1': this.totalDayWiseMinutes - this.leaveMinutes,    //monday
    '2': (this.totalDayWiseMinutes - (1 * (this.fixedDailyMinutes))) - this.leaveMinutes, //tuesday
    '3': (this.totalDayWiseMinutes - (2 * (this.fixedDailyMinutes))) - this.leaveMinutes, //wednesday
    '4': (this.totalDayWiseMinutes - (3 * (this.fixedDailyMinutes))) - this.leaveMinutes, //thursday
    '5': (this.totalDayWiseMinutes - (4 * (this.fixedDailyMinutes))) - this.leaveMinutes, //friday
    '6': (this.totalDayWiseMinutes - (5 * (this.fixedDailyMinutes))) - this.leaveMinutes,  //saturday
    '7': (this.totalDayWiseMinutes - (6 * (this.fixedDailyMinutes))) - this.leaveMinutes   //sunday
  };

  constructor(
    private loginService: LoginService,
    private dialog: MatDialog,
    private storageService: StorageService,
    private userService: UserService,
    private router: Router,
    private _snackBar: MatSnackBar,
    private siteSettingService: SiteSettingService,
    private route: Router,
    private taskService: TaskService,
    private spinnerService: SpinnerService
  ) {
    const break_time: any = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.IS_BREAK_TIME);
    const _is_break_time = Encryption._doDecrypt(break_time);
    let is_break_time: any = false;
    if (break_time) {
      is_break_time = JSON.parse(_is_break_time);
    }
    this.breakControl.setValue(is_break_time);
    // console.log('this.breakControl: ', this.breakControl.value);
    // console.log('is_break_time: ', is_break_time);
    const taskid: any = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.BREAK_TIME_TASK);
    // console.log('taskid: ', taskid);
    this.task_id = Encryption._doDecrypt(taskid)
  }

  ngOnInit(): void {
    this.dailyHoursConfig = {
      demand: false,
      leftTime: 0,
      format: 'HH:mm',
    };

    this.weeklyHoursConfig = {
      demand: false,
      leftTime: 0,

      formatDate: ({ date }) => {
        let duration = Number(date || 0);

        return CountdownTimeUnits.reduce((current, [name, unit]) => {
          if (current.indexOf(name) !== -1) {
            const v = Math.floor(duration / unit);
            duration -= v * unit;
            return current.replace(new RegExp(`${name}+`, 'g'), (match: string) => {
              return v.toString().padStart(match.length, '0');
            });
          }
          return current;
        }, 'HH:mm');
      },
    };
    this.getUserDataFromLS();
    this.getTimingsData()

  }

  ngAfterViewInit(): void {
    this.getUserPendingTime();
    this.setCountDownInterval();
  }
  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getUserDataFromLS() {
    this.userData = this.userService.getUserDataFromLS();
    this.encryptedUserId = this.userData.user_id ? Encryption._doEncrypt(JSON.stringify(this.userData.user_id)) : null;
  }
  setCountDownInterval() {
    this.intervalId = setInterval(() => {
      this.dhSpinValue = ((this.dhCountdown.left / 1000) * 100) / 30600;
      this.whSpinValue = ((this.whCountdown.left / 1000) * 100) / 153000;
    }, 1000);
  }

  setCountDown(todayRemainingTime: number, weeklyRemainingTime: number) {
    this.dailyHoursConfig = {
      demand: false,
      leftTime: todayRemainingTime ? todayRemainingTime * 60 : 0,
      format: 'HH:mm',
    };

    this.weeklyHoursConfig = {
      demand: false,
      leftTime: weeklyRemainingTime ? weeklyRemainingTime * 60 : 0,

      formatDate: ({ date }) => {
        let duration = Number(date || 0);

        return CountdownTimeUnits.reduce((current, [name, unit]) => {
          if (current.indexOf(name) !== -1) {
            const v = Math.floor(duration / unit);
            duration -= v * unit;
            return current.replace(new RegExp(`${name}+`, 'g'), (match: string) => {
              return v.toString().padStart(match.length, '0');
            });
          }
          return current;
        }, 'HH:mm');
      },
    };
  }

  getUserPendingTime() {
    // first check if user is logged in

    this.loginService.getPendingTime().subscribe(async (res: any) => {
      // console.log('%c  res:', 'color: #0e93e0;background: #aaefe5;', res);
      const currentTime = moment();
      const fixedTime = moment().set({ hour: 19, minute: 0, second: 0, millisecond: 0 }); // 7 pm
      const remainingMinutes = res.data.todayRemainingTime + 1;
      const newTime = moment(currentTime).clone().add(remainingMinutes, 'minutes');
      if (newTime.isAfter(fixedTime) && currentTime.isBefore(fixedTime)) {
        this.isLateLogin = true;
      } else if (currentTime.isAfter(fixedTime)) {
        this.isLateLogin = false;
      }
      this.leaveMinutes = res.data.weeklyLeaveMinites
      await this.countTimings()
      const currentDay = moment().day()
      // console.log('%c  currentDay:', 'color: #0e93e0;background: #aaefe5;', currentDay);
      this.isLateForWeeklyHours = this.dayWiseHours[currentDay] < res.data.weeklyRemainingTime;
      // console.log('%c  res.data.weeklyRemainingTime + 1:', 'color: #0e93e0;background: #aaefe5;', res.data.weeklyRemainingTime + 1);
      // console.log('%c  isLateForWeeklyHours:', 'color: #0e93e0;background: #aaefe5;', this.isLateForWeeklyHours);
      // console.log('%c  this.dayWiseHours:', 'color: #0e93e0;background: #aaefe5;', this.dayWiseHours);
      this.setCountDown(res.data.todayRemainingTime + 1, res.data.weeklyRemainingTime + 1);
      // console.log('%c  this.leaveMinutes:', 'color: black;background: #aaefe5;', this.leaveMinutes);
      // console.log('%c  this.leaveMinutes:', 'color: black;background: #aaefe5;', this.dayWiseHours);

      this.breakControl.setValue(res.data.breakStatus);
      this.userService.setBreakTimeStatus(res.data.breakStatus);
      if (this.breakControl.value) {
        this.dhCountdown.begin();
        this.whCountdown.begin();
        this.dhCountdown.pause();
        this.whCountdown.pause();
      } else {
        this.dhCountdown.begin();
        this.whCountdown.begin();
      }
    });
  }

  onBreakMark() {
    const timerRequestBody: TaskTimerRequestModel = {
      task_id: this.task_id,
    };
    // this.loginService.logBreakTime(!this.breakControl.value ? 'BACK_FROM_BREAK' : 'BREAK_TIME').subscribe(
    this.loginService.logBreakTime('BREAK_TIME').subscribe(
      (res: any) => {
        if (res.success) {
          this.breakControl.setValue(res.data.status);
          this.userService.setBreakTimeStatus(res.data.status);
          // if (this.breakControl.value) {
          this.dhCountdown.pause();
          this.whCountdown.pause();
          this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.IS_BREAK_TIME, Encryption._doEncrypt(JSON.stringify(true)));
          this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.BREAK_TIMER, Encryption._doEncrypt(JSON.stringify(moment(new Date()))));
          // this.route.navigate(['/breaktime']);
          window.location.href = '/breaktime';
          // }
          // else {
          //   this.dhCountdown.resume();
          //   this.whCountdown.resume();
          //   this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.IS_BREAK_TIME, Encryption._doEncrypt(JSON.stringify(false)));
          //   if (timerRequestBody?.task_id && timerRequestBody?.task_id != "0") {
          //     this.taskService.startTaskTimer(timerRequestBody).subscribe({
          //       next: (response: toggleTaskTimerResponseModel) => {
          //         if (response) {
          //           //  this.spinnerService.hideSpinner();
          //           if (response.success) {
          //             this.route.navigate(['/dashboard']);
          //           } else {
          //             this._snackBar.openFromComponent(SnackbarComponent, {
          //               data: { message: 'You do not have the authorization for this action.' },
          //               duration: 45000,
          //             });
          //           }
          //         }
          //       },
          //       error: (error: any) => {
          //         console.log('error:', error);
          //         this.spinnerService.hideSpinner();
          //       },
          //     })
          //   } else {
          //     this.route.navigate(['/dashboard']);
          //   }
          // }
        } else {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: 'Failed to update the status.' },
            duration: 45000,
          });
          // Revert the value of breakControl to its previous state
          this.breakControl.setValue(!this.breakControl.value);
        }
      },
      (err: any) => {
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: { message: 'Failed to update the status.' },
          duration: 45000,
        });
        // Revert the value of breakControl to its previous state
        this.breakControl.setValue(!this.breakControl.value);
      }
    );
  }
  onLogOut() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Are you sure you want to log out ?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loginService.logout();
        this.loginService.setDialogOpen(false);
      }
    });
  }

  redirectToProfile() {
    this.router.navigate(['users/profile']);
  }
  getTimingsData() {
    // console.log('%c  dayWiseHours:', 'color: #0e93e0;background: #aaefe5;', this.dayWiseHours);
    this.siteSettingService.getModuleWiseSiteSettingsData('timing_configuration').subscribe((res: any) => {
      if (res && res.status == 200 && res.data) {
        // console.log("RESPONSE",res)
        this.fixedDailyHours = res.data.find((item: any) => item.identifier == 'daily_hours').value;
        const temp = res.data.find((item: any) => item.identifier == 'week_off_days')?.value;
        const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        daysOrder.forEach((day, index) => {
          this.weekOnDays[(index + 1).toString()] = temp?.[day]
        })
        let count = 0
        for (let key in this.weekOnDays) {
          if (this.weekOnDays[key] === true) {
            count++;
            // console.log('%c  this.weekOnDaysCount:', 'color: #0e93e0;background: #aaefe5;', this.weekOnDaysCount);
          }
        }
        this.weekOnDaysCount = count
        this.countTimings()
      }
    })
  }
  countTimings() {
    this.fixedDailyMinutes = Number(this.fixedDailyHours.split(':')[0]) * 60 + Number(this.fixedDailyHours.split(':')[1]);
    this.totalDayWiseMinutes = (this.weekOnDaysCount * this.fixedDailyMinutes) - this.leaveMinutes
    this.dayWiseHours = {
      '1': this.totalDayWiseMinutes,    //monday
      '2': (this.totalDayWiseMinutes - (1 * (this.fixedDailyMinutes))), //tuesday
      '3': (this.totalDayWiseMinutes - (2 * (this.fixedDailyMinutes))), //wednesday
      '4': (this.totalDayWiseMinutes - (3 * (this.fixedDailyMinutes))), //thursday
      '5': (this.totalDayWiseMinutes - (4 * (this.fixedDailyMinutes))), //friday
      '6': (this.totalDayWiseMinutes - (5 * (this.fixedDailyMinutes))),  //saturday
      '7': (this.totalDayWiseMinutes - (6 * (this.fixedDailyMinutes)))
    }
    // console.log('%c  this.dayWiseHours:', 'color: #0e93e0;background: #aaefe5;', this.dayWiseHours);
  }
}
