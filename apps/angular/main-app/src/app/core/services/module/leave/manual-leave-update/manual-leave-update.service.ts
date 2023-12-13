import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ManualUpdateLeaveBalanceService {
  _base_url = environment.base_url;
  _leave_base_url = environment.leave_base_url;
  _leave_url = environment.leave_url;
  _leave_manual_update_list = environment.leave_balance_manual_update_list_url;
  _leave_manual_update_save_draft = environment.leave_balance_manual_update_save_draft_url;
  _leave_manual_update_save_final = environment.leave_balance_manual_update_final_save_url;
  _manul_update_log_list = environment.manul_update_log_list;
  _manul_update_history_details = environment.manul_update_history_details;

  constructor(private httpClient: HttpClient) {}

  // To Fetch List
  getListOfLeaveBalance(serachValue: string, userIds: string, employeeSortOrder: any, currentDate: any) {
    employeeSortOrder = employeeSortOrder ? employeeSortOrder : 'ASC';
    employeeSortOrder = employeeSortOrder.toLowerCase();
    let url =
      this._leave_base_url + this._leave_url + '/' + this._leave_manual_update_list + `?monthDate=${currentDate}&orderBy=${employeeSortOrder}`;
    if (serachValue) {
      url += `&search=${serachValue}`;
    }

    if (userIds && userIds.length) {
      url += `&userIds=${userIds}`;
    }

    return this.httpClient.get(url);
  }

  // To Save As Draft
  saveLeaveBalanceAsDraft(draftLogId: any, darftData: any, currentDate: any) {
    const url = this._leave_base_url + this._leave_url + '/' + this._leave_manual_update_save_draft;
    const headers: any = { monthDate: currentDate };
    if (draftLogId) {
      headers['draftlogid'] = draftLogId.toString();
    }

    return this.httpClient.post(url, { data: darftData }, { headers: headers });
  }

  // To Save Finally
  saveLeaveBalanceFinal(draftLogId: any, darftData: any, currentDate: any) {
    const url = this._leave_base_url + this._leave_url + '/' + this._leave_manual_update_save_final;
    const headers: any = { monthDate: currentDate };
    if (draftLogId) {
      headers['draftlogid'] = draftLogId.toString();
    }
    return this.httpClient.post(
      url,
      { data: darftData },
      {
        headers: headers,
      }
    );
  }

  // To Get List of Logs
  getListOfLeaveBalanceLogs(limit: any, currentPage: any) {
    const url = this._leave_base_url + this._leave_url + '/' + this._manul_update_log_list + `?limit=${limit}&page=${currentPage}`;
    return this.httpClient.get(url);
  }

  // To Fetch List of Details for history
  getListOfLeaveBalanceHistory(serachValue: string, employeeSortOrder: any, draftId: any) {
    employeeSortOrder = employeeSortOrder ? employeeSortOrder : 'ASC';
    employeeSortOrder = employeeSortOrder.toLowerCase();
    let url = this._leave_base_url + this._leave_url + '/' + this._manul_update_history_details + `?orderBy=${employeeSortOrder}`;
    if (serachValue) {
      url += `&search=${serachValue}`;
    }
    const headers: any = { id: draftId.toString() };

    return this.httpClient.get(url, { headers: headers });
  }
}
