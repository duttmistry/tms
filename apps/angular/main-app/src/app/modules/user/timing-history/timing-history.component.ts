import { Location } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { UserService } from '../../../core/services/module/users/users.service';
import { ITeamMembersData } from '../../../core/model/projects/project.model';
import moment from 'moment';
import { Subscription } from 'rxjs';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { ActivatedRoute } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import * as excelJS from 'exceljs';
import * as fs from 'file-saver';
import { MatDialog } from '@angular/material/dialog';
import { UpdateTimeModelComponent } from './updateTimeModel/update-time-model.component';
import { SiteSettingService } from '../../../core/services/common/site-setting.service';
import { STORAGE_CONSTANTS } from '../../../core/services/common/constants';
import { SnackbarComponent } from '@tms-workspace/material-controls';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'apps/angular/main-app/src/environments/environment';
@Component({
  selector: 'main-app-timing-history',
  templateUrl: './timing-history.component.html',
  styleUrls: ['./timing-history.component.scss'],
})
export class TimingHistoryComponent implements OnInit, OnDestroy, AfterViewInit {
  //#region properties
  orderBy = 'desc';
  userControl = new FormControl();
  reportingPersons: ITeamMembersData[] = [];
  displayedColumns: string[] = [
    'action',
    'action_start_date',
    'action_end_date',
    'total_time',
    'full_Name',
    'actionBy',
    'reason',
    'ipAddress',
    'deviceType',
    'browser',
  ];
  timingHistoryDataSource = new MatTableDataSource([]);
  emptyData = new MatTableDataSource([{ empty: 'row' }]);
  subscriptions: Subscription[] = [];
  timingHistoryList: any = [];
  timingHistoryListDataSouce: any = [];
  timingHistoryListData: any = [];
  userId: string;
  filterByDateForm!: FormGroup;
  limit: any = 10;
  currentPage = 1;
  totalRecords!: number;
  isExportTimingHistory = false;
  isAllowedToUpdateTime = false;
  showSpinner = true;
  loggedInUserId: any;
  loggedInUserRole: any;
  totalWorked: any;
  idleTime: any;
  manualAdjustment: any;
  userDetails: any;
  fullName: any;
  baseUrl = environment.base_url;
  showSpinnerUserDetails = true;

  // isUserLeaveManager:any = false;
  // isUserLeaveResponsiblePerson:any = false;
  // isSuperAdmin = false;

  public maxDate = new Date();

  //#endregion

  constructor(
    private location: Location,
    private dialog: MatDialog,
    private userService: UserService,
    private spinnerService: SpinnerService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private siteSettingService: SiteSettingService
  ) {
    let id = this.route.snapshot.params['id'] || '';
    this.userId = id ? Encryption._doDecrypt(id) : '';

    this.loggedInUserId = this.userService.getLoggedInUserId();
    const user = JSON.parse(Encryption._doDecrypt(localStorage.getItem(STORAGE_CONSTANTS.USER_DATA) as string));
    this.loggedInUserRole = user.user_role;

    // if (this.loggedInUserRole == 'Super Admin') {
    //   this.isSuperAdmin = true;
    // }
    this.initializeForm();
    this.checkIfUserAllowedToUpdateTime();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // this.getReportingPersonList();
    this.getTimingHistoryData();
  }

  checkIfUserAllowedToUpdateTime() {
    if (this.loggedInUserRole == 'Super Admin') {
      this.isAllowedToUpdateTime = true;
    }
    this.siteSettingService.getModuleWiseSiteSettingsData('leave').subscribe((res: any) => {
      if (res.data) {
        let leaveRPData = res.data.find((data: any) => data.identifier == 'leave_reponsible_person');
        if (leaveRPData && leaveRPData.value) {
          if (leaveRPData.value.find((resp_id: number) => resp_id.toString() === this.loggedInUserId.toString())) {
            this.isAllowedToUpdateTime = true;
          }
        }
      }
    });
  }

  initializeForm() {
    this.filterByDateForm = new FormGroup({
      fromDate: new FormControl(moment().format('YYYY-MM-DD')),
      toDate: new FormControl(moment().format('YYYY-MM-DD')),
    });
  }

