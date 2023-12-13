import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserRoleService {
  _base_url = environment.base_url;
  _user_url = environment.user_url;
  _user_list = environment.user_list_url;
  _user_roles_url = environment.user_roles_url;
  _user_role_url = environment.user_role_url;
  _user_role_update_url = environment.update_user_role;
  _update_user_role = environment.update_user_role;
  _users_url = environment.users_url;
  constructor(private httpClient: HttpClient) {}

  updateUserRole(body: any, userId: number) {
    return this.httpClient.put(this._base_url + this._user_url + '/' + this._user_role_url + '/' + this._user_role_update_url, body, {
      headers: {
        id: userId.toString(),
      },
    });
  }

  updateMultipleUsersRole(ids: any, role_id: any) {
    const body = {
      id: ids,
      role_id:role_id
    };
    return this.httpClient.put(this._base_url + this._users_url + '/' + this._user_role_url + '/' + this._update_user_role, body, {
    });
  }
}
