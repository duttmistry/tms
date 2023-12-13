import { Component, OnInit, ViewChild } from '@angular/core';
import { LoginService } from '../../services/login/login.service';
import { Router } from '@angular/router';
import { CountdownComponent } from 'ngx-countdown';
import { UserService } from '../../services/module/users/users.service';
import { SnackbarComponent } from '@tms-workspace/material-controls';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../../services/common/storage.service';
import { STORAGE_CONSTANTS } from '../../services/common/constants';
import { Encryption } from '@tms-workspace/encryption';
import { TaskTimerRequestModel, toggleTaskTimerResponseModel } from '../../model/task/task.model';
import { TaskService } from '../../services/module/tasks/task.service';
import { SpinnerService } from '../../services/common/spinner.service';
import moment from 'moment';

@Component({
  selector: 'tms-workspace-break-time',
  templateUrl: './break-time.component.html',
  styleUrls: ['./break-time.component.scss'],
})
export class BreakTimeComponent implements OnInit {
  showSpinner = true;
  showBackFromBackSpinner = false;
  current_time: any = moment(new Date()).format('HH:mm:ss');
  @ViewChild('dhCountdown', { static: false })
  private dhCountdown!: CountdownComponent;
  @ViewChild('whCountdown', { static: false })
  private whCountdown!: CountdownComponent;
  task_id: any;
  isRunning = false;
  timeInSeconds = 0;
  timer: any;
  break_time_hours = 0;
  break_time_minutes = 0;
  break_time_seconds = 0;
  user_break_time: any;
  constructor(
    private loginService: LoginService,
    private route: Router,
    private userService: UserService,
    private _snackBar: MatSnackBar,
    private storageService: StorageService,
    private taskService: TaskService,
    private spinnerService: SpinnerService
  ) {
    // this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.IS_BREAK_TIME, Encryption._doEncrypt(JSON.stringify(true)));
    // console.log('current_time: ', this.current_time);

    const break_time_timer: any = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.BREAK_TIME_TIMER);
    const break_timer: any = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.BREAK_TIMER);
    const _break_time_timer = Encryption._doDecrypt(break_time_timer);
    let is_break_time: any = 0;
    if (break_time_timer) {
      is_break_time = JSON.parse(_break_time_timer);
      // console.log('is_break_time: ', is_break_time);
      this.timeInSeconds = is_break_time ? parseInt(is_break_time) : 0;
    }
    const _break_timer = Encryption._doDecrypt(break_timer);
    let break_timer_time: any = 0;
    if (break_timer) {
      break_timer_time = JSON.parse(_break_timer);
      // console.log('break_timer_time: ', moment(break_timer_time).format('HH:mm:ss'));
      this.user_break_time = moment(break_timer_time).format('HH:mm:ss');
    }

    this.getTimer();
  }
  getTimer() {
    const break_time_timer: any = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.BREAK_TIME_TIMER);
    const break_timer: any = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.BREAK_TIMER);
    const _break_time_timer = Encryption._doDecrypt(break_time_timer);
    this.current_time = moment(new Date()).format('HH:mm:ss');
    // let is_break_time: any = 0;
    // if (break_time_timer) {
    //   is_break_time = JSON.parse(_break_time_timer);
    //   // console.log('is_break_time: ', is_break_time);
    //   this.timeInSeconds = is_break_time ? parseInt(is_break_time) : 0;
    // }
    const _break_timer = Encryption._doDecrypt(break_timer);
    let break_timer_time: any = 0;
    if (break_timer) {
      break_timer_time = JSON.parse(_break_timer);
      // console.log('break_timer_time: ', moment(break_timer_time).format('HH:mm:ss'));
      this.user_break_time = moment(break_timer_time).format('HH:mm:ss');
    }

    const startTimeMoment = moment(this.current_time, 'HH:mm:ss');
    // console.log('this.current_time: ', this.current_time);
    const endTimeMoment = moment(this.user_break_time, 'HH:mm:ss');
    // console.log('this.user_break_time: ', this.user_break_time);

    // Calculate the duration by subtracting endTime from startTime
    const duration = moment.duration(startTimeMoment.diff(endTimeMoment));
    // console.log('duration: ', duration);

    // Get the result as a formatted string in the format hh:mm:ss
    const result: any = moment.utc(duration.as('milliseconds'));
    // console.log('result: ', result);

    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    // Calculate the total duration in seconds
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    // console.log('totalSeconds: ', totalSeconds);
    this.timeInSeconds = totalSeconds ? totalSeconds : 0;
  }
  ngOnInit() {
    const taskid: any = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.BREAK_TIME_TASK);
    // console.log('taskid: ', taskid);
    this.task_id = Encryption._doDecrypt(taskid);
    // console.log('this.task_id: ', this.task_id);
    this.showSpinner = false;
    this.startTimer();
  }
  BackFromBreak() {
    if (!this.showBackFromBackSpinner) {
      this.showBackFromBackSpinner = true;
      const timerRequestBody: TaskTimerRequestModel = {
        task_id: this.task_id,
      };
      this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.IS_BREAK_TIME, Encryption._doEncrypt(JSON.stringify(false)));
      this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.BREAK_TIMER);
      if (timerRequestBody?.task_id && timerRequestBody?.task_id != '0') {
        this.loginService.logBreakTime('BACK_FROM_BREAK').subscribe(
          (res: any) => {
            if (res.success) {
              // this.breakControl.setValue(res.data.status);
              this.userService.setBreakTimeStatus(res.data.status);
              // this.dhCountdown.resume();
              // this.whCountdown.resume();
              this.taskService.startTaskTimer(timerRequestBody).subscribe({
                next: (response: toggleTaskTimerResponseModel) => {
                  if (response) {
                    //  this.spinnerService.hideSpinner();
                    if (response.success) {
                      this.resetTimer();
                      this.route.navigate(['/dashboard']);
                    } else {
                      this.showBackFromBackSpinner = false;
                      this._snackBar.openFromComponent(SnackbarComponent, {
                        data: { message: 'You do not have the authorization for this action.' },
                        duration: 45000,
                      });
                    }
                  } else {
                    this.showBackFromBackSpinner = false;
                  }
                },
                error: (error: any) => {
                  console.log('error:', error);
                  this.showBackFromBackSpinner = false;
                  this.spinnerService.hideSpinner();
                },
              });
              //  else {
              //   this.dhCountdown.resume();
              //   this.whCountdown.resume();
              // }
            } else {
              this.showBackFromBackSpinner = false;
              this._snackBar.openFromComponent(SnackbarComponent, {
                data: { message: 'Failed to update the status.' },
                duration: 45000,
              });
              // Revert the value of breakControl to its previous state
              // this.breakControl.setValue(!this.breakControl.value);
            }
          },
          (err: any) => {
            this.showBackFromBackSpinner = false;
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: 'Failed to update the status.' },
              duration: 45000,
            });
            // Revert the value of breakControl to its previous state
            // this.breakControl.setValue(!this.breakControl.value);
          }
        );
      } else {
        this.loginService.logBreakTime('BACK_FROM_BREAK').subscribe(
          (res: any) => {
            if (res.success) {
              // this.breakControl.setValue(res.data.status);
              this.userService.setBreakTimeStatus(res.data.status);
              this.resetTimer();
              this.route.navigate(['/dashboard']);
            } else {
              this.showBackFromBackSpinner = false;
              this._snackBar.openFromComponent(SnackbarComponent, {
                data: { message: 'Failed to update the status.' },
                duration: 45000,
              });
              // Revert the value of breakControl to its previous state
              // this.breakControl.setValue(!this.breakControl.value);
            }
          },
          (err: any) => {
            this.showBackFromBackSpinner = false;
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: 'Failed to update the status.' },
              duration: 45000,
            });
            // Revert the value of breakControl to its previous state
            // this.breakControl.setValue(!this.breakControl.value);
          }
        );
      }
    }
  }

  startTimer() {
    this.isRunning = true;
    this.timer = setInterval(() => {
      // this.timeInSeconds++;
      this.getTimer();
      // this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.BREAK_TIME_TIMER, Encryption._doEncrypt(JSON.stringify(this.timeInSeconds)));
    }, 1000);
  }

  resetTimer() {
    this.isRunning = false;
    this.timeInSeconds = 0;
    this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.BREAK_TIME_TIMER, Encryption._doEncrypt(JSON.stringify(this.timeInSeconds)));
    clearInterval(this.timer);
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;
    this.break_time_hours = hours;
    this.break_time_minutes = minutes;
    this.break_time_seconds = sec;
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(sec)}`;
  }

  public pad(value: number): string {
    return value < 10 ? `0${value}` : value.toString();
  }
}
