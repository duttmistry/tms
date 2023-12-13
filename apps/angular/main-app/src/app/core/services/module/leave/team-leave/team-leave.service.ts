import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'apps/angular/main-app/src/environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TeamLeaveService {
  _leave_base_url = environment.leave_base_url;
  _base_url = environment.base_url;
  _team_leave_report_url = environment.team_leave_report_url;
  _user_url = environment.user_url;
  _reporting_users_url = environment.reporting_users_url;

  _leave_url = environment.leave_url;
  private calendarDataSubject = new BehaviorSubject<any>('');
  calendarData$ = this.calendarDataSubject.asObservable();
  constructor(private httpClient: HttpClient) {}

  getAllReportingPersons(id: number) {
    return this.httpClient.get(this._leave_base_url + this._reporting_users_url, {
      headers: {
        id: id.toString(),
      },
    });
  }

  getAttendanceReport(year: number, from: any, to: any) {
    return this.httpClient.get(this._leave_base_url + this._team_leave_report_url, {
      params: {
        year,
        from,
        to,
      },
    });
  }

  updateCalendarData(users: any, employees: any, showDropdown?: boolean) {
    const passData = { userData: users, empData: employees, showDropdown: showDropdown };
    this.calendarDataSubject.next(passData);
  }

  getCalendarData() {
    return this.calendarData$;
  }
}
