import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from '../common/storage.service';
import { STORAGE_CONSTANTS } from '../common/constants';
import { Encryption } from '@tms-workspace/encryption';
import { ProjectsService } from '../module/projects/projects.service';
import { PreferencesService } from '../module/preferences/preferences.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class MessagingService {
  _base_url = environment.base_url;
  currentMessage = new BehaviorSubject(null);
  preferenceFlag = new BehaviorSubject(true);
  messagingArray: any[] = [];
  isNotification = new BehaviorSubject(false);
  get_isNotification = this.isNotification.asObservable();
  constructor(
    private httpClient: HttpClient,
    private angularFireMessaging: AngularFireMessaging,
    private storageService: StorageService,
    private projectService: ProjectsService,
    private preferenceService: PreferencesService,
    private router: Router
  ) {
    this.angularFireMessaging.messages.subscribe((_msges: any) => {
      // console.log('_msges: ', _msges);
      // console.log('this.messagingArray: ', this.messagingArray);
      // localStorage.setItem('msg', JSON.stringify(this.messagingArray));
      if (this.router.url != "/notifications") {
        this.messagingArray = [...this.messagingArray, _msges]
        this.set_isNotification(true)
        this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.NOTIFICATION, Encryption._doEncrypt(JSON.stringify(this.messagingArray)));
      }
      _msges.onMessage = _msges.onMessage?.bind(_msges);
      _msges.onTokenRefresh = _msges.onTokenRefresh?.bind(_msges);
    });
  }

  set_isNotification(flag: boolean) {
    this.isNotification.next(flag);
  }
  requestPermission() {
    // const body = {
    //   userDeviceToken: null,
    // };
    // this.sendTokenToServer(body).subscribe(
    //   (response: any) => {
    //     if (response && response.data) {
    //       const { data } = response;
    //       // eslint-disable-next-line no-prototype-builtins
    //       const isPreference = data.hasOwnProperty('preference') ? false : true;
    //       this.preferenceFlag.next(isPreference);
    //       this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE, Encryption._doEncrypt(JSON.stringify(isPreference)));
    //       if (!isPreference) {
    //         this.getAllProject();
    //       }
    //       // const notificationdData = response.data;
    //       // this.storageService.setIntoSessionStorage('notifications', JSON.stringify(notificationdData));
    //     }
    //   },
    //   (err: any) => {
    //     console.error('Unable to get permission to notify.', err);
    //   }
    // );
    this.angularFireMessaging.requestToken.subscribe(
      (token: any) => {
        const body = {
          userDeviceToken: token,
          //  userData: user,
        };
        this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.FIREBASE_CLOUD_MESSAGING, token);
        this.sendTokenToServer(body).subscribe((response) => {
          if (response && response.data) {
            // console.log('response: ', response);
            const { data } = response;
            // eslint-disable-next-line no-prototype-builtins
            const isPreference = data.hasOwnProperty('preference') ? false : true;
            this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE, Encryption._doEncrypt(JSON.stringify(isPreference)));
            this.preferenceFlag.next(isPreference);
            // const notificationdData = response.data;
            // this.storageService.setIntoSessionStorage('notifications', JSON.stringify(notificationdData));
          }
        });
      },
      (err) => {
        console.error('Unable to get permission to notify.', err);
      }
    );
  }

  checkPermission() {
    this.angularFireMessaging.requestPermission.subscribe(
      () => {
        console.log('Permission granted!');
      },
      (error) => {
        console.log('Permission Denied!');
        console.error(error);
      }
    );
  }

  receiveMessage() {
    this.angularFireMessaging.messages.subscribe((payload: any) => {
      // console.log('new message received. ', payload);
      this.currentMessage.next(payload);
    });
  }

  public sendTokenToServer(body: any): Observable<any> {
    const url = `${this._base_url}getDeviceToken`; // Replace with your server's API endpoint
    // Make an HTTP POST request to send the token to the server
    return this.httpClient.post(url, body);
  }

  getAllProject() {
    this.projectService.getAllProjects().subscribe(
      (response: any) => {
        if (response && response?.list?.length > 0) {
          this.preferenceFlag.next(false);
        } else {
          this.preferenceFlag.next(true);
          this.onSubmitPreference();
        }
      },
      (error: any) => {
        console.error(error);
      }
    );
  }

  onSubmitPreference() {
    const reqBody = {
      projectIdArray: [],
      userDeviceToken: this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.FIREBASE_CLOUD_MESSAGING) || '',
    };
    this.preferenceService.createPreference(reqBody).subscribe(
      (res: any) => {
        if (res && res.data) {
          this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE, Encryption._doEncrypt(JSON.stringify(true)));
        }
      },
      (error: any) => {
        console.error(error);
      }
    );
  }
}
