import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit, ElementRef, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ManualUpdateLeaveBalanceService } from '../../../core/services/module/leave/manual-leave-update/manual-leave-update.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { Encryption } from '@tms-workspace/encryption';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { StorageService } from '../../../core/services/common/storage.service';
import { LoginService } from '../../../core/services/login/login.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { PERMISSION_CONSTANTS } from '../../../core/services/common/constants';
import * as excelJS from 'exceljs';
import * as fs from 'file-saver';
import { MatTableDataSource } from '@angular/material/table';
import { style } from '@angular/animations';
import { UserService } from '../../../core/services/module/users/users.service';

interface IUsersData {
  id: number;
  name: string;
  avatar: string;
  designation: string;
}
@Component({
  selector: 'main-app-leaves',
  templateUrl: './leaves.component.html',
  styleUrls: ['./leaves.component.scss'],
})
export class LeavesComponent implements OnInit, OnDestroy {
  @ViewChild('historyListDilog') historyListDilog!: TemplateRef<any>;
  //#region [Global Declaration]
  searchEmpForm!: FormGroup;
  isFormSubmitted = false;
  options = {
    sortBy: '',
    orderBy: 'ASC',
    search: '',
  };
  isOrderByAsc = true;
  leaveUpdateUser: any;
  leaveUpdateForm!: FormGroup;
  currentMonth = moment().format('MMMM');
  currentYear = moment().format('YYYY');
  currentDate = moment().format('YYYY-MM-DD');
  previousMonth = moment().add(-1, 'M').format('MMMM');
  previousMonthYear = moment().add(-1, 'M').format('YYYY');
  employeeLeaveListData: any = [];
  loadingData = false;
  changedData: any[] = [];
  lastUpdatedDate = '';
  lastUpdatedBy = '';
  status = '';
  subscriptions: Subscription[] = [];
  draftLogId = null;
  hasEditPermission = false;
  historyListDialogRef: any = null;
  dataSource = new MatTableDataSource();
  emptyData = new MatTableDataSource(['empty-row']);
  displayedColumns = ['monthYear', 'updatedBy', 'updatedDate', 'draftId'];
  paginationHistoryLogs: any = {
    totalRecords: 0,
    limit: 10,
    currentPage: 1,
    pageSizeOptions: [5, 10, 25, 100],
  };
  currentLogDetails: any = [];
  displayCurrentMonth = `Leave Management ${this.currentMonth} - ${this.currentYear}`;
  displayConsoldiationMonth = ` (${this.previousMonth}) `;
  isHistoryData = false;
  historyLogIdSelected = 0;
  monthForExcelName = this.previousMonth;
  yearForExcelName = this.previousMonthYear;
  currentSelectedRecord = -1;
  allUsersList!: IUsersData[];
  selectedUsers: any = [];
  showSpinnerSection = true;
  //#endregion

  //#region [Skeleton Code]
  constructor(
    private router: Router,
    private leaveUpdateManualService: ManualUpdateLeaveBalanceService,
    private formBuilder: FormBuilder,
    private spinnerService: SpinnerService,
    private _snackBar: MatSnackBar,
    private el: ElementRef,
    private dialog: MatDialog,
    private storageService: StorageService,
    private loginService: LoginService,
    private permissionService: PermissionService,
    private userService: UserService
  ) {
    this.initializeSearchForm();
  }