  // filter --start--
  onFilterByUser() {
    const user_id = this.userControl.value.id || '';
    this.userId = user_id ? user_id : this.userId;
    this.getTimingHistoryData();
  }

  goBack() {
    this.location.back();
  }

  // on date change, get timing history data
  onFilterDateChange() {
    const formValue = this.filterByDateForm.getRawValue();

    if (formValue.fromDate && !formValue.toDate) {
      this.filterByDateForm.controls['toDate'].setErrors({
        endDateReq: true,
      });
      return;
    } else {
      this.filterByDateForm.controls['toDate'].setErrors(null);
    }

    if (formValue.fromDate && formValue.toDate) {
      // if both dates are there then call method
      this.getTimingHistoryData();
    }
  }

  openUpdateTimeModel() {
    const dialogRef = this.dialog.open(UpdateTimeModelComponent, {
      width: '500px',
      disableClose: true,
      data: {
        userId: this.userId,
      },
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((result) => {
        if (result.timeUpdated) {
          this.snackBar.openFromComponent(SnackbarComponent, {
            data: { message: result.message },
            duration: 45000,
          });
          this.getTimingHistoryData();
        }
      })
    );
  }

  changeOrderBy() {
    this.orderBy = this.orderBy == 'asc' ? 'desc' : 'asc';
    this.getTimingHistoryData();
  }
  //filter --end--

  // get the list of users who report to logged in user
  getReportingPersonList() {
    this.subscriptions.push(
      this.userService.getReportingPersonList().subscribe((response: any) => {
        if (response) {
          if (response.data && response.data.length > 0) {
            this.reportingPersons = response.data.map((user: any) => ({
              id: user.id,
              name: user.first_name + ' ' + user.last_name,
              avatar: user.employee_image,
            }));
            // find current user from ReportingPersonList
            const currentUser: any = this.reportingPersons.find((user: any) => user.id == this.userId);
            if (currentUser) {
              this.userControl.setValue(currentUser);
            }
            // if (this.userId) {
            //   this.getTimingHistoryData();
            // }
          }
        }
      })
    );
  }

  // API to get timing history data
  getTimingHistoryData() {
    this.showSpinner = true;
    const params = {
      fromDate: this.filterByDateForm.get('fromDate')?.value
        ? moment(this.filterByDateForm.get('fromDate')?.value).format('YYYY-MM-DD')
        : moment().format('YYYY-MM-DD'),
      toDate: this.filterByDateForm.get('toDate')?.value
        ? moment(this.filterByDateForm.get('toDate')?.value).format('YYYY-MM-DD')
        : moment().format('YYYY-MM-DD'),
      orderBy: this.orderBy,
      sortBy: 'created_at',
      page: this.currentPage,
      limit: this.limit,
    };
    this.showSpinnerUserDetails = true;
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.userService.getUserTimingHistoryData(this.userId, params).subscribe({
        next: (response: any) => {
          if (response) {
            const responseData = response.data || '';
            this.limit = responseData.limit || 0;
            this.totalRecords = responseData.totalRecords || 0;
            if (responseData.list && responseData.list.result && responseData.list.result.length > 0) {
              responseData.list.result.map((responseDataObject: any) => {
                // responseDataObject.action_start_date = responseDataObject?.action_start_date
                //   ? moment(responseDataObject?.action_start_date).format('DD/MM/YYYY, h:mm A')
                //   : '-';
                // responseDataObject.action_end_date = responseDataObject?.action_end_date
                //   ? moment(responseDataObject?.action_end_date).format('DD/MM/YYYY, h:mm A')
                //   : '-';
                responseDataObject.action_start_date = responseDataObject?.action_start_date
                  ? responseDataObject?.action == 'MANUAL_TIME_REMOVE' || responseDataObject?.action == 'MANUAL_TIME_ADD'
                    ? moment(responseDataObject?.action_start_date).format('DD/MM/YYYY')
                    : moment(responseDataObject?.action_start_date).format('DD/MM/YYYY, h:mm A')
                  : '-';
                responseDataObject.action_end_date = responseDataObject?.action_end_date
                  ? responseDataObject?.action == 'MANUAL_TIME_REMOVE' || responseDataObject?.action == 'MANUAL_TIME_ADD'
                    ? moment(responseDataObject?.action_end_date).format('DD/MM/YYYY')
                    : moment(responseDataObject?.action_end_date).format('DD/MM/YYYY, h:mm A')
                  : '-';
                responseDataObject.actionBy = responseDataObject?.action_by_name || responseDataObject?.full_Name || '';
                responseDataObject.total_time = responseDataObject?.action === 'LOGOUT' ? '-' : responseDataObject?.total_time;
                responseDataObject.action_end_date = responseDataObject?.action === 'LOGOUT' ? '-' : responseDataObject?.action_end_date;
                responseDataObject.deviceType =
                  responseDataObject?.login_capture_data?.browser_client?.deviceType?.charAt(0).toUpperCase() +
                  responseDataObject?.login_capture_data?.browser_client?.deviceType?.slice(1);
              });
              this.totalWorked = this.convertMinutesToHHMM(responseData?.list?.totalWorkTime || 0);
              this.idleTime = this.convertMinutesToHHMM(responseData?.list?.totalIdealTime || 0);
              this.manualAdjustment = this.convertMinutesToHHMM(responseData?.list?.totalManualAdjustTime || 0);
              this.fullName = responseData?.list?.userData?.first_name + ' ' + responseData?.list?.userData?.last_name || '';
              this.userDetails = responseData?.list?.userData;

              console.log('responseData.list: ', responseData.list);
              if (responseData.list && responseData?.list?.result.length > 0) {
                this.timingHistoryListDataSouce = new MatTableDataSource(responseData?.list?.result) || [];
              }
            } else {
              this.timingHistoryList = [];
              this.timingHistoryListDataSouce = new MatTableDataSource(this.timingHistoryList);
            }
            this.spinnerService.hideSpinner();
            this.showSpinnerUserDetails = false;
            this.showSpinner = false;
          }
        },
        error: (error: any) => {
          // console.log('error:', error);
          this.spinnerService.hideSpinner();
          this.showSpinnerUserDetails = false;
          this.showSpinner = false;
        },
      })
    );
  }

