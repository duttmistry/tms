import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './../../../../../environments/environment';

import { BehaviorSubject, Subject, map } from 'rxjs';
import { StorageService } from '../../common/storage.service';
import { Encryption } from '@tms-workspace/encryption';
import { STORAGE_CONSTANTS } from '../../common/constants';
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private breakTimeStatus = new Subject<boolean>();
  private breakTimeStatus$ = this.breakTimeStatus.asObservable();

  _base_url = environment.base_url;
  _task_base_url = environment.task_base_url;
  _user_url = environment.user_url;
  _user_pending_time_url = environment.user_pending_time_url;
  _user_list_url = environment.user_list_url;
  _user_skill_desc_url = environment.user_skill_desc_url;
  _time_history_url = environment.time_history_url;
  constructor(private httpClient: HttpClient, private storageService: StorageService) {}

  getLoggedInUserId(): number {
    const user = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string));
    return user.user_id;
  }

  getUserDropdown(body?: any) {
    return this.httpClient.get(this._task_base_url + this._user_url + '/' + 'dropdown');
  }
  getAllUsers(body?: any) {
    return this.httpClient.post(
      this._base_url + this._user_url + '/' + this._user_list_url,
      body
        ? body
        : {
            sortBy: 'first_name',
          }
    );
  }

  updateTimeManually(user_id: string, body: any) {
    return this.httpClient.post(
      this._base_url + 'user/time',

      body,
      {
        headers: {
          id: user_id,
        },
      }
    );
  }

  getAllLeadUsers() {
    return this.httpClient.get(this._task_base_url + this._user_url + '/' + 'lead');
  }

  getUsersList(body: any) {
    return this.httpClient.post(this._base_url + this._user_url + '/' + this._user_list_url, body);
  }

  getReportingPersonList() {
    return this.httpClient.get(this._base_url + this._time_history_url);
  }

  getUserCertificateFile(url: string) {
    return this.httpClient.get(this._base_url + url);
  }

  getUserTimingHistoryData(user_id: string, params: any) {
    return this.httpClient.get(this._base_url + this._user_url + '/time/history', {
      headers: {
        id: user_id.toString(),
        fromDate: params.fromDate,
        toDate: params.toDate,
        orderBy: params.orderBy,
        sortBy: params.sortBy,
        page: params.page.toString(),
        limit: params.limit.toString(),
      },
    });
  }

  getUserPendingTime() {
    return this.httpClient.get(this._base_url + this._user_url + '/' + this._user_pending_time_url, {
      headers: {
        ip: '192.168.0.122',
      },
    });
  }

  getUserById(id: string) {
    return this.httpClient
      .get(this._base_url + 'user', {
        headers: {
          id: id.toString(),
        },
      })
      .pipe(map((res: any) => res.data || res));
  }

  updateSkillDescription(description: string) {
    return this.httpClient.put(this._base_url + this._user_url + '/' + this._user_skill_desc_url, {
      skill_description: description,
    });
  }

  // return loggedIn user details
  getUserDataFromLS() {
    let userData = localStorage.getItem(STORAGE_CONSTANTS.USER_DATA) as string;
    if (userData) {
      userData = JSON.parse(Encryption._doDecrypt(userData));
    }
    return userData || '';
  }

  //#region [Break time Notification]
  getBreakTimeStatusProvider() {
    return this.breakTimeStatus$;
  }
  setBreakTimeStatus(status: boolean) {
    this.breakTimeStatus.next(status);
  }
  //#endregion
}
