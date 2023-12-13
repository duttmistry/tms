import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';

import { ChartConfiguration } from 'chart.js';
import * as moment from 'moment';
import { HolidayService } from '../../../core/services/module/holiday/holiday.service';
import { LeaveService } from '../../../core/services/module/leave/leave.service';

import { SpinnerService } from '../../../core/services/common/spinner.service';

import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeamLeaveService } from '../../../core/services/module/leave/team-leave/team-leave.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';

import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/module/users/users.service';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { CommentDialogComponent } from '../../../shared/components/comment-popup-dialog/comment-dialog.component';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { LoginService } from '../../../core/services/login/login.service';
import { PERMISSION_CONSTANTS, STORAGE_CONSTANTS } from '../../../core/services/common/constants';
import { SiteSettingService } from '../../../core/services/common/site-setting.service';

@Component({
  selector: 'app-leave-view',
  templateUrl: './leave-view.component.html',
  styleUrls: ['./leave-view.component.scss'],
})
export class LeaveViewComponent implements OnInit, OnDestroy {
  minDate = new Date('1900-01-01');

  public TotalDoughnutChartLabels: string[] = ['Used', 'Reserved', 'Available'];
  public TotalDoughnutChartDatasets: ChartConfiguration<'doughnut'>['data']['datasets'] = [
    { data: [0, 0, 0], backgroundColor: ['#ea6060', '#60b158', '#d0d0d0'] },
  ];

