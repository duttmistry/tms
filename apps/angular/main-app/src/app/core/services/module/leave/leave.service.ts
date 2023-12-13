import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { Observable, map } from 'rxjs';
import { IApproverUserResModel } from '../../../model/leave/leave.model';
@Injectable({
  providedIn: 'root',
})
export class LeaveService {
  _base_url = environment.base_url;
  _leave_base_url = environment.leave_base_url;
  _leaves_url = environment.leaves_url;
  _leave_url = environment.leave_url;
  _subjects_url = environment.subjects_url;
  _balance_url = environment.balance_url;
  _user_url = environment.user_url;
  _approver_url = environment.approver_url;
  _reporting_user_url = environment.reporting_users_url;
  _transaction = environment.transaction;
  _user = environment.user_url;

  constructor(private httpClient: HttpClient) {}

  updateLeaveStatus(body: any, leave_id: number) {
    return this.httpClient.put(this._leave_base_url + this._leaves_url + '/' + 'action', body, {
      headers: {
        id: leave_id.toString(),
      },
    });
  }

  getMyTeamsLeave(from_date: string, to_date: string, leave_id: string, user_id: string) {
    return this.httpClient.get(this._leave_base_url + this._leave_url + '/Teams', {
      headers: {
        id: leave_id,
        user_id,
        from_date,
        to_date,
      },
    });
  }

  getLeaveHistoryData(params: any, userId: string) {
    return this.httpClient.get(this._leave_base_url + this._leaves_url, {
      params: params,
      headers: {
        id: userId,
      },
    });
  }

  getLeaveApprovalCount() {
    return this.httpClient.get(this._leave_base_url + this._leaves_url + '/' + 'approval/count');
  }
  getLeaveApprovalData(params:any,userIds:any) {
    return this.httpClient.post(this._leave_base_url + this._leaves_url + '/' + 'approval',{userIds} ,{
      params
     });
  }

  getLeaveUsersData(status:string) {
    return this.httpClient.get(this._leave_base_url + this._leaves_url + '/' + 'approval' + '/employee',{
      params: {
        status,
      },
    });
  }
  getLeaveSubjects() {
    return this.httpClient.get(this._leave_base_url + this._leave_url + '/' + this._subjects_url);
  }

  getLeaveDetailsById(id: string) {
    return this.httpClient
      .get(this._leave_base_url + this._leave_url, {
        headers: {
          id,
        },
      })
      .pipe(map((res: any) => res.data));
  }

  getLeaveBalance(user_id: string) {
    // console.log('get leave bal');
    return this.httpClient.get(this._leave_base_url + this._leaves_url + '/' + this._balance_url, {
      headers: {
        id: user_id,
      },
    });
  }

  getApproverUsers(user_id: string): Observable<IApproverUserResModel[]> {
    return this.httpClient
      .get(this._base_url + this._user_url + '/' + this._leave_url + '/' + this._approver_url, {
        headers: {
          id: user_id,
        },
      })
      .pipe(map((res: any) => res.data));
  }

  checkLeaveBalance(body: any, user_id: string, leave_id?: string) {
    return this.httpClient.post(this._leave_base_url + this._leave_url + '/check', body, {
      headers: {
        id: leave_id || '',
        user_id,
      },
    });
  }

  addLeave(body: any, user_id: string) {
    return this.httpClient.post(this._leave_base_url + this._leave_url, body, {
      headers: {
        id: user_id,
      },
    });
  }

  updateLeave(body: any, id: string, user_id: string) {
    return this.httpClient.put(this._leave_base_url + this._leave_url, body, {
      headers: {
        id,
        user_id,
      },
    });
  }

  cancelLeave(id: number, body: any) {
    return this.httpClient.delete(this._leave_base_url + this._leave_url, {
      headers: {
        id: id.toString(),
      },
      body,
    });
  }

  getLeaveTransactionsData(id: any, body: any) {
    return this.httpClient.get(this._leave_base_url + this._leave_url + '/' + this._transaction, {
      params: {
        limit: body?.limit,
        page: body?.page,
        leave_type: body?.leaveType,
        search_remark: body?.search,
        from_date: body?.fromDate,
        to_date: body?.toDate,
      },
      headers: {
        id: id.toString(),
      },
    });
  }

  getUsersLeaveBalance(userId: string) {
    return this.httpClient.get(this._leave_base_url + this._leave_url + '/' + this._transaction + '/' + this._user, {
      headers: {
        id: userId.toString(),
      },
    });
  }
}
