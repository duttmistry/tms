import { Component, OnDestroy, OnInit } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { Location } from '@angular/common';

import * as moment from 'moment';
import { LeaveService } from '../../../core/services/module/leave/leave.service';

import { SpinnerService } from '../../../core/services/common/spinner.service';

import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FormControl, FormGroup } from '@angular/forms';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { environment } from 'apps/angular/main-app/src/environments/environment';
import { STORAGE_CONSTANTS } from '../../../core/services/common/constants';

@Component({
  selector: 'app-leave-history',
  templateUrl: './leave-history.component.html',
  styleUrls: ['./leave-history.component.scss'],
})
export class LeaveHistoryComponent implements OnInit, OnDestroy {
  minDate = new Date('1900-01-01');
  userInformation: any;
  showUserDetailsSpinner = true;
  baseUrl = environment.base_url;
  subscriptions: Subscription[] = [];
  displayedColumns: string[] = ['appliedDate', 'leaveDateFromTo', 'leaveType', 'leaveSubject', 'noOfDays', 'status', 'action'];
  leaveHistoryDataSource = new MatTableDataSource<any>();
  emptyData = new MatTableDataSource([{ empty: 'row' }]);
  filterByLeaveDate = new FormGroup({
    startDate: new FormControl(''),
    endDate: new FormControl(''),
  });
  // filterByLeaveType = new FormControl();
  filterByLeaveStatus = new FormControl();
  leaveStatusOptions = ['Pending', 'Rejected', 'Approved', 'Cancelled'];

  params: any = {
    limit: 10,
    page: 1,
  };
  totalPage: any;
  totalRecords: any;

  leaveHistoryData: any = [];

  userId!: number;
  showLeaveHistorySpinner = true;
  constructor(
    private _snackBar: MatSnackBar,
    private spinnerService: SpinnerService,
    private leaveService: LeaveService,
    private location: Location,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    window.scroll(0, 0);
    const id = this.activatedRoute.snapshot.params['id'] || null;
    const userData = JSON.parse(Encryption._doDecrypt(localStorage.getItem(STORAGE_CONSTANTS.USER_DATA) as any));
    this.userId = id !== null ? +Encryption._doDecrypt(id) : userData.user_id;

    this.getLeaveHistoryData(this.userId);
    this.getUsersLeaveBalance(this.userId);
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
  getUsersLeaveBalance(userId: number) {
    this.showUserDetailsSpinner = true;
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.leaveService.getUsersLeaveBalance(userId.toString()).subscribe(
        (response: any) => {
          if (response && response.data) {
            this.userInformation = response?.data;
          }
          this.spinnerService.hideSpinner();
          this.showUserDetailsSpinner = false;
        },
        (error: any) => {
          this.spinnerService.hideSpinner();
          this.showUserDetailsSpinner = false;
        }
      )
    );
  }

  redirectToDetails(id: number) {
    this.router.navigate(['leave', 'details', Encryption._doEncrypt(id.toString())]);
  }

  onPageSelectionChange(event: any) {
    this.params.limit = event?.pageSize;
    this.params.page = event.pageIndex + 1;
    this.getLeaveHistoryData(this.userId);
  }

  resetAllFilters() {
    this.filterByLeaveDate.controls['startDate'].reset();
    this.filterByLeaveDate.controls['endDate'].reset();
    // this.filterByLeaveType.reset();
    this.filterByLeaveStatus.reset();
    this.params = {};
    this.params.limit = 10;
    this.params.page = 1;
    this.getLeaveHistoryData(this.userId);
  }

  onFilterByDate(event: any) {
    if (event instanceof PointerEvent) {
      event.stopPropagation();
    }
    if (this.filterByLeaveDate.controls['startDate'].value && !this.filterByLeaveDate.controls['endDate'].value) {
      this.filterByLeaveDate.controls['endDate'].setErrors({
        endDateReq: true,
      });
      return;
    } else {
      this.filterByLeaveDate.controls['endDate'].setErrors(null);
    }
    this.params.limit = 10;
    this.params.page = 1;

    let end_date = this.filterByLeaveDate.controls['endDate'].value as any;
    let start_date = this.filterByLeaveDate.controls['startDate'].value as any;
    if (
      start_date &&
      end_date &&
      start_date.isSameOrBefore(end_date) &&
      this.filterByLeaveDate.controls['startDate'].valid &&
      this.filterByLeaveDate.controls['endDate'].valid
    ) {
      let startDate = this.filterByLeaveDate.controls['startDate'].value
        ? (this.filterByLeaveDate.controls['startDate'].value as any).format('YYYY-MM-DD')
        : '';
      let endDate = this.filterByLeaveDate.controls['endDate'].value
        ? (this.filterByLeaveDate.controls['endDate'].value as any).format('YYYY-MM-DD')
        : '';
      this.params.from_date = startDate;
      this.params.to_date = endDate;
    } else {
      delete this.params.from_date;
      delete this.params.to_date;
    }
    this.getLeaveHistoryData(this.userId);
  }

  onFilterByLeaveStatus(event: any) {
    if (event instanceof PointerEvent) {
      event.stopPropagation();
    }

    this.params.limit = 10;
    this.params.page = 1;
    if (this.filterByLeaveStatus.value) {
      this.params.status = this.filterByLeaveStatus.value.toLocaleUpperCase();
    } else {
      delete this.params.status;
    }
    this.getLeaveHistoryData(this.userId);
  }

  getLeaveHistoryData(userId: number) {
    this.showLeaveHistorySpinner = true;
    this.subscriptions.push(
      this.leaveService.getLeaveHistoryData(this.params, userId.toString()).subscribe(
        (res: any) => {
          if (res.data && res.data.length == 0) {
            this.leaveHistoryData = [];
            this.leaveHistoryDataSource = new MatTableDataSource(this.leaveHistoryData);
            this.showLeaveHistorySpinner = false;
            return;
          }

          this.params.limit = res.data.limit;
          this.totalPage = res.data.totalPage;
          this.totalRecords = res.data.totalRecords;
          this.params.page = res.data.currentPage;
          this.leaveHistoryData = res.data.list.map((leave: any) => ({
            id: leave.id,
            appliedDate: moment(leave.requested_date).format('DD/MM/YYYY'),
            allowEdit: leave.leaveApproval.every((item: any) => item.status == 'PENDING'),
            isDatePassed: moment(leave.from_date.split('T')[0]).isSameOrBefore(new Date().toISOString().split('T')[0], 'day'),
            leaveDateFromTo: moment(leave.from_date).format('DD/MM/YYYY') + '-' + moment(leave.to_date).format('DD/MM/YYYY'),
            leaveTypes: leave.leaveTypes,
            leaveSubject: leave.leaveSubject ? leave.leaveSubject.title : leave.leave_subject_text,
            noOfDays: leave.no_of_days.toString(),
            status: leave.status,
          }));

          this.leaveHistoryDataSource = new MatTableDataSource(this.leaveHistoryData);
          this.showLeaveHistorySpinner = false;

          // this.leaveHistoryDataSource.paginator = this.paginator;
        },
        (error) => {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: error.error.message },
            duration: 45000,
          });
          this.showLeaveHistorySpinner = false;
        }
      )
    );
  }

  redirectBack() {
    this.location.back();
  }
}
