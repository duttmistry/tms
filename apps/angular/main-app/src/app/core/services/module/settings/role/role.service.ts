import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'apps/angular/main-app/src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  _base_url = environment.base_url;
  _user_url = environment.user_url;
  _user_role_url = environment.user_role_url;
  _user_roles_url = environment.user_roles_url;

  constructor(private httpClient: HttpClient) {}

  addRole(userRole: string) {
    return this.httpClient.post(this._base_url + this._user_url + '/' + this._user_role_url, {
      title: userRole,
    });
  }

  updateRole(body: any, id: string) {
    return this.httpClient.put(this._base_url + this._user_url + '/' + this._user_role_url, body, {
      headers: {
        id: id.toString(),
      },
    });
  }
  getAllRoles() {
    return this.httpClient.get(this._base_url + this._user_url + '/' + this._user_roles_url);
  }

  deleteRole(id: number) {
    return this.httpClient.delete(this._base_url + this._user_url + '/' + this._user_role_url, {
      headers: {
        id: id.toString(),
      },
    });
  }
}
