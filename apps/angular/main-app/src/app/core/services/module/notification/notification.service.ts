import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  _base_url = environment.base_url;
  _preference_url = environment.preference_url;

  constructor(private http: HttpClient) {}

  getNotificationLogs(params: any) {
    return this.http.get(this._base_url + this._preference_url + '/getLogs', {
      params,
    });
  }
}
