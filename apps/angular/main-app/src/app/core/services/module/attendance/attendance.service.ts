import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'apps/angular/main-app/src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  _base_url = environment.base_url;
  _attendance_report_url = environment.attendance_report_url;
  constructor(private httpClient: HttpClient) {}

  getAttendanceReportData(body: any) {
    return this.httpClient.post(this._base_url + this._attendance_report_url, body);
  }
}