  exportExcel() {
    this.isExportTimingHistory = true;
    // console.log(this.timingHistoryListData);
    const params = {
      fromDate: this.filterByDateForm.get('fromDate')?.value
        ? moment(this.filterByDateForm.get('fromDate')?.value).format('YYYY-MM-DD')
        : moment().format('YYYY-MM-DD'),
      toDate: this.filterByDateForm.get('toDate')?.value
        ? moment(this.filterByDateForm.get('toDate')?.value).format('YYYY-MM-DD')
        : moment().format('YYYY-MM-DD'),
      orderBy: this.orderBy,
      sortBy: 'created_at',
      page: this.currentPage,
      limit: 0,
    };
    this.userService.getUserTimingHistoryData(this.userId, params).subscribe({
      next: (response: any) => {
        // console.log('response: ', response);
        this.isExportTimingHistory = false;
        const responseData = response.data || '';
        if (responseData?.list && responseData?.list?.result && responseData?.list?.result?.length > 0) {
          responseData?.list?.result?.map((responseDataObject: any) => {
            responseDataObject.action_start_date = responseDataObject?.action_start_date
              ? responseDataObject?.action == 'MANUAL_TIME_REMOVE' || responseDataObject?.action == 'MANUAL_TIME_ADD'
                ? moment(responseDataObject?.action_start_date).format('DD/MM/YYYY')
                : moment(responseDataObject?.action_start_date).format('DD/MM/YYYY, h:mm A')
              : '-';
            responseDataObject.action_end_date = responseDataObject?.action_end_date
              ? responseDataObject?.action == 'MANUAL_TIME_REMOVE' || responseDataObject?.action == 'MANUAL_TIME_ADD'
                ? moment(responseDataObject?.action_end_date).format('DD/MM/YYYY')
                : moment(responseDataObject?.action_end_date).format('DD/MM/YYYY, h:mm A')
              : '-';
            responseDataObject.actionBy = responseDataObject?.action_by_name || responseDataObject?.full_Name || '';
            responseDataObject.total_time = responseDataObject?.action === 'LOGOUT' ? '-' : responseDataObject?.total_time;
            responseDataObject.action_end_date = responseDataObject?.action === 'LOGOUT' ? '-' : responseDataObject?.action_end_date;
          });
        }
        const headers = [
          'Sr. No.',
          'User',
          'Action',
          'Action start time',
          'Action end time',
          'Total time',
          'Action By',
          'Reason',
          'Ip Address',
          'Device type',
          'Browser',
        ];

        // 'Sr. No.' == A
        // 'Full Name' == B
        // 'Action' == C
        // 'Action start time' == D
        // 'Action end time' == E
        // 'Total time' == F
        // 'Action By' == G

        const workbook = new excelJS.Workbook(); // Create a new workbook
        const worksheet = workbook.addWorksheet(`Timing History`); // New Worksheet

        const monthStatusRow = worksheet.addRow([`Timing History`]);
        monthStatusRow.getCell(1).font = { bold: true, underline: true };
        worksheet.mergeCells('A1:K1');

        monthStatusRow.eachCell((cell) => {
          cell.alignment = { horizontal: 'center' };
        });

        worksheet.addRow([]);
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center' };
        });
        worksheet.getColumn('A').width = 15;
        worksheet.getColumn('B').width = 20;
        worksheet.getColumn('C').width = 20;
        worksheet.getColumn('D').width = 20;
        worksheet.getColumn('E').width = 20;
        worksheet.getColumn('F').width = 20;
        worksheet.getColumn('G').width = 20;
        worksheet.getColumn('H').width = 20;
        worksheet.getColumn('I').width = 20;
        worksheet.getColumn('J').width = 20;
        worksheet.getColumn('K').width = 20;
        const data: any = [];
        if (responseData?.list && responseData?.list?.result && Array.isArray(responseData?.list?.result) && responseData?.list?.result?.length > 0) {
          responseData?.list?.result?.forEach((user: any, index: any) => {
            data.push([
              index + 1, //A
              user?.full_Name || '-', //B
              user?.action || '-', // C
              user?.action_start_date || '-', // D
              user?.action_end_date || '-', // E
              user?.total_time || '-', // F
              user?.actionBy || '-', // G
              user?.reason || '-', // H
              user?.login_capture_data?.ip || '-', // I
              user?.login_capture_data?.browser_client?.deviceType || '-', // J
              user?.login_capture_data?.browser_client?.browser || '-', // K
            ]);
          });
        }
        const addedRows = worksheet.addRows(data);
        addedRows.forEach((row) => {
          // console.log('row', row);
          row.eachCell((cell) => {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          });
        });
        worksheet.addRow([]);
        workbook.xlsx.writeBuffer().then((data: any) => {
          const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          fs.saveAs(blob, `Timing_History_${this.fullName}.xlsx`);
        });
      },
      error: (error: any) => {
        this.isExportTimingHistory = false;
        // console.log('error:', error);
        // this.spinnerService.hideSpinner();
      },
    });
  }

  // on page change, get timing history data
  onPageSelectionChange(event: any) {
    this.limit = event?.pageSize;
    this.currentPage = event?.pageIndex + 1;
    this.getTimingHistoryData();
  }

  // unsubscribe observables subscriptions
  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
  convertMinutesToHHMM(minutes: number) {
    if (minutes < 0) {
      minutes = minutes * -1;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
      const formattedMinutes = remainingMinutes < 10 ? `0${remainingMinutes}` : `${remainingMinutes}`;

      return `-${formattedHours}:${formattedMinutes}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
      const formattedMinutes = remainingMinutes < 10 ? `0${remainingMinutes}` : `${remainingMinutes}`;

      return `${formattedHours}:${formattedMinutes}`;
    }
  }
}
