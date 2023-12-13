import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { TeamLeaveService } from '../../../core/services/module/leave/team-leave/team-leave.service';
import { IReportingUsersModel } from './team-leave/team-leave.component';
import { Encryption } from '@tms-workspace/encryption';
import { StorageService } from '../../../core/services/common/storage.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { STORAGE_CONSTANTS } from '../../../core/services/common/constants';

@Component({
  selector: 'main-app-team-leave-container',
  templateUrl: './team-leave-container.component.html',
  styleUrls: ['./team-leave-container.component.scss'],
})
export class TeamLeaveContainerComponent implements OnInit {
  public allEmployee: IReportingUsersModel[] = [];
  loading = false;
  userId!: number;
  currentCalendarMonth = moment(new Date()).format('MMMM');
  currentCalendarYear = moment().year();
  initialCalendarDate!: Date;
  allUsers: any = [];
  _currentYear = moment().year();
  fromDate: any;
  toDate: any;
  constructor(private spinnerService: SpinnerService, private teamLeaveService: TeamLeaveService, private storageService: StorageService) {
    window.scroll(0, 0);
  }
  ngOnInit(): void {
    const user: any = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string));
    this.userId = user.user_id;
    this.fromDate = moment().subtract(3, 'days').format('YYYY-MM-DD');
    this.toDate = moment(this.fromDate).add(30, 'days').format('YYYY-MM-DD');
    //  this.getAttendanceReport(this._currentYear, this.fromDate, this.toDate);
  }

  getAttendanceReport(year: number, from: any, to: any) {
    // this.spinnerService.showSpinner(); // hide loader because on change month calendar looks like flicker
    try {
      this.loading = true;
      this.teamLeaveService.getAttendanceReport(year, from, to).subscribe(
        async (res: any) => {
          this.spinnerService.hideSpinner();
          this.initialCalendarDate = this.fromDate;
          this.allEmployee = res.data.map((item: any) => ({
            id: item.user_id,
            name: item.name,
            date: item.date,
            leaveType: item.leaveType,
            employee_image: item.employee_image,
            designation: item.designation,
            leaveSubject: item.leaveSubject,
          }));
          this.allEmployee.sort((a, b) => {
            const usernameA = a.name.toLowerCase();
            const usernameB = b.name.toLowerCase();
            if (usernameA < usernameB) {
              return -1;
            }
            if (usernameA > usernameB) {
              return 1;
            }
            return 0;
          });
          this.loading = false;
          this.getAllReportingPersons();
        },
        (error) => {
          this.spinnerService.hideSpinner();
          return error;
        }
      );
    } catch (error) {
      console.log('err', error);
    }
  }

  getAllReportingPersons() {
    // // this.spinnerService.showSpinner();
    // this.teamLeaveService.getAllReportingPersons(this.userId).subscribe(
    //   async (res: any) => {
    //     this.spinnerService.hideSpinner();
    //     this.allUsers = res.data.map((user: any) => ({
    //       id: user.id,
    //       name: user.first_name + ' ' + user.last_name,
    //       employee_image: user.employee_image,
    //       designation: user.designation,
    //     }));
    //     /**
    //      * get user id array list who apply for leave
    //      * and filter allUser array list according to array
    //      */
    this.allUsers = [...this.allEmployee.filter((item, index, array) => index === array.findIndex((findTest) => findTest.id === item.id))];
    this.teamLeaveService.updateCalendarData(this.allUsers, this.allEmployee, this.allUsers.length ? true : false);

    /** */
    // },
    // (error) => {
    //   this.spinnerService.hideSpinner();
    // }
    // );
  }

  getMonthWiseCalendarData(date: Date) {
    this.fromDate = moment(date).format('YYYY-MM-DD');
    this.toDate = moment(date).add(30, 'days').format('YYYY-MM-DD');
    this._currentYear = moment(date).year();
    this.getAttendanceReport(this._currentYear, this.fromDate, this.toDate);
    if (this.currentCalendarMonth == moment(date).format('MMMM')) {
      return;
    }
    this.currentCalendarMonth = moment(date).format('MMMM');
    this.currentCalendarYear = moment(date).year();
  }
}
