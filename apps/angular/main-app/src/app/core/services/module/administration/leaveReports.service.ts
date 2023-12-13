import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class LeaveReportsService {
  _leave_base_url = environment.leave_base_url;
  _leave_reports = environment.administration_leaves_report;
  _leave_url = environment.leave_url;
  _get_leave_master_data = environment.get_leave_master_data;
  _update_current_leave = environment.update_current_leave;
  constructor(private http: HttpClient) {
    // console.log('');
  }

  getLeavesReport(body?: any) {
    return this.http.get(this._leave_base_url + this._leave_reports, {
      params: {
        ...body,
      },
    });
  }

  updateLeavesReport(body: any, employee_id: any) {
    const _emp_id = JSON.stringify(employee_id);
    return this.http.put(this._leave_base_url + this._leave_url + '/balance', body, {
      headers: {
        id: _emp_id,
      },
    });
  }

  getLeaveMasterData() {
    return this.http.get(this._leave_base_url + this._get_leave_master_data);
  }

  updateCurrentLeave(leaveData: any, userId: any) {
    const body = {
      current_CL: leaveData?.cl ? leaveData?.cl.toString() : '',
      current_LWP: leaveData?.lwp ? leaveData?.lwp.toString() : '',
      current_PL: leaveData?.pl ? leaveData?.pl.toString() : '',
      Comments: leaveData?.comment,
    };
    return this.http.put(this._leave_base_url + this._update_current_leave, body, {
      headers: {
        id: userId.toString(),
      },
    });
  }
}
