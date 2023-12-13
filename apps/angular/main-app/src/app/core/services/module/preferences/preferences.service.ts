import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  _base_url = environment.base_url;
  _preference_url = environment.preference_url;
  _bulk_update = '/bulkprojectupdate';
  constructor(private http: HttpClient) {}

  getPreferenceList() {
    return this.http.get(this._base_url + this._preference_url);
  }

  updatePreferenceList(body: any) {
    return this.http.put(this._base_url + this._preference_url, body);
  }

  updateLeavePreference(body: any) {
    return this.http.put(this._base_url + this._preference_url + '/leave', body);
  }

  updateNotificationPreference(body: any) {
    return this.http.put(this._base_url + this._preference_url + '/notifications', body);
  }

  updateProjectPreference(body: any) {
    return this.http.put(this._base_url + this._preference_url + '/project', body);
  }

  createProjectPreference(body: any) {
    return this.http.post(this._base_url + this._preference_url, body);
  }

  updateAllPreference(body: any) {
    return this.http.put(this._base_url + this._preference_url + this._bulk_update, body);
  }

  createPreference(body: any) {
    return this.http.post(this._base_url + this._preference_url, body);
  }
}
