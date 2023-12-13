import { Component, OnDestroy, OnInit } from '@angular/core';
import { TaskService } from '../../../core/services/module/tasks/task.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ReportsService } from '../../../core/services/module/reports/reports.service';
import { LoginService } from '../../../core/services/login/login.service';
import { Encryption } from '@tms-workspace/encryption';
import { StorageService } from '../../../core/services/common/storage.service';
import { STORAGE_CONSTANTS } from '../../../core/services/common/constants';
import { Subscription } from 'rxjs';

@Component({
  selector: 'main-app-tms-workspace-work-report',
  templateUrl: './work-report.component.html',
  styleUrls: ['./work-report.component.scss'],
})
export class WorkReportComponent implements OnInit, OnDestroy {
  //#region For Data member

  public ipAddress = '192.168.0.122';
  public _base_url = environment.base_url;
  public _logout_url = environment.logout_member;
  public _break_url = environment.break_url;
  public _task_id: any;
  public _user_id: any;
  public loggedInUserId: any;
  public active_sessionid: any;
  public subscriptions: Subscription[] = [];
  public setPriority: any;

  constructor(
    private httpClient: HttpClient,
    private taskService: TaskService,
    private reportsService: ReportsService,
    private loginService: LoginService,
    private storageService: StorageService
  ) {
    this.reportsService.getUserData().subscribe((res) => {
      this._task_id = res?.task_id || '';
      this._user_id = res?.user_id || '';
      this.active_sessionid = res?.active_sessionid || '';
      this.setPriority = res?.priority?.name;
    });
    const loggedInUserData = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string));
    this.loggedInUserId = loggedInUserData?.user_id;
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
  ngOnInit(): void {
    this.getWorkingUsersList();
    this.getFreeUsersList();
    this.getNotLoggedInUsersList();
    this.getLoggedOutUsersList();
    this.subscriptions.push(
      this.reportsService.getUserIdWiseDataRefetch().subscribe((response: any) => {
        if (response && response.flag === true && response.componentName === 'workinguser') {
          this.getWorkingUsersList();
        }
      })
    );
  }

  //#region for Data membar

  // Get working users list
  public getWorkingUsersList() {
    this.taskService.getWorkingUsersList().subscribe((response: any) => {
      if (response && response.data) {
        this.reportsService.setWorkinUserData(response.data);
      } else {
        this.reportsService.setWorkinUserData([]);
      }
    });
  }

  //Get free users list
  public getFreeUsersList() {
    this.taskService.getFreeUsersList().subscribe((response: any) => {
      if (response && response.data) {
        this.reportsService.setFreeUserData(response.data);
      } else {
        this.reportsService.setFreeUserData([]);
      }
    });
  }

  //Get not logged out users list
  public getNotLoggedInUsersList() {
    this.taskService.getNotLoggedInUsersList().subscribe((response: any) => {
      if (response && response.data) {
        this.reportsService.setNotLogInUserData(response.data);
      } else {
        this.reportsService.setNotLogInUserData([]);
      }
    });
  }

  //Get logged out users list
  public getLoggedOutUsersList() {
    this.taskService.getLoggedOutUsersList().subscribe((response: any) => {
      if (response && response.data) {
        this.reportsService.setLogoutUserData(response.data);
      } else {
        this.reportsService.setLogoutUserData([]);
      }
    });
  }

  //This method used for button clicked
  onUserButtonClicked(eventData: any) {
    const functionName = eventData;
    switch (functionName) {
      case 'logout':
        this.logout();
        break;
      case 'breakTime':
        this.breakTime();
        break;
      case 'setPriority':
        this.setTaskPriority();
        break;
      default:
      // console.log('Invalid function name');
    }
  }

  //This method used for logout user
  public breakTime() {
    if (this._user_id && this._user_id !== '' && this._user_id !== this.loggedInUserId && this.active_sessionid) {
      const userData = {
        user_id: this._user_id,
        active_sessionid: this.active_sessionid,
      };
      this.loginService.memberBreakTime('BREAK_TIME', userData).subscribe({
        next: (response: any) => {
          if (response) {
            if (response.success) {
              setTimeout(() => {
                this.ngOnInit();
              }, 100);
            }
          }
        },
        error: (error: any) => {
          console.log('error:', error);
        },
      });
    } else {
      // console.log('unbale to get userID');
    }
  }

  //This method used for logout user
  public logout() {
    const body = null;
    if (this._user_id && this._user_id !== '' && this.active_sessionid) {
      this.httpClient
        .post(this._base_url + this._logout_url, body, {
          headers: {
            id: this._user_id.toString(),
            ip: this.ipAddress,
            active_sessionid: this.active_sessionid,
          },
        })
        .subscribe(
          (response: any) => {
            if (response) {
              this.ngOnInit();
            }
          },
          (err) => {
            console.log('error', err);
          }
        );
    } else {
      // console.log('unbale to get userID');
    }
  }

  //This method used for stop task
  public stopTask() {
    const timerRequestBody: any = {
      task_id: this._task_id,
      user_id: this._user_id,
    };
    this.reportsService.stopTaskTimerReports(timerRequestBody).subscribe({
      next: (response: any) => {
        if (response) {
          if (response.success) {
            this.ngOnInit();
          }
        }
      },
      error: (error: any) => {
        console.log('error:', error);
      },
    });
  }

  public setTaskPriority() {
    const taskId = Encryption._doEncrypt(this._task_id.toString());
    if (!taskId && taskId === '') {
      return;
    }
    this.reportsService.setTaskPriority(taskId, this.setPriority ? this.setPriority : JSON.stringify(this.setPriority)).subscribe({
      next: (response: any) => {
        if (response) {
          if (response.success) {
            this.ngOnInit();
          }
        }
      },
      error: (error: any) => {
        console.log('error:', error);
      },
    });
  }
  //#endregion
}
