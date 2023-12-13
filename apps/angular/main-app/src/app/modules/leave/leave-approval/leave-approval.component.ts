import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../src/environments/environment';
import moment from 'moment';
import { LeaveService } from '../../../core/services/module/leave/leave.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { Encryption } from '@tms-workspace/encryption';
import { Router } from '@angular/router';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { Observable, Subscription } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { SiteSettingService } from '../../../core/services/common/site-setting.service';
import { LeaveApprovalDialogComponent } from '../leave-approval-dialog/leave-approval-dialog.component';
import { ALL, APPROVED, CANCELLED, LEAVE_STATUS_FILTER_OPTIONS, PENDING, REJECTED, STORAGE_CONSTANTS } from '../../../core/services/common/constants';
import { CommentDialogComponent } from '../../../shared/components/comment-popup-dialog/comment-dialog.component';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import * as excelJS from 'exceljs';
import * as fs from 'file-saver';

@Component({
  selector: 'app-leave-approve',
  templateUrl: './leave-approval.component.html',
  styleUrls: ['./leave-approval.component.scss'],
})
export class LeaveApprovalComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;
  minDate = new Date('1900-01-01');

  _base_url = environment.base_url;
  displayedColumns: string[] = ['user', 'appliedDate', 'leaveDateFromTo', 'leaveType', 'leaveSubject', 'noOfDays', 'leaveStatus', 'action'];
  dataSource = new MatTableDataSource<any>();
  emptyData = new MatTableDataSource([{ empty: 'row' }]);
  userId!: number;
  PENDING = PENDING;
  REJECTED = REJECTED;
  CANCELLED = CANCELLED;
  APPROVED = APPROVED;
  statusFilterControl = new FormControl(PENDING);
  filteredLeaveUsers!: Observable<any>;
  leaveUsers: any = [];
  UserFilterControl:FormControl<any> = new FormControl([]);
  subscription: Subscription[] = [];

  LEAVE_STATUS_FILTER_OPTIONS = LEAVE_STATUS_FILTER_OPTIONS;
  // limit: any = 10;
  totalPage: any;
  totalRecords: any;
  // currentPage: any = 1;
  approvalList: any = [];

  isUserLeaveResponsiblePerson = false;
  showSpinner = true;
  changedSelection = false;
  employeeSearchControl = new FormControl('');
  // filteredEmployeeList: any[] =  []
  employeeList: any[] = [];
  selectedEmployee: any[] = [];
  leaveUsersData: any[] = [];
  // sortBy: any = 'from_date';
  // orderBy: any = 'asc';
  filterByLeaveDate = new FormGroup({
    startDate: new FormControl(''),
    endDate: new FormControl(''),
  });
  // from_date: any = "";
  // to_date: any = "";
  isExportTimingHistory = false;
  params: any = {
    limit: 100,
    page: 1,
    sortBy: 'from_date',
    orderBy: 'asc',
    status: this.statusFilterControl.value,
  };

  constructor(
    private _snackBar: MatSnackBar,
    private spinnerService: SpinnerService,
    private leaveService: LeaveService,
    private router: Router,
    private storageService: StorageService,
    private dialog: MatDialog,
    private siteSettingService: SiteSettingService,
    private _liveAnnouncer: LiveAnnouncer
  ) {
    window.scroll(0, 0);
  }

  ngOnInit(): void {
    let user: any = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string));
    this.userId = user.user_id;

    this.checkIfUserIsLeaveResponsiblePerson();
    let leave_approval_filters: any = localStorage.getItem(STORAGE_CONSTANTS.LEAVE_APPROVAL_FILTERS);
    if (leave_approval_filters) {
      leave_approval_filters = JSON.parse(leave_approval_filters);

      if(leave_approval_filters.status){
        this.params.status = leave_approval_filters.status;
       this.statusFilterControl.setValue(leave_approval_filters.status);
      }
      if( leave_approval_filters.from_date){
        this.params.from_date = leave_approval_filters.from_date;
        this.filterByLeaveDate.get('startDate')?.setValue(leave_approval_filters.from_date);
      }
      if(leave_approval_filters.to_date){
        this.params.to_date = leave_approval_filters.to_date
        this.filterByLeaveDate.get('endDate')?.setValue(leave_approval_filters.to_date);
      }
      
    
    }

    this.getLeaveUsersData(leave_approval_filters ? leave_approval_filters.userIds : null);
    // console.log('leave_approval_filters.userIds',leave_approval_filters.userIds);
    
    this.getLeaveApprovalData(leave_approval_filters ? leave_approval_filters.userIds : null);
  }

  ngOnDestroy(): void {
    this.subscription.forEach((s) => s.unsubscribe());
  }
  checkIfUserIsLeaveResponsiblePerson() {
    this.siteSettingService.getModuleWiseSiteSettingsData('leave').subscribe((res: any) => {
      if (res.data) {
        let leaveRPData = res.data.find((data: any) => data.identifier == 'leave_reponsible_person');
        if (leaveRPData && leaveRPData.value) {
          if (leaveRPData.value.find((resp_id: number) => resp_id.toString() === this.userId.toString())) {
            this.isUserLeaveResponsiblePerson = true;
          } else {
            this.isUserLeaveResponsiblePerson = false;
          }
        }
      }
    });
  }

  getLeaveUsersData(userIds?: any) {
    //  const body = users
    return this.leaveService.getLeaveUsersData(ALL).subscribe((res: any) => {
      this.leaveUsers = res.data || [];
      this.leaveUsersData = res.data || [];
      if(userIds && userIds.length > 0){
        const assignee = this.leaveUsers.filter((user: any) => userIds.find((puid: any) => puid == user.id));

        this.selectedEmployee = assignee;
       
        this.UserFilterControl.patchValue(assignee);
      }
    
     
    });
  }
  onPageSelectionChange(event: any) {
    this.params.limit = event?.pageSize;
    this.params.page = event.pageIndex + 1;
    this.getLeaveApprovalData();
  }

  selectionChange(event: any, data: any) {}

  filterByStatus() {
    // this.params.limit = 100;
    this.params.page = 1;
    this.params.status = this.statusFilterControl.value;
    this.getLeaveApprovalData();
  }
  ApproveRejectLeave(status: string, id: number) {
    const dialogRef = this.dialog.open(LeaveApprovalDialogComponent, {
      width: '450px',
      data: {
        status,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      // console.log(result);
      if (result || result == '') {
        this.spinnerService.showSpinner();
        this.subscription.push(
          this.leaveService
            .updateLeaveStatus(
              {
                status,
                action_comment: result,
              },
              id
            )
            .subscribe(
              (res: any) => {
                this._snackBar.open(res.message);
                this.spinnerService.hideSpinner();
                this.getLeaveApprovalData();
              },
              (error) => {
                this._snackBar.openFromComponent(SnackbarComponent, {
                  data: { message: error.error.message },
                  duration: 45000,
                });
                //   this._snackBar.open(error.message);
                this.spinnerService.hideSpinner();
              }
            )
        );
      }
    });
  }
  redirectToLeaveDashboard() {
    this.router.navigate(['leave', 'view']);
  }
  redirectToEditLeave(id: number) {
    this.router.navigate(['leave', 'edit', Encryption._doEncrypt(id.toString())]);
  }

  redirectToDetails(id: number) {
    this.router.navigate(['leave', 'details', Encryption._doEncrypt(id.toString())]);
  }

  redirectToViewLeaveHistory(id: number) {
    this.router.navigate(['leave', 'history', Encryption._doEncrypt(id.toString())]);
  }

  cancelLeave(id: number) {
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '450px',
      data: {
        title: 'Are you sure you want to cancel this leave?',
        comment_required: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result.confirm) {
        this.spinnerService.showSpinner();
        this.leaveService
          .updateLeaveStatus(
            {
              status: CANCELLED,
              action_comment: result.comment,
            },
            id
          )
          .subscribe(
            (res: any) => {
              this._snackBar.open(res.message);
              this.spinnerService.hideSpinner();
              this.getLeaveApprovalData();
            },
            (error) => {
              this._snackBar.openFromComponent(SnackbarComponent, {
                data: { message: error.error.message },
                duration: 45000,
              });
              //   this._snackBar.open(error.message);
              this.spinnerService.hideSpinner();
            }
          );
        // this.leaveService
        //   .cancelLeave(id, {
        //     comment: result.comment,
        //   })
        //   .subscribe(
        //     (res: any) => {
        //       this.spinnerService.hideSpinner();
        //       this.getLeaveApprovalData();
        //       this._snackBar.open(res.message);
        //     },
        //     (error) => {
        //       this.spinnerService.hideSpinner();
        //       this._snackBar.open(error.error.message);
        //     }
        //   );
      }
    });
  }

  getLeaveApprovalData(deUserIds?:any) {
    this.showSpinner = true;
    let userIds:any = [];
    console.log('this.selectedEmployee',this.selectedEmployee);
    
    if(deUserIds && deUserIds.length > 0){
      userIds = deUserIds
    }else{
       userIds = this.selectedEmployee.map((user: any) => user.id);
    }
   
    this.subscription.push(
      this.leaveService.getLeaveApprovalData(this.params, userIds).subscribe(
        (res: any) => {
          let leave_approval_filters = {
            ...this.params,
          };
          leave_approval_filters.userIds = userIds ? userIds : [];

          localStorage.setItem(STORAGE_CONSTANTS.LEAVE_APPROVAL_FILTERS, JSON.stringify(leave_approval_filters));
          this.approvalList = [];
          if (res.data && res.data.length == 0) {
            this.approvalList = [];
            this.dataSource = new MatTableDataSource(this.approvalList);
            this.showSpinner = false;
            return;
          }
          // console.log("RESPONSE====>", res.data)
          this.params.limit = res.data.limit;
          this.totalPage = res.data.totalPages;
          this.totalRecords = res.data.totalRecords;
          this.params.page = res.data.currentPage;
          const currentDate = moment();
          // console.log('%c  currentDate:', 'color: #0e93e0;background: #black;', currentDate);
          const threeDaysFromNow = moment().add(3, 'days');
          // console.log('%c  threeDaysFromNow:', 'color: #0e93e0;background: #aaefe5;', threeDaysFromNow);

          // threeDaysFromNow.setDate(currentDate.getDate() + 3);

          res.data.list;
          // res.data.list.forEach((leave: any) => {
          //   let user = leave.leaveApproval.find((user: any) => this.userId == user.user_id);
          //   if (leave?.user) {
          //     this.approvalList.push({
          //       id: leave.id,
          //       user: leave.user,
          //       status: user?.status,
          //       leaveStatus: leave.status,
          //       leaveSubject: leave.leaveSubject ? leave.leaveSubject.title : leave.leave_subject_text,
          //       noOfDays: leave.no_of_days,
          //       leaveDateFromTo:
          //         moment(leave.from_date).format('DD/MM/YYYY') +
          //         ' ' +
          //         '(' +
          //         leave.leave_from_slot +
          //         ')' +
          //         ' ' +
          //         '-' +
          //         ' ' +
          //         moment(leave.to_date).format('DD/MM/YYYY') +
          //         ' ' +
          //         '(' +
          //         leave.leave_to_slot +
          //         ')',
          //       leaveType: this.formatLeaveType(leave.leaveTypes),
          //       isDatePassed: moment(leave.to_date.split('T')[0]).isBefore(new Date().toISOString().split('T')[0], 'day'),
          //       action: '',
          //       isRejectedLog: leave.leaveHistoryLog.filter((log: any) => log.action == 'Leave REJECTED'),
          //       appliedDate: moment(leave.requested_date).format('DD/MM/YYYY'),
          //       leaveDescription: leave.description,
          //       isLeaveInNextThreeDays:
          //         moment(leave.from_date).isSameOrBefore(threeDaysFromNow, 'day') &&
          //         moment(leave.from_date).isSameOrAfter(currentDate, 'day') && leave.status === 'PENDING',
          //       leaveApprovalHistoryByTlPm: leave?.leaveApproval.filter((log: any) =>
          //         log?.status == APPROVED && (log?.user?.designation === 'Project Manager' || log?.user?.designation === 'Team Leader')
          //         // leave.status == PENDING && log?.status == APPROVED && (log?.user?.designation === 'Project Manager' || log?.user?.designation === 'Team Leader')
          //       ),

          //     });
          //   }
          // });
          res?.data?.list.forEach((leave: any) => {
            let user = leave.leaveApproval?.find((user: any) => this.userId == user.user_id);
            // console.log('%c  user:', 'color: #0e93e0;background: #aaefe5;', user);
            if (leave?.user) {
              this.approvalList.push({
                id: leave?.id,
                user: leave?.user,
                status: user?.status,
                leaveStatus: leave?.status,
                leaveSubject: leave?.leaveSubject ? leave?.leaveSubject?.title : leave?.leave_subject_text,
                noOfDays: leave?.no_of_days,
                leaveDateFromTo:
                  moment(leave?.from_date).format('DD/MM/YYYY') +
                  ' ' +
                  '(' +
                  leave?.leave_from_slot +
                  ')' +
                  ' ' +
                  '-' +
                  ' ' +
                  moment(leave?.to_date).format('DD/MM/YYYY') +
                  ' ' +
                  '(' +
                  leave?.leave_to_slot +
                  ')',
                leaveType: this.formatLeaveType(leave?.leaveTypes),
                isDatePassed: moment(new Date(leave?.to_date)).isBefore(new Date(), 'month'),
                action: '',
                appliedDate: moment(leave?.requested_date).format('DD/MM/YYYY'),
                leaveDescription: leave?.description,
                isLeaveInNextThreeDays:
                  moment(leave?.from_date).isSameOrBefore(threeDaysFromNow, 'day') &&
                  moment(leave?.from_date).isSameOrAfter(currentDate, 'day') &&
                  leave?.status === 'PENDING',
                // leaveApprovalHistoryByTlPm: leave?.leaveApproval?.filter((log: any) =>
                //   leave?.status == PENDING && log?.status == APPROVED && (log?.user?.designation === 'Project Manager' || log?.user?.designation === 'Team Leader')
                // ),
                // leaveRejectHistoryByTlPm:leave?.leaveApproval?.filter((log: any) =>
                // leave?.status == PENDING && log?.status == REJECTED && (log?.user?.designation === 'Project Manager' || log?.user?.designation === 'Team Leader')),
                leaveApprovalHistoryByTlPm: leave?.leaveApproval?.filter((log: any) => {
                  return log?.status === APPROVED && log?.type === 'leave_reporting_person';
                }),
                leaveRejectHistoryByTlPm: leave?.leaveApproval?.filter((log: any) => {
                  return log?.status === REJECTED && leave?.status === PENDING && log?.type === 'leave_reporting_person';
                }),
              });
              // console.log("LEVAEapproval",leave?.leaveApproval)
            }
          });
          this.dataSource = new MatTableDataSource(this.approvalList);
          // console.log('this.approvalList: ', this.approvalList);
          this.showSpinner = false;
          // console.log("THIS APPROVAL LIST",this.approvalList)
          // console.log("res.data.list",res.data.list)
          let temp: any = [];
          res?.data?.list?.map((data: any) => {
            if (!temp.includes(data?.user_id)) {
              temp.push(data?.user_id);
            }
          });
          this.showSpinner = false;
          // const body = {
          //   userIds: temp
          // }
          // this.getLeaveUsersData(body)
        },
        (error) => {
          this.showSpinner = false;
        }
      )
    );
  }

  formatLeaveType(leaveTypes: any) {
    let leave_type_string = '';
    if (leaveTypes && leaveTypes.length) {
      leaveTypes.forEach((leave: any, index: number) => {
        leave_type_string += (index !== 0 ? ', ' : '') + leave.leave_type + ' (' + leave.leave_days + ')';
      });
    }

    // console.log(leave_type_string);
    return leave_type_string;
  }
  assigneeSelectionToggled(eventArgs: any) {
    if (!eventArgs && this.changedSelection) {
      this.changedSelection = false;
      // this.getProjectidsWiseTaskList();
      this.employeeSearchControl.patchValue('');
      // this.filteredEmployeeList = [...this.employeeList];
      this.getLeaveApprovalData();
      //  this.filterList(eventArgs, this.leaveUsers);
      this.leaveUsers = [...this.leaveUsersData];
    }
  }
  filterList(eventArgs: any, leaveUsers: any) {
    const searchTerm = eventArgs.target.value.toLowerCase();
    this.leaveUsers = leaveUsers?.filter((member: any) => {
      const firstName = member.first_name.toLowerCase();
      const lastName = member.last_name.toLowerCase();
      return firstName.includes(searchTerm) || lastName.includes(searchTerm);
    });
  }
  onAssigneeCheckChangeOption(assignee: any) {
    const index = this.selectedEmployee.findIndex((user: any) => user.id === assignee.id);
    this.params.page = 1;
    if (index !== -1) {
      this.selectedEmployee.splice(index, 1);
    } else {
      this.selectedEmployee.push(assignee);
    }
    this.UserFilterControl.patchValue([...this.selectedEmployee]);
  }
  clearAssigneeFilter() {
    this.selectedEmployee = [];
    this.UserFilterControl.patchValue([...this.selectedEmployee]);
    this.getLeaveApprovalData();
    // this.getLeaveUsersData();
  }
  selectAllAsignee() {
    const additionalItems = this.leaveUsers.filter((user: any) => this.selectedEmployee.findIndex((_user: any) => _user.id === user.id) === -1);
    this.selectedEmployee = [...this.selectedEmployee, ...additionalItems];

    this.UserFilterControl.patchValue([...this.selectedEmployee]);
    this.changedSelection = true;
  }

  unselcteAllAsignee() {
    const itemsAfterRemoved = this.selectedEmployee.filter((user: any) => this.leaveUsers.findIndex((_user: any) => _user.id === user.id) === -1);
    this.selectedEmployee = [...itemsAfterRemoved];

    this.UserFilterControl.patchValue([...this.selectedEmployee]);

    this.changedSelection = true;
    // this.getLeaveUsersData();
    //this.getProjectidsWiseTaskList();
  }
  orderByFromDate(sort: any) {
    const direction = sort.direction;
    const orderBy = 'from_date';
    if (orderBy === this.params.sortBy) {
      this.params.orderBy = this.params.orderBy === 'asc' ? 'desc' : 'asc';
    } else {
      this.params.sortBy = orderBy;
      this.params.orderBy = 'asc';
    }
    this.getLeaveApprovalData();
  }
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
  onFilterByDate(event: any) {
    if (event instanceof PointerEvent) {
      event.stopPropagation();
    }
    if (this.filterByLeaveDate.controls['startDate']?.value && !this.filterByLeaveDate.controls['endDate']?.value) {
      this.filterByLeaveDate.controls['endDate'].setErrors({
        endDateReq: true,
      });
      return;
    } else {
      this.filterByLeaveDate.controls['endDate'].setErrors(null);
    }
    //  this.params.limit = 10;
    this.params.page = 1;

    let end_date = this.filterByLeaveDate.controls['endDate']?.value as any;
    let start_date = this.filterByLeaveDate.controls['startDate']?.value as any;
    if (
      start_date &&
      end_date &&
      start_date.isSameOrBefore(end_date) &&
      this.filterByLeaveDate.controls['startDate'].valid &&
      this.filterByLeaveDate.controls['endDate'].valid
    ) {
      let startDate = this.filterByLeaveDate.controls['startDate']?.value
        ? (this.filterByLeaveDate.controls['startDate']?.value as any).format('YYYY-MM-DD')
        : '';
      let endDate = this.filterByLeaveDate.controls['endDate']?.value
        ? (this.filterByLeaveDate.controls['endDate']?.value as any).format('YYYY-MM-DD')
        : '';
      this.params.from_date = startDate;
      this.params.to_date = endDate;
    } else {
      delete this.params.from_date;
      delete this.params.to_date;
    }
    this.getLeaveApprovalData();
  }
  exportExcel() {
    this.isExportTimingHistory = true;
    let dataToExport = [];
    let userIds = this.selectedEmployee.map((user: any) => user.id);
    const params = {
      from_date: this.params.from_date,
      to_date: this.params.to_date,
      status: this.params.status,
      orderBy: this.params.orderBy,
      sortBy: this.params.sortBy,
      limit: 0,
      page: this.params.page,
    };
    this.leaveService.getLeaveApprovalData(params, userIds).subscribe(
      (res: any) => {
        this.isExportTimingHistory = false;
        // user?.user?.first_name + ' ' + user?.user?.last_name, //B
        //       user.appliedDate, // C
        //       user.leaveDateFromTo, // D
        //       user.leaveType, // E
        //       user.leaveSubject, // F
        //       user.noOfDays, // G
        //       user.leaveStatus, // H
        let responseData = res?.data || '';
        // console.log('responseData', responseData);
        if (responseData?.list && responseData?.list?.length > 0) {
          responseData?.list.map((responseDataObject: any) => {
            responseDataObject.leaveDateFromTo =
              moment(responseDataObject?.from_date).format('DD/MM/YYYY') +
              ' ' +
              '(' +
              responseDataObject?.leave_from_slot +
              ')' +
              ' ' +
              '-' +
              ' ' +
              moment(responseDataObject?.to_date).format('DD/MM/YYYY') +
              ' ' +
              '(' +
              responseDataObject?.leave_to_slot +
              ')';
            responseDataObject.appliedDate = moment(responseDataObject?.requested_date).format('DD/MM/YYYY');
            responseDataObject.leaveType = this.formatLeaveType(responseDataObject?.leaveTypes);
            (responseDataObject.leaveStatus = responseDataObject?.status),
              (responseDataObject.leaveSubject = responseDataObject?.leaveSubject
                ? responseDataObject?.leaveSubject?.title
                : responseDataObject?.leave_subject_text),
              (responseDataObject.noOfDays = responseDataObject?.no_of_days);
          });
        }

        const headers = ['Sr. No.', 'User', 'Applied Date', 'Leave Date', 'Type', 'Subject', 'Leave Description', 'No. of days', 'Status'];
        const workbook = new excelJS.Workbook(); // Create a new workbook
        const worksheet = workbook.addWorksheet(`Leave Approval`); // New Worksheet

        const monthStatusRow = worksheet.addRow([`Leave Approval`]);
        monthStatusRow.getCell(1).font = { bold: true, underline: true };
        worksheet.mergeCells('A1:I1');

        monthStatusRow.eachCell((cell: any) => {
          cell.alignment = { horizontal: 'center' };
        });

        worksheet.addRow([]);
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell: any) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center' };
        });
        worksheet.getColumn('A').width = 15;
        worksheet.getColumn('B').width = 30;
        worksheet.getColumn('C').width = 20;
        worksheet.getColumn('D').width = 40;
        worksheet.getColumn('E').width = 20;
        worksheet.getColumn('F').width = 30;
        worksheet.getColumn('G').width = 60;
        worksheet.getColumn('H').width = 20;
        worksheet.getColumn('I').width = 20;
        const data: any = [];

        if (responseData?.list && Array.isArray(responseData?.list) && responseData?.list?.length > 0) {
          responseData?.list?.forEach((user: any, index: any) => {
            data.push([
              index + 1, //A
              user?.user?.first_name + ' ' + user?.user?.last_name || '-', //B
              user?.appliedDate || '-', // C
              user?.leaveDateFromTo || '-', // D
              user?.leaveType || '-', // E
              user?.leaveSubject || '-', // F
              user?.description || '-', //G
              user?.noOfDays || '-', // H
              user?.leaveStatus || '-', // I
            ]);
          });
        }
        const addedRows = worksheet.addRows(data);
        // addedRows.forEach((row: any) => {
        //   // console.log("ROW",row)
        //   row.eachCell((cell: any,colNumber:any) => {
        //     if(colNumber === 7){
        //       cell.alignment = { horizontal: 'left',vertical: 'left' };
        //     }else{
        //       cell.alignment = { horizontal: 'center', vertical: 'middle' };
        //     }
        //   });
        // });
        worksheet.addRow([]);
        if (data.length > 0) {
          workbook.xlsx.writeBuffer().then((data: any) => {
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            fs.saveAs(blob, `Leave_Approval.xlsx`);
          });
        } else {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: 'No data to export' },
            duration: 45000,
          });
        }
      },
      (err: any) => {
        this.isExportTimingHistory = false;
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: { message: err.error.message },
          duration: 45000,
        });
      }
    );
  }
  getTooltipText(historyArray: any[]): any {
    if (historyArray && historyArray.length > 0) {
      const tooltipText = historyArray.map((history) => {
        const userName = `${history.user?.first_name} ${history.user?.last_name} (${history.user?.designation})`;
        const comment = history.action_comment ? `: ${history.action_comment}` : '';
        return `${userName}${comment} `;
      });

      return tooltipText;
    } else {
      return '';
    }
  }
}
