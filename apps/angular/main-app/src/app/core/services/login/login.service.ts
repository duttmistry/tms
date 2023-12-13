import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { StorageService } from '../common/storage.service';
import { Encryption } from '@tms-workspace/encryption';
import { environment } from './../../../../environments/environment';
import { PERMISSION_CONSTANTS, STORAGE_CONSTANTS } from '../common/constants';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';
import { DeviceDetectorService } from 'ngx-device-detector';
@Injectable({
  providedIn: 'root',
})
export class LoginService {
  _base_url = environment.base_url;
  _login_url = environment.login_url;
  _logout_url = environment.logout_url;
  _break_url = environment.break_url;
  _member_break_url = environment.member_break_url;
  _user_url = environment.user_url;
  _pending_time_url = environment.user_pending_time_url;

  // ipAddress = '192.168.0.122';
  ipAddress = '-';
  _get_banners_url = environment.login_banners_url;

  private _previousSession = new BehaviorSubject<any>(null);
  deviceInfo :any

  constructor(private httpClient: HttpClient, private storageService: StorageService, private router: Router,private deviceService: DeviceDetectorService) {
    // this.getIPAddress();
    this.getDeviceInfo();
  }

  //Get greeting message from free api
  getGreetingMessage() {
    const url = 'https://api.quotable.io/quotes/random?minLength=50&maxLength=100&limit=1,tag=Motivational';
    return this.httpClient.get(url);
  }

  isUserLoggedIn() {
    if (this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.ACCESS_TOKEN)) {
      return true;
    } else {
      return false;
    }
  }

  getIPAddress() {
    this.httpClient.get('http://api.ipify.org/?format=json').subscribe((res: any) => {
      this.ipAddress = res.ip;
    });
  }

  login(accountId: string, password: string, reason?: any,deviceInformation?:any) {
    const body = { reason,deviceInformation };
    // console.log("REASON",reason)
    accountId = Encryption._doEncrypt(accountId);
    password = Encryption._doEncrypt(password);
    let currentDateTime = moment().toString();

    return this.httpClient.post(this._base_url + this._login_url, body, {
      headers: {
        employee_id: accountId,
        password,
        ip: this.ipAddress,
        currentDateTime,
      },
    });
  }

  logout() {
    // console.log('log out');
    // const deviceToken = localStorage.getItem(STORAGE_CONSTANTS.FIREBASE_CLOUD_MESSAGING);
    //  const body = { userDeviceToken: deviceToken };
    const body = {
      deviceInformation : this.deviceInfo
    };
    let user: any = Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string);
    if (user) {
      user = JSON.parse(user);
      return this.httpClient
        .post(this._base_url + this._logout_url, body, {
          headers: {
            id: user.user_id.toString(),
            ip: this.ipAddress,
          },
        })
        .subscribe((res) => {
          this.removeAllDataFromLS();
          this.router.navigate(['login']);
        });
    } else {
      this.removeAllDataFromLS();
      this.router.navigate(['login']);
      return;
    }
  }

  removeAllDataFromLS() {
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.ACCESS_TOKEN);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.USER_DATA);
    this.storageService.removeFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.REMAINING_TIME);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.BREAK_STATUS);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.RELOAD_COUNTS);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.VISITED_PAGES);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.FIREBASE_CLOUD_MESSAGING);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.SESSION_ID);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.IS_SIDEBAR_OPENED);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.REPORTER_STATUS);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.ACCOUNT);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.NOTIFICATION);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.BREAK_TIME_TASK);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.IS_BREAK_TIME);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.BREAK_TIMER);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.BREAK_TIME_TIMER);
    this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.LEAVE_APPROVAL_FILTERS);
    // this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.IS_MODAL_OPENED);
    // this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.TASK_FILTERS);
  }

  logBreakTime(break_status: string, userId?: any) {
    const body = null;

    return this.httpClient.post(this._base_url + this._break_url, body, {
      headers: {
        ip: this.ipAddress,
        action: break_status,
        id: userId ? userId.toString() : '',
      },
    });
  }

  memberBreakTime(break_status: string, user?: any) {
    // console.log(user);
    const body = null;
    return this.httpClient.post(this._base_url + this._member_break_url, body, {
      headers: {
        ip: this.ipAddress,
        action: break_status,
        id: user.user_id ? user.user_id.toString() : '',
        active_sessionid: user.active_sessionid,
      },
    });
  }

  //manage timers

  getPendingTime() {
    return this.httpClient.get(this._base_url + this._user_url + '/' + this._pending_time_url);
  }

  getBannerData() {
    return this.httpClient.get(this._base_url + this._get_banners_url, {
      headers: {
        currentdate: moment().format('YYYY-MM-DD'),
        // currentdate: '2023-08-30',
      },
    });
  }

  setPreviousSessionMessage(message: any) {
    this._previousSession.next(message);
  }

  getPreviousSession() {
    return this._previousSession.asObservable();
  }

  isDialogOpen(): any {
    // return localStorage.getItem(this.isDialogOpenKey) || false
    const isDialogOpen = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.IS_MODAL_OPENED) || '';
    return JSON.parse(Encryption._doDecrypt(isDialogOpen));
  }

  setDialogOpen(isOpen: boolean) {
    // localStorage.setItem(this.isDialogOpenKey, isOpen.toString());
    this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.IS_MODAL_OPENED, Encryption._doEncrypt(isOpen.toString()));
  }
  getDeviceInfo() {
    try {
        this.deviceInfo = this.deviceService.getDeviceInfo();
    } catch (error) {
        console.error("Error fetching device information:", error); 
    }
}
}
