import { Injectable } from '@angular/core';
import { environment } from '../../../../../../src/environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { io } from 'socket.io-client';
import { SnackbarComponent } from '@tms-workspace/material-controls';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  _base_url = environment.base_url;
  _task_base_url = environment.task_base_url;
  _stop_task_timer_url_reports = environment.stop_task_timer_url_reports;
  _user_task_report = environment.user_task_report;
  _user_wise_task_report = environment.user_wise_task_report;
  _user_id_wise_task_details = environment.user_id_wise_task_details;
  _set_task_priority = environment.set_task_priority;
  _timing_report = environment.get_timing_report;
  private _logoutUserId = new Subject<any>();
  private _freeUserData = new Subject<any>();
  private _logoutUserData = new Subject<any>();
  private _notLogoutUserData = new Subject<any>();
  private _workingUserData = new Subject<any>();
  private _userData = new Subject<any>();
  private _exportPdf = new Subject<any>();
  private _userIsWiseTaskDetails = new BehaviorSubject<any>(null);
  private _userIdWiseDataRefetch = new BehaviorSubject<any>(null);
  private socket: any;

  constructor(private httpClient: HttpClient, private _snackBar: MatSnackBar) {}
  setUserData(user: any) {
    this._userData.next(user);
  }

  getUserData() {
    return this._userData.asObservable();
  }

  setFreeUserData(data: any) {
    this._freeUserData.next(data);
  }

  getFreeUserData() {
    return this._freeUserData.asObservable();
  }

  setLogoutUserData(data: any) {
    this._logoutUserData.next(data);
  }

  getLogoutUserData() {
    return this._logoutUserData.asObservable();
  }

  setNotLogInUserData(data: any) {
    this._notLogoutUserData.next(data);
  }

  getNotLogInUserData() {
    return this._notLogoutUserData.asObservable();
  }
  setWorkinUserData(data: any) {
    this._workingUserData.next(data);
  }

  getWorkingUserData() {
    return this._workingUserData.asObservable();
  }

  setUserIdWiseTaskDetails(taskDetails: any) {
    this._userIsWiseTaskDetails.next(taskDetails);
  }

  getUserIdWiseTaskData() {
    return this._userIsWiseTaskDetails.asObservable();
  }

  setUserIdWiseDataRefetch(userObj: any) {
    this._userIdWiseDataRefetch.next(userObj);
  }

  getUserIdWiseDataRefetch() {
    return this._userIdWiseDataRefetch.asObservable();
  }

  setUserFlag(flag: boolean) {
    const data = {
      ...this._userIdWiseDataRefetch.value,
      flag: flag,
    };
    this._userIdWiseDataRefetch.next(data);
  }

  setExportFlag(requestBody: any) {
    this._exportPdf.next(true);
    this.socket = io(this._task_base_url);
    this.socket.emit('exportReportEvent', requestBody);
    this.socket.on('exportReportResponse', (data: any) => {
      if (data && data.path) {
        const downlodeLink = `${this._task_base_url}${data.path}`;
        window.open(downlodeLink);
      }
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'Your file is downloaded.' },
      });
      this._exportPdf.next(false);
    });
  }

  getExportFlag() {
    return this._exportPdf.asObservable();
  }

  stopTaskTimerReports(requestBody: any) {
    return this.httpClient.post<any>(this._task_base_url + this._stop_task_timer_url_reports, requestBody);
  }

  getUserTaskReport(requestBody: any) {
    return this.httpClient.get<any>(this._task_base_url + this._user_task_report, {
      headers: {
        project_id: requestBody.projectId.toString(),
        start_date: requestBody.fromDate.toString(),
        end_date: requestBody.toDate.toString(),
      },
    });
  }

  getUserWiseTaskReport(requestBody: any) {
    return this.httpClient.get<any>(this._task_base_url + this._user_wise_task_report, {
      headers: {
        project_id: requestBody.projectId.toString(),
        start_date: requestBody.fromDate.toString(),
        end_date: requestBody.toDate.toString(),
        user_id: requestBody.user_id.toString(),
      },
    });
  }

  getUserIdWiseTaskDetails(userId: any) {
    // console.log(userId);
    return this.httpClient.get<any>(this._task_base_url + this._user_id_wise_task_details, {
      headers: { user_id: userId },
    });
  }

  setTaskPriority(taskId: any, setPriority: any) {
    return this.httpClient.get<any>(this._task_base_url + this._set_task_priority, {
      headers: { id: taskId, priority: setPriority },
    });
  }
  getTimingReport(params: any) {
    // console.log(userId);
    return this.httpClient.get<any>(this._task_base_url + this._timing_report, {
      params: params,
    });
  }
}