  public TotalDoughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    cutout: 42,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxHeight: 22, boxWidth: 8, useBorderRadius: true } },
      tooltip: {
        enabled: false,
      },
    },
  };

  public CLDoughnutChartLabels: string[] = ['Used', 'Reserved', 'Available'];
  public CLDoughnutChartDatasets: ChartConfiguration<'doughnut'>['data']['datasets'] = [
    { data: [0, 0, 0], backgroundColor: ['#ea6060', '#60b158', '#d0d0d0'] },
  ];

  public CLDoughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    cutout: 42,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxHeight: 22, boxWidth: 8, useBorderRadius: true } },
      tooltip: {
        enabled: false,
      },
    },
  };

  public LWPDoughnutChartLabels: string[] = ['Used', 'Reserved'];
  public LWPDoughnutChartDatasets: ChartConfiguration<'doughnut'>['data']['datasets'] = [{ data: [0, 0], backgroundColor: ['#ea6060', '#60b158'] }];

  public LWPDoughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    cutout: 42,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxHeight: 22, boxWidth: 8, useBorderRadius: true } },
      tooltip: {
        enabled: false,
      },
    },
    // plugins: { legend: { position: 'left' } },
  };

  public PLDoughnutChartLabels: string[] = ['Used', 'Reserved', 'Available'];
  public PLDoughnutChartDatasets: ChartConfiguration<'doughnut'>['data']['datasets'] = [
    { data: [0, 0, 0], backgroundColor: ['#ea6060', '#60b158', '#d0d0d0'] },
  ];

  public PLDoughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    cutout: 42,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxHeight: 22, boxWidth: 8, useBorderRadius: true } },
      tooltip: {
        enabled: false,
      },
    },

    // plugins: { legend: { position: 'left' } },
  };
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

  reportingUsersCount = 0;
  holidayList: any = [];
  leaveHistoryData: any = [];
  approvalCount = 0;
  public LWPDoughnutChartPlugins: any = [
    {
      beforeDraw(chart: any) {
        const ctx = chart.ctx;
        const txt = 'Center Text';

        //Get options from the center object in options
        const sidePadding = 60;
        const sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
        const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

        //Get the width of the string and also the width of the element minus 10 to give it 5px side padding
        const stringWidth = ctx.measureText(txt).width;
        const elementWidth = chart.innerRadius * 2 - sidePaddingCalculated;

        // Find out how much the font can grow in width.
        const widthRatio = elementWidth / stringWidth;
        // const newFontSize = Math.floor(30 * widthRatio);
        const newFontSize = 50;
        const elementHeight = chart.innerRadius * 2;

        // Pick a new font size so it will not be larger than the height of label.
        //const fontSizeToUse = Math.min(newFontSize, elementHeight);
        const fontSizeToUse = 20;
        ctx.font = fontSizeToUse + 'px sans-serif';
        ctx.fillStyle = 'black';

        // Draw text in center
        ctx.fillText('LWP', centerX, centerY);
        // Draw text in center
      },
    },
  ];

  public PLDoughnutChartPlugins: any = [
    {
      beforeDraw(chart: any) {
        const ctx = chart.ctx;
        const txt = 'Center Text';

        //Get options from the center object in options
        const sidePadding = 60;
        const sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
        const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

        //Get the width of the string and also the width of the element minus 10 to give it 5px side padding
        const stringWidth = ctx.measureText(txt).width;
        const elementWidth = chart.innerRadius * 2 - sidePaddingCalculated;

        // Find out how much the font can grow in width.
        const widthRatio = elementWidth / stringWidth;
        // const newFontSize = Math.floor(30 * widthRatio);
        const newFontSize = 50;
        const elementHeight = chart.innerRadius * 2;

        // Pick a new font size so it will not be larger than the height of label.
        //const fontSizeToUse = Math.min(newFontSize, elementHeight);
        const fontSizeToUse = 20;
        ctx.font = fontSizeToUse + 'px sans-serif';
        ctx.fillStyle = 'black';

        // Draw text in center
        ctx.fillText('PL', centerX, centerY);
      },
    },
  ];
  public TotalDoughnutChartPlugins: any = [
    {
      beforeDraw(chart: any) {
        const ctx = chart.ctx;
        const txt = 'Center Text';

        //Get options from the center object in options
        const sidePadding = 60;
        const sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
        const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

        //Get the width of the string and also the width of the element minus 10 to give it 5px side padding
        const stringWidth = ctx.measureText(txt).width;
        const elementWidth = chart.innerRadius * 2 - sidePaddingCalculated;

        // Find out how much the font can grow in width.
        const widthRatio = elementWidth / stringWidth;
        // const newFontSize = Math.floor(30 * widthRatio);
        const newFontSize = 50;
        const elementHeight = chart.innerRadius * 2;

        // Pick a new font size so it will not be larger than the height of label.
        //const fontSizeToUse = Math.min(newFontSize, elementHeight);
        const fontSizeToUse = 20;
        ctx.font = fontSizeToUse + 'px sans-serif';
        ctx.fillStyle = 'black';

        // Draw text in center
        ctx.fillText('Total', centerX, centerY);
      },
    },
  ];
  public CLDoughnutChartPlugins: any = [
    {
      beforeDraw(chart: any) {
        const ctx = chart.ctx;
        const txt = 'Center Text';

        //Get options from the center object in options
        const sidePadding = 60;
        const sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
        const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

        //Get the width of the string and also the width of the element minus 10 to give it 5px side padding
        const stringWidth = ctx.measureText(txt).width;
        const elementWidth = chart.innerRadius * 2 - sidePaddingCalculated;

        // Find out how much the font can grow in width.
        const widthRatio = elementWidth / stringWidth;
        // const newFontSize = Math.floor(30 * widthRatio);
        const newFontSize = 50;
        const elementHeight = chart.innerRadius * 2;

        // Pick a new font size so it will not be larger than the height of label.
        //const fontSizeToUse = Math.min(newFontSize, elementHeight);
        const fontSizeToUse = 20;
        ctx.font = fontSizeToUse + 'px sans-serif';
        ctx.fillStyle = 'black';

        // Draw text in center
        ctx.fillText('CL', centerX, centerY);
      },
    },
  ];
  selectedDate = new Date();
  allowForLeaveApproval = false;
  allowForTeamLeave = false;
  allowForLeaveRequest = false;
  isUserLeaveResponsiblePerson = false;
  loggedInUserId!: string;
  showSpinner = true;
  constructor(
    private _snackBar: MatSnackBar,
    private spinnerService: SpinnerService,
    private holidayService: HolidayService,
    private leaveService: LeaveService,
    private userService: UserService,
    private router: Router,
    private teamLeaveService: TeamLeaveService,
    private storageService: StorageService,
    private dialog: MatDialog,
    private siteSettingService: SiteSettingService,
    private permisssionService: PermissionService,
    private loginService: LoginService
  ) {}
  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  ngOnInit(): void {
    window.scroll(0, 0);
    this.loggedInUserId = this.userService.getLoggedInUserId().toString();

    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.allowForLeaveRequest = this.permisssionService.getModuleActionPermission(permission, 'leaves', 'request_leave');
      this.allowForLeaveApproval = this.permisssionService.getModuleActionPermission(permission, 'leaves', 'leave_approval');
      this.allowForTeamLeave = this.permisssionService.getModuleActionPermission(permission, 'leaves', 'team_leave');
    } else {
      this.loginService.logout();
    }

    this.getHolidayList();
    this.getLeaveHistoryData();
    this.getLeaveBalanceData();
    this.getLeaveApprovalCount();
    if(this.allowForTeamLeave) {
      this.getReportingUserCount();
    }
    this.checkIfUserIsLeaveResponsiblePerson();
  }

  checkIfUserIsLeaveResponsiblePerson() {
    this.siteSettingService.getModuleWiseSiteSettingsData('leave').subscribe((res: any) => {
      if (res.data) {
        let leaveRPData = res.data.find((data: any) => data.identifier == 'leave_reponsible_person');
        if (leaveRPData && leaveRPData.value) {
          if (leaveRPData.value.find((resp_id: number) => resp_id.toString() === this.loggedInUserId)) {
            this.isUserLeaveResponsiblePerson = true;
          } else {
            this.isUserLeaveResponsiblePerson = false;
          }
        }
      }
    });
  }

  getReportingUserCount() {
    const user: any = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string));

    this.teamLeaveService.getAllReportingPersons(user.user_id).subscribe((res: any) => {
      this.reportingUsersCount = res.data ? res.data.length : 0;
    });
  }
  getLeaveApprovalCount() {
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.leaveService.getLeaveApprovalCount().subscribe(
        (res: any) => {
          this.spinnerService.hideSpinner();
          this.approvalCount = res.data;
        },
        (error) => {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: error.error.message },
            duration: 45000,
          });
          this.spinnerService.hideSpinner();
        }
      )
    );
  }

  getLeaveBalanceData() {
    this.showSpinner = true;
    this.spinnerService.showSpinner();
    let userId = this.userService.getLoggedInUserId();

    this.subscriptions.push(
      this.leaveService.getLeaveBalance(userId.toString()).subscribe(
        (res: any) => {
          this.spinnerService.hideSpinner();
          let totalLeaveBalance = {
            applied_balance: 0,
            reserved_balance: 0,
            current_balance: 0,
          };
          res.data.forEach((data: any) => {
            if (data.leave_type == 'CL') {
              this.CLDoughnutChartLabels = [
                (data.applied_balance || 0) + ' ' + 'Used',

                (data.reserved_balance || 0) + ' ' + 'Reserved',
                (data.current_balance || 0) + ' ' + 'Available',
              ];
              this.CLDoughnutChartDatasets = [
                {
                  data: [data.applied_balance || 0, data.reserved_balance || 0, data.current_balance || 0],
                  backgroundColor: ['#ea6060', '#60b158', '#d0d0d0'],
                },
              ];

              totalLeaveBalance.applied_balance += data.applied_balance;
              totalLeaveBalance.current_balance += data.current_balance;
              totalLeaveBalance.reserved_balance += data.reserved_balance;
            }
            if (data.leave_type == 'LWP') {
              this.LWPDoughnutChartLabels = [(data.current_balance || 0) + ' ' + 'Used', (data.reserved_balance || 0) + ' ' + 'Reserved'];
              this.LWPDoughnutChartDatasets = [
                {
                  data: [data.current_balance || 0, data.reserved_balance || 0],

                  backgroundColor: ['#ea6060', '#60b158'],
                },
              ];

              totalLeaveBalance.applied_balance += data.current_balance;
              totalLeaveBalance.reserved_balance += data.reserved_balance;
            }
            if (data.leave_type == 'PL') {
              this.PLDoughnutChartLabels = [
                data.applied_balance + ' ' + 'Used',

                data.reserved_balance + ' ' + 'Reserved',
                data.current_balance + ' ' + 'Available',
              ];
              this.PLDoughnutChartDatasets = [
                {
                  data: [data.applied_balance || 0, data.reserved_balance || 0, data.current_balance || 0],
                  backgroundColor: ['#ea6060', '#60b158', '#d0d0d0'],
                },
              ];

              totalLeaveBalance.applied_balance += data.applied_balance;
              totalLeaveBalance.current_balance += data.current_balance;
              totalLeaveBalance.reserved_balance += data.reserved_balance;
            }
          });

          this.TotalDoughnutChartLabels = [
            (totalLeaveBalance.applied_balance || 0) + ' ' + 'Used',

            (totalLeaveBalance.reserved_balance || 0) + ' ' + 'Reserved',
            (totalLeaveBalance.current_balance || 0) + ' ' + 'Available',
          ];
          this.TotalDoughnutChartDatasets = [
            {
              data: [totalLeaveBalance.applied_balance || 0, totalLeaveBalance.reserved_balance || 0, totalLeaveBalance.current_balance || 0],
              backgroundColor: ['#ea6060', '#60b158', '#d0d0d0'],
            },
          ];
          this.showSpinner = false;
        },
        (error) => {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: error.error.message },
            duration: 45000,
          });
          this.spinnerService.hideSpinner();
          this.showSpinner = false;
        }
      )
    );
  }

  getHolidayList() {
    this.showSpinner = true;
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.holidayService.getAllHoliday({ year: new Date().getFullYear() }).subscribe(
        (res) => {
          this.spinnerService.hideSpinner();
          if (res && res.length == 0) {
            return;
          }
          this.holidayList = res.list.map((holiday: any) => ({
            festivalName: holiday.title,
            festivalDate: moment(holiday.eventDate).format('YYYY-MM-DD'),
            day: moment(holiday.eventDate).format('dddd'),
            isHoliday: holiday.isHoliday,
          }));
          this.showSpinner = false;
        },
        (error) => {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: error.error.message },
            duration: 45000,
          });
          this.spinnerService.hideSpinner();
          this.showSpinner = false;
        }
      )
    );
  }

  onPageSelectionChange(event: any) {
    this.params.limit = event?.pageSize;
    this.params.page = event.pageIndex + 1;
    this.getLeaveHistoryData();
  }

  resetAllFilters() {
    this.filterByLeaveDate.controls['startDate'].reset();
    this.filterByLeaveDate.controls['endDate'].reset();
    // this.filterByLeaveType.reset();
    this.filterByLeaveStatus.reset();
    this.params = {};
    this.params.limit = 10;
    this.params.page = 1;
    this.getLeaveHistoryData();
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
    this.getLeaveHistoryData();
  }

  // onFilterByLeaveType(event: any) {
  //   this.params.limit = 10;
  //   this.params.page = 1;
  //   if (event instanceof PointerEvent) {
  //     event.stopPropagation();
  //   }
  //   if (this.filterByLeaveType.value) {
  //     this.params.leave_type = this.filterByLeaveType.value;
  //   } else {
  //     delete this.params.leave_type;
  //   }
  //   this.getLeaveHistoryData();
  // }
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
    this.getLeaveHistoryData();
  }

  getLeaveHistoryData() {
    this.showSpinner = true;
    this.subscriptions.push(
      this.leaveService.getLeaveHistoryData(this.params, this.loggedInUserId).subscribe(
        (res: any) => {
          if (res.data && res.data.length == 0) {
            this.leaveHistoryData = [];
            this.leaveHistoryDataSource = new MatTableDataSource(this.leaveHistoryData);
            this.showSpinner = false;
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
            action: '',
          }));

          this.leaveHistoryDataSource = new MatTableDataSource(this.leaveHistoryData);
          this.showSpinner = false;
          // this.leaveHistoryDataSource.paginator = this.paginator;
        },
        (error) => {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: error.error.message },
            duration: 45000,
          });
          this.showSpinner = false;
        }
      )
    );
  }

  redirectToEditLeave(id: number) {
    this.router.navigate(['leave', 'edit', Encryption._doEncrypt(id.toString())]);
  }

  redirectToDetailsPage(id: number) {
    this.router.navigate(['leave', 'details', Encryption._doEncrypt(id.toString())]);
  }

  cancelLeave(id: number) {
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '450px',
      data: {
        label: 'State the reason for cancellation ',
        title: 'Are you sure you want to cancel this leave?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result.confirm) {
        this.spinnerService.showSpinner();
        this.subscriptions.push(
          this.leaveService
            .cancelLeave(id, {
              reason: result.comment,
            })
            .subscribe(
              (res: any) => {
                this._snackBar.openFromComponent(SnackbarComponent, {
                  data: { message: res.message },
                  duration: 45000,
                });

                this.spinnerService.hideSpinner();
                this.getLeaveHistoryData();
                this.getLeaveBalanceData();
              },
              (error) => {
                this._snackBar.openFromComponent(SnackbarComponent, {
                  data: { message: error.error.message },
                  duration: 45000,
                });

                this.spinnerService.hideSpinner();
              }
            )
        );
      }
    });
  }
}
