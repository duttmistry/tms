import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'apps/angular/main-app/src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RolePermissionService {
  _base_url = environment.base_url;
  _user_url = environment.user_url;
  _user_role_url = environment.user_role_url;
  _user_permission_url = environment.user_permission_url;
  constructor(private httpClient: HttpClient) {}

  getUserRolePermission() {
    return this.httpClient.get(this._base_url + this._user_url + '/' + this._user_role_url + '/' + this._user_permission_url);
  }

  updateUserRolePermission(body: any) {
    return this.httpClient.put(this._base_url + this._user_url + '/' + this._user_role_url + '/' + this._user_permission_url, body, {});
  }
}