  ngOnInit() {
    this.currentSelectedRecord = -1;
    this.getListOfEmployeeLeaveList(true);
    this.getUsersList();
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission != null) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.hasEditPermission = this.permissionService.getModuleActionPermission(permission, 'reports.leave_management', 'update');
    } else {
      this.loginService.logout();
    }
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
  //#endregion

  //#region [Api Calls]

  getUsersList() {
    this.showSpinnerSection = true;
    this.userService.getAllUsers().subscribe(
      (response: any) => {
        if (response.data && response.data.list && response.data.list.length) {
          this.allUsersList = response.data.list.map((user: any) => ({
            id: user.id,
            name: user.first_name + ' ' + user.last_name,
            avatar: user.employee_image,
            designation: user.designation,
          }));
        }
        this.showSpinnerSection = false;
      },
      (err: any) => {
        this.showSpinnerSection = false;
      }
    );
  }
  getDeletedFilterUser(event: any) {
    // console.log('getDeletedFilterUser', event);
    let index = this.selectedUsers.findIndex((user: any) => user == event.id);
    this.selectedUsers.splice(index, 1);
  }
  getSelectedFilterUser(event: any) {
    // console.log('getSelectedFilterUser', event);

    this.selectedUsers.push(event.id);
  }
  onSaveUsers(event: any) {
    this.getListOfEmployeeLeaveList(true);
  }
  getListOfEmployeeLeaveList(showSpinner: boolean, doReset = false) {
    this.showSpinnerSection = true;
    this.currentSelectedRecord = -1;
    if (doReset) {
      this.isOrderByAsc = true;
      this.options.orderBy = 'ASC';
      (this.options.search = ''), this.searchEmpForm.patchValue({ searchEmp: '' });
    }
    this.changedData = [];
    if (showSpinner) {
      this.spinnerService.showSpinner();
      this.loadingData = true;
    }
    this.leaveUpdateManualService
      .getListOfLeaveBalance(this.options.search, JSON.stringify(this.selectedUsers), this.options.orderBy, this.currentDate)
      .subscribe(
        (response: any) => {
          if (response && 'data' in response && response.data.leaveManualUpdateDraft) {
            this.employeeLeaveListData = response.data.leaveManualUpdateDraft;
            if (response.data.leaveManualUpdateLog) {
              this.lastUpdatedBy = response.data.leaveManualUpdateLog.updatedBy
                ? (response.data.leaveManualUpdateLog.updatedBy.first_name || '') +
                  ' ' +
                  (response.data.leaveManualUpdateLog.updatedBy.last_name || '')
                : '-';
              this.status = response.data.leaveManualUpdateLog.status ? response.data.leaveManualUpdateLog.status : '-';
              let lastUpdatedDate =
                response.data.leaveManualUpdateLog.draft_date || response.data.leaveManualUpdateLog.final_save_date
                  ? response.data.leaveManualUpdateLog.final_save_date
                    ? response.data.leaveManualUpdateLog.final_save_date
                    : response.data.leaveManualUpdateLog.draft_date
                  : '-';
              lastUpdatedDate = lastUpdatedDate != '-' ? moment(lastUpdatedDate).format('DD/MM/YYYY hh:mm:ss A') : '-';
              this.lastUpdatedDate = lastUpdatedDate;
              this.draftLogId = response.data.leaveManualUpdateLog.id;
            }
            if (showSpinner) {
              this.spinnerService.hideSpinner();
              this.loadingData = false;
            }
          }
          this.showSpinnerSection = false;
        },
        (err: any) => {
          if (err.message) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: err.message },
              duration: 45000,
            });
            // this._snackBar.open(err.message);
          }
          if (showSpinner) {
            this.spinnerService.hideSpinner();
            this.loadingData = false;
          }
          this.showSpinnerSection = false;
        }
      );
  }

  btnSaveAsDraftClick() {
    this.highlightRecord(-1);
    if (this.hasEditPermission) {
      const dataToSend = this.getChangedData();
      if (dataToSend && dataToSend.length > 0) {
        this.spinnerService.showSpinner();
        this.leaveUpdateManualService.saveLeaveBalanceAsDraft(this.draftLogId, dataToSend, this.currentDate).subscribe(
          () => {
            this._snackBar.open('The changes have been saved as draft.');
            this.spinnerService.hideSpinner();
            this.getListOfEmployeeLeaveList(true);
          },
          (err: any) => {
            if (err.message) {
              this._snackBar.openFromComponent(SnackbarComponent, {
                data: { message: err.message },
                duration: 45000,
              });
              // this._snackBar.open(err.message);
            }
            this.spinnerService.hideSpinner();
          }
        );
      }
    }
  }

  btnSaveClick() {
    this.highlightRecord(-1);
    if (this.hasEditPermission) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: {
          title: `Are you sure you want to save the changes for month ${this.currentMonth} ? `,
        },
      });

      this.subscriptions.push(
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            const dataToSend = this.getChangedData();
            this.spinnerService.showSpinner();
            this.leaveUpdateManualService.saveLeaveBalanceFinal(this.draftLogId, dataToSend, this.currentDate).subscribe(
              () => {
                this._snackBar.open('Leave adjustments have been saved successfully.');
                this.spinnerService.hideSpinner();
                this.getListOfEmployeeLeaveList(true);
              },
              (err: any) => {
                if (err.message) {
                  this._snackBar.openFromComponent(SnackbarComponent, {
                    data: { message: err.message },
                    duration: 45000,
                  });
                  // this._snackBar.open(err.message);
                  this.spinnerService.hideSpinner();
                }
              }
            );
          }
        })
      );
    }
  }

  fetchDataToExport() {
    if (!this.isHistoryData) {
      
      this.spinnerService.showSpinner();

      this.leaveUpdateManualService.getListOfLeaveBalance('', JSON.stringify(this.selectedUsers), 'ASC', this.currentDate).subscribe(
        (response: any) => {
          if (response && 'data' in response && response.data.leaveManualUpdateDraft) {
            let data: any = null,
              status = null,
              updatedBy = null,
              updatedDate = null;
            data = response.data.leaveManualUpdateDraft;
            if (response.data.leaveManualUpdateLog) {
              updatedBy = response.data.leaveManualUpdateLog.updatedBy
                ? (response.data.leaveManualUpdateLog.updatedBy.first_name || '') +
                  ' ' +
                  (response.data.leaveManualUpdateLog.updatedBy.last_name || '')
                : '-';
              status = response.data.leaveManualUpdateLog.status ? response.data.leaveManualUpdateLog.status : '-';
              updatedDate =
                response.data.leaveManualUpdateLog.draft_date || response.data.leaveManualUpdateLog.final_save_date
                  ? response.data.leaveManualUpdateLog.final_save_date
                    ? response.data.leaveManualUpdateLog.final_save_date
                    : response.data.leaveManualUpdateLog.draft_date
                  : '-';

              if (this.changedData && Array.isArray(this.changedData) && this.changedData.length > 0) {
                this.changedData.forEach((record) => {
                  const dataRec = data.find((rec: any) => rec.id === record.id);
                  dataRec.added_CL = record.added_CL;
                  dataRec.added_PL = record.added_PL;
                  dataRec.comments = record.comments;
                  dataRec.adjusted_LWP = record.adjusted_LWP;
                });
              }

              updatedDate = updatedDate != '-' ? moment(updatedDate).format('DD/MM/YYYY hh:mm:ss A') : '-';
              this.exportExcel(data, this.displayConsoldiationMonth, this.displayCurrentMonth, '', updatedDate, updatedBy);
            }
            this.spinnerService.hideSpinner();
          }
        },
        (err: any) => {
          if (err.message) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: err.message },
              duration: 0,
            });
            // this._snackBar.open(err.message);
          }
          this.spinnerService.hideSpinner();
          this.loadingData = false;
        }
      );
    } else {
      this.exportExcel(
        this.employeeLeaveListData,
        this.displayConsoldiationMonth,
        this.displayCurrentMonth,
        `(${this.status})`,
        this.lastUpdatedDate,
        this.lastUpdatedBy
      );
    }
  }

  getLogs() {
    this.currentLogDetails = [];
    this.spinnerService.showSpinner();
    this.leaveUpdateManualService.getListOfLeaveBalanceLogs(this.paginationHistoryLogs.limit, this.paginationHistoryLogs.currentPage).subscribe(
      (response: any) => {
        if (response && 'data' in response) {
          let data = response.data.list;
          data = data
            ? data.map((record: any) => {
                let lastUpdatedDate =
                  record.draft_date || record.final_save_date ? (record.final_save_date ? record.final_save_date : record.draft_date) : '-';
                lastUpdatedDate = lastUpdatedDate != '-' ? moment(lastUpdatedDate).format('DD/MM/YYYY hh:mm:ss A') : '-';

                const lastUpdatedBy = record.updatedBy ? (record.updatedBy.first_name || '') + ' ' + (record.updatedBy.last_name || '') : '-';
                return {
                  monthYear: `${record.month.toString()} - ${record.year.toString()}`,
                  updatedBy: lastUpdatedBy,
                  updatedDate: lastUpdatedDate,
                  status: record.status,
                  draftId: record.id,
                  month: record.month,
                  year: record.year,
                };
              })
            : ['empty-row'];

          this.dataSource = new MatTableDataSource(data);
          this.paginationHistoryLogs.totalRecords = response.data.totalRecords ? response.data.totalRecords : 0;
          this.paginationHistoryLogs.currentPage = response.data.currentPage ? response.data.currentPage : 1;
          this.paginationHistoryLogs.limit = response.data.limit ? response.data.limit : 10;
        }
        this.spinnerService.hideSpinner();
      },
      (err: any) => {
        if (err.message) {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: err.message },
            duration: 0,
          });
          // this._snackBar.open(err.message);
        }
        this.spinnerService.hideSpinner();
      }
    );
  }

  getSpecificLogs(showSpinner: boolean, doReset: boolean) {
    if (doReset) {
      this.options.orderBy = 'ASC';
      (this.options.search = ''), this.searchEmpForm.patchValue({ searchEmp: '' });
    }

    if (showSpinner) {
      this.spinnerService.showSpinner();
    }
    this.leaveUpdateManualService.getListOfLeaveBalanceHistory(this.options.search, this.options.orderBy, this.historyLogIdSelected).subscribe(
      (response: any) => {
        if (response && 'data' in response && response.data.leaveManualUpdateDraft) {
          this.employeeLeaveListData = response.data.leaveManualUpdateDraft;
          if (response.data.leaveManualUpdateLog) {
            this.lastUpdatedBy = response.data.leaveManualUpdateLog.updatedBy
              ? (response.data.leaveManualUpdateLog.updatedBy.first_name || '') + ' ' + (response.data.leaveManualUpdateLog.updatedBy.last_name || '')
              : '-';
            this.status = response.data.leaveManualUpdateLog.status ? response.data.leaveManualUpdateLog.status : '-';
            let lastUpdatedDate =
              response.data.leaveManualUpdateLog.draft_date || response.data.leaveManualUpdateLog.final_save_date
                ? response.data.leaveManualUpdateLog.final_save_date
                  ? response.data.leaveManualUpdateLog.final_save_date
                  : response.data.leaveManualUpdateLog.draft_date
                : '-';
            lastUpdatedDate = lastUpdatedDate != '-' ? moment(lastUpdatedDate).format('DD/MM/YYYY hh:mm:ss A') : '-';
            this.lastUpdatedDate = lastUpdatedDate;
            this.draftLogId = response.data.leaveManualUpdateLog.id;
          }
          if (showSpinner) {
            this.spinnerService.hideSpinner();
          }
        }
      },
      (err: any) => {
        if (err.message) {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: err.message },
            duration: 0,
          });
          // this._snackBar.open(err.message);
        }
        if (showSpinner) {
          this.spinnerService.hideSpinner();
        }
      }
    );
  }
  //#endregion

  //#region [Filter and Sorting Handler]
  sortRecordsByName() {
    this.options.sortBy = 'first_name';
    this.isOrderByAsc = !this.isOrderByAsc;
    this.isOrderByAsc ? (this.options.orderBy = 'ASC') : (this.options.orderBy = 'DESC');

    if (!this.isHistoryData) {
      this.getListOfEmployeeLeaveList(false);
    } else {
      this.getSpecificLogs(false, false);
    }
  }
  onSearch() {
    this.isFormSubmitted = true;
    if (this.searchEmpForm.valid) {
      const formValue = this.searchEmpForm.getRawValue();
      this.options.search = formValue.searchEmp || '';
      if (!this.isHistoryData) {
        this.getListOfEmployeeLeaveList(false);
      } else {
        this.getSpecificLogs(false, false);
      }
    }
  }

  onSearchKeyUp(event: any) {
    if (event && !event.target.value) {
      this.options.search = '';
      if (!this.isHistoryData) {
        this.getListOfEmployeeLeaveList(false);
      } else {
        this.getSpecificLogs(false, false);
      }
    }
  }
  //#endregion

  //#region [Event Handler]

  //#region [Input Changes Handler]
  leaveInputLosseFocus(eventArgs: any, employeeId: any, leaveType: any) {
    let elementIndex = this.changedData.findIndex((record) => record.id === employeeId);
    const employeeRecord = this.employeeLeaveListData.find((employee: any) => employee.id === employeeId);
    let changedValue = 0;

    changedValue = Number.parseFloat(eventArgs.target.value);

    if (employeeRecord) {
      if (elementIndex == -1) {
        this.changedData.push({
          id: Number.parseInt(employeeId),
          added_CL_old: Number.parseFloat(employeeRecord.added_CL),
          added_PL_old: Number.parseFloat(employeeRecord.added_PL),
          added_CL: Number.parseFloat(employeeRecord.added_CL),
          added_PL: Number.parseFloat(employeeRecord.added_PL),
          comments_old: employeeRecord.comments || '',
          comments: employeeRecord.comments || '',
          adjusted_LWP: Number.parseFloat(employeeRecord.adjusted_LWP),
          adjusted_LWP_old: Number.parseFloat(employeeRecord.adjusted_LWP),
        });
        elementIndex = this.changedData.length - 1;
      }

      if (leaveType.toUpperCase() == 'CL') {
        changedValue = Number.isNaN(changedValue) ? employeeRecord.added_CL : changedValue;
        employeeRecord.added_CL = changedValue;
        this.changedData[elementIndex].added_CL = changedValue;
      }
      if (leaveType.toUpperCase() == 'PL') {
        changedValue = Number.isNaN(changedValue) ? employeeRecord.added_PL : changedValue;
        employeeRecord.added_PL = changedValue;
        this.changedData[elementIndex].added_PL = changedValue;
      }
      if (leaveType.toUpperCase() === 'LWP') {
        changedValue = Number.isNaN(changedValue) ? employeeRecord.adjusted_LWP : changedValue;
        if (changedValue <= employeeRecord.used_LWP) {
          employeeRecord.adjusted_LWP = changedValue;
          this.changedData[elementIndex].adjusted_LWP = changedValue;
        } else {
          changedValue = employeeRecord.adjusted_LWP;
        }
      }
      eventArgs.target.value = changedValue;
    }
  }

  commentValueChange(eventArgs: any, employeeId: any) {
    let elementIndex = this.changedData.findIndex((record) => record.id === employeeId);
    const employeeRecord = this.employeeLeaveListData.find((employee: any) => employee.id === employeeId);
    if (employeeRecord) {
      if (elementIndex == -1) {
        this.changedData.push({
          id: Number.parseInt(employeeId),
          added_CL_old: Number.parseFloat(employeeRecord.added_CL),
          added_PL_old: Number.parseFloat(employeeRecord.added_PL),
          added_CL: Number.parseFloat(employeeRecord.added_CL),
          added_PL: Number.parseFloat(employeeRecord.added_PL),
          comments_old: employeeRecord.comments || '',
          comments: employeeRecord.comments || '',
          adjusted_LWP: Number.parseFloat(employeeRecord.adjusted_LWP),
          adjusted_LWP_old: Number.parseFloat(employeeRecord.adjusted_LWP),
        });
        elementIndex = this.changedData.length - 1;
      }
      const changedValue = eventArgs.target.value || '';
      employeeRecord.comments = changedValue;
      this.changedData[elementIndex].comments = changedValue;
      eventArgs.target.value = changedValue;
    }
  }
  //#endregion

  btnExportExcelClick() {
    this.highlightRecord(-1);
    this.fetchDataToExport();
  }
  highlightRecord(index: any) {
    this.currentSelectedRecord = index;
  }

  //#endregion

  //#region [Other]
  getChangedData() {
    // console.log(this.changedData);
    return this.changedData
      .filter(
        (record) =>
          !(
            record.added_CL_old === record.added_CL &&
            record.added_PL_old === record.added_PL &&
            record.comments_old === record.comments &&
            record.adjusted_LWP === record.adjusted_LWP_old
          )
      )
      .map((record) => {
        return {
          id: record.id,
          added_CL: record.added_CL,
          added_PL: record.added_PL,
          comments: record.comments,
          adjusted_LWP: record.adjusted_LWP,
        };
      });
  }

  redirectToAdministration() {
    this.router.navigate(['reports']);
  }

  initializeSearchForm() {
    this.searchEmpForm = this.formBuilder.group({
      searchEmp: [''],
    });
  }

  exportExcel(listOfData: any, prevMonth: any, currentMonth: any, status: any, updatedDate: any, updateBy: any) {
    const headers = [
      'Employee Name',
      `Opening CL ${prevMonth}`,
      `Opening PL ${prevMonth}`,
      `Used CL ${prevMonth}`,
      `Used PL ${prevMonth}`,
      `Available CL ${prevMonth}`,
      `Available PL ${prevMonth}`,
      `Added CL ${prevMonth}`,
      `Added PL ${prevMonth}`,
      `LWP ${prevMonth}`,
      `Adjusted LWP ${prevMonth}`,
      'New CL Balance',
      'New PL Balance',
      'New LWP',
      'Comment',
      'Total Leaves',
    ];
    const workbook = new excelJS.Workbook(); // Create a new workbook
    const worksheet = workbook.addWorksheet('Manually Update Leave'); // New Worksheet

    const monthStatusRow = worksheet.addRow([`${this.displayCurrentMonth} ${status} `, '', '', `Last updated by ${updateBy} at ${updatedDate}`]);
    monthStatusRow.getCell(1).font = { bold: true, underline: true };
    worksheet.mergeCells('A1:C1');
    worksheet.mergeCells('D1:H1');

    worksheet.addRow([]);
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
    });

    const data: any = [];
    if (listOfData && Array.isArray(listOfData) && listOfData.length > 0) {
      listOfData.forEach((emp: any, index: any) => {
        data.push([
          emp.first_name + ' ' + emp.last_name, //A
          emp.opening_CL, // B
          emp.opening_PL, // C
          emp.used_CL, // D
          emp.used_PL, // E
          { result: emp.opening_CL - emp.used_CL, formula: `B${index + 4} - D${index + 4}` }, // F = B - D
          { result: emp.opening_PL - emp.used_PL, formula: `C${index + 4} - E${index + 4}` }, // G = C - E
          emp.added_CL, // H
          emp.added_PL, // I
          emp.used_LWP, // J
          emp.adjusted_LWP, // k
          { result: emp.opening_CL + emp.added_CL - emp.used_CL, formula: `B${index + 4} - D${index + 4} + H${index + 4}` }, //L = B - D + H,
          { result: emp.opening_PL + emp.added_PL - emp.used_PL, formula: `C${index + 4} - E${index + 4} + I${index + 4}` }, //M = C - E + I,
          { result: emp.used_LWP - emp.adjusted_LWP, formula: `J${index + 4} - K${index + 4}` }, //N = J - K,
          emp.comments, // O
          {
            result: emp.opening_CL + emp.added_CL - emp.used_CL + emp.opening_PL + emp.added_PL - emp.used_PL,
            formula: `L${index + 4} + M${index + 4}`,
          }, // P = L + M
        ]);
      });
    }
    const addedRows = worksheet.addRows(data);
    worksheet.addRow([]);
    const footerRow = worksheet.addRow([
      'All Employee',
      { formula: `SUM(B${4}:B${worksheet.rowCount})`, result: 0 },
      { formula: `SUM(C${4}:C${worksheet.rowCount})`, result: 0 },
      { formula: `SUM(D${4}:D${worksheet.rowCount})`, result: 0 },
      { formula: `SUM(E${4}:E${worksheet.rowCount})`, result: 0 },
      { formula: `SUM(F${4}:F${worksheet.rowCount})`, result: 0 },
      { formula: `SUM(G${4}:G${worksheet.rowCount})`, result: 0 },
      '-', //Added CL
      '-', // Added Pl
      { formula: `SUM(J${4}:J${worksheet.rowCount})`, result: 0 },
      '-', // Adjusted LWP
      { formula: `SUM(L${4}:L${worksheet.rowCount})`, result: 0 },
      { formula: `SUM(M${4}:M${worksheet.rowCount})`, result: 0 },
      { formula: `SUM(N${4}:N${worksheet.rowCount})`, result: 0 },
      '-', // Commnets
      { formula: `SUM(P${4}:P${worksheet.rowCount})`, result: 0 },
    ]);
    footerRow.getCell(1).font = { bold: true };

    //Generate Excel File with given name
    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, `${`Leave_${this.monthForExcelName}_${this.yearForExcelName}`}.xlsx`);
    });
  }
  //#endregion

  //#region [History]
  // open the dialog
  openDialog() {
    this.highlightRecord(-1);
    this.historyListDialogRef = this.dialog.open(this.historyListDilog, {
      width: '80%',
      height: '80%',
    });
    this.getLogs();
  }
  onNoClick(): void {
    this.historyListDialogRef?.close();
  }
  getLogsOnChange(eventArgs: any) {
    this.paginationHistoryLogs.limit = eventArgs.pageSize || 10;
    this.paginationHistoryLogs.currentPage = eventArgs.pageIndex + 1;
    this.getLogs();
  }
  viewHistoryItem(draftLogid: any, month: any, year: any) {
    this.historyListDialogRef?.close();
    this.displayCurrentMonth = `History of ${month}-${year} `;
    this.monthForExcelName = month;
    this.yearForExcelName = year;
    this.displayConsoldiationMonth = '';
    this.isHistoryData = true;
    this.historyLogIdSelected = draftLogid;
    this.getSpecificLogs(true, true);
  }
  reviewCurrentMonth() {
    this.isHistoryData = false;
    this.monthForExcelName = this.previousMonth;
    this.yearForExcelName = this.previousMonthYear;
    this.displayCurrentMonth = `Update leaves for ${this.currentMonth} - ${this.currentYear}`;
    this.displayConsoldiationMonth = ` (${this.previousMonth}) `;
    this.getListOfEmployeeLeaveList(true, true);
  }

  //#endregion
}
