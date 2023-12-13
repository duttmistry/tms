import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ProjectsService } from '../../../core/services/module/projects/projects.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { PERMISSION_CONSTANTS, PROJECT_STATUS_CONSTANTS, PROJECT_STATUS_OPTIONS } from '../../../core/services/common/constants';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { LoginService } from '../../../core/services/login/login.service';
import { Encryption } from '@tms-workspace/encryption';
import { FormControl } from '@angular/forms';
import * as moment from 'moment';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { SnackbarComponent } from '@tms-workspace/material-controls';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Subscription } from 'rxjs';
import { ProjectsRequestDataModel } from '../../../core/model/task/task.model';
import { TaskService } from '../../../core/services/module/tasks/task.service';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { default as _rollupMoment, Moment } from 'moment';
import { MatDatepicker } from '@angular/material/datepicker';
import * as excelJS from 'exceljs';
import * as fs from 'file-saver';
import { ProjectKeyRequestBody, ProjectReportRequestBody } from '../../../core/model/projects/project.model';

export const MY_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'main-app-project-report',
  templateUrl: './project-report.component.html',
  styleUrls: ['./project-report.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class ProjectReportComponent implements OnInit {
  allowToUpdate = false;
  listDataSource = new MatTableDataSource();
  emptyData = new MatTableDataSource([{ empty: 'row' }]);
  displayedColumns = ['workspaceName', 'projectName', 'totalWorkedHrs'];
  limit = 10;
  page = 1;
  totalRecords!: number;
  selectedProjects: any = null;
  fromMonthControl = new FormControl(moment());
  toMonthControl = new FormControl(moment());
  listOfReportData: any = [];
  subscriptions: Subscription[] = [];
  doResetPageNumber = false;
  isValidSelection = true;
  projectSelectionInputList: any = [];
  projectSelection: any = [];
  showSpinner = true;
  constructor(
    private spinnerService: SpinnerService,
    private _snackBar: MatSnackBar,
    private router: Router,
    private projectService: ProjectsService,
    private permissionService: PermissionService,
    private storageService: StorageService,
    private loginService: LoginService,
    private dialog: MatDialog,
    private taskService: TaskService
  ) {}
  ngOnInit(): void {
    this.toMonthControl.value?.date(1);
    this.toMonthControl.value?.hour(0);
    this.toMonthControl.value?.minute(0);
    this.toMonthControl.value?.second(0);
    this.toMonthControl.value?.millisecond(0);
    this.fromMonthControl.value?.date(1);
    this.fromMonthControl.value?.hour(0);
    this.fromMonthControl.value?.minute(0);
    this.fromMonthControl.value?.second(0);
    this.fromMonthControl.value?.millisecond(0);
    this.getProjectsData();
    this.checkForUpdatePermission();
  }
  ngOnDestroy() {
    this.subscriptions.forEach((_sub: Subscription) => _sub.unsubscribe());
  }

  checkForUpdatePermission() {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);

    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.allowToUpdate = this.permissionService.getModuleActionPermission(permission, 'reports.project_reports', 'view');
    } else {
      this.loginService.logout();
    }
  }

  onPageSelectionChange(eventArgs: any) {
    this.limit = eventArgs?.pageSize;
    this.page = eventArgs.pageIndex + 1;
    this.doResetPageNumber = false;
    this.getProjectReport();
  }
  getProjectSelection(eventArgs: any) {
    this.selectedProjects = eventArgs;
    this.doResetPageNumber = true;
    this.getProjectReport();
  }
  getProjectReport(getDataForReport = false) {
    if (
      this.toMonthControl.value &&
      this.fromMonthControl.value &&
      this.toMonthControl.value.diff(this.fromMonthControl.value) >= 0 &&
      this.selectedProjects?.length > 0
    ) {
      this.isValidSelection = true;
      const requestBody: ProjectReportRequestBody = {
        projectIds: this.selectedProjects.map((project: any) => project.id),
        fromMonth: this.fromMonthControl.value?.format('MM-YYYY'),
        toMonth: this.toMonthControl.value?.format('MM-YYYY'),
      };
      const limit = getDataForReport ? 99999999 : this.limit;
      const page = getDataForReport ? 1 : this.doResetPageNumber ? 1 : this.page;
      this.subscriptions.push(
        this.projectService.getProjectWorkedHrs(requestBody, limit, page).subscribe(
          (response: any) => {
            if (response) {
              if (response?.data?.list) {
                if (!getDataForReport) {
                  this.listDataSource.data = response.data.list.map((item: any) => {
                    let total_worked_hrs;
                    const timeParts = item.total_worked_hours.split(':');
                    if (timeParts?.length > 2) {
                      total_worked_hrs = `${timeParts[0]}h ${timeParts[1]}m`;
                    } else {
                      total_worked_hrs = item.total_worked_hours;
                    }
                    return {
                      projectName: item.name,
                      totalWorkedHrs: total_worked_hrs,
                      workspaceName: item?.projectWorkspace?.workspace?.title || '(No Workspace)',
                    };
                  });
                  this.page = this.doResetPageNumber ? 1 : this.page;
                  this.totalRecords = response?.data?.totalRecords;
                } else {
                  this.listOfReportData = response.data.list.map((item: any) => {
                    let total_worked_hrs;
                    const timeParts = item.total_worked_hours.split(':');
                    if (timeParts?.length > 2) {
                      total_worked_hrs = `${timeParts[0]}h ${timeParts[1]}m`;
                    } else {
                      total_worked_hrs = item.total_worked_hours;
                    }
                    return {
                      projectName: item.name,
                      totalWorkedHrs: total_worked_hrs,
                      workspaceName: item?.projectWorkspace?.workspace?.title || '(No Workspace)',
                    };
                  });
                  this.prepareExportExcel();
                }
              } else {
                if (!getDataForReport) {
                  this.listDataSource.data = [];
                } else {
                  this.listOfReportData = [];
                }
              }
            } else {
              if (!getDataForReport) {
                this.listDataSource.data = [];
              } else {
                this.listOfReportData = [];
              }
            }
          },
          (error: any) => {
            console.log(error);
          }
        )
      );
    } else {
      this.isValidSelection = false;
      const validFrom = this.fromMonthControl.value ? true : false;
      const validTo = this.toMonthControl.value ? true : false;
      const validProjects = this.selectedProjects?.length > 0;
      let message = 'Please select ';
      if (!validProjects) {
        message += 'Project/s';
      }
      if (!validFrom) {
        message += !validProjects ? ',' : '';
        message += ' From Month';
      }
      if (!validTo) {
        message += !validFrom ? ' &' : !validProjects ? ' &' : '';
        message += ' To Month';
      }
      if (this.toMonthControl.value && this.fromMonthControl.value) {
        if (this.toMonthControl.value.diff(this.fromMonthControl.value) < 0) {
          message += !validProjects ? ' &' : '';
          message += ' valid From and To Month';
        }
      }
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: message },
        duration: 45000,
      });
    }
  }
  exportReport() {
    this.getProjectReport(true);
  }
  prepareExportExcel() {
    const headers = ['Workspace Name', 'Project Name', 'Total Worked Hrs.'];
    const workbook = new excelJS.Workbook(); // Create a new workbook
    const fromMonth = this.fromMonthControl.value?.format('MMM YYYY');
    const toMonth = this.toMonthControl.value?.format('MMM YYYY');
    const sheetName = fromMonth !== toMonth ? `${fromMonth}-${toMonth}` : fromMonth;
    const worksheet = workbook.addWorksheet(sheetName); // New Worksheet
    const monthStatusRow = worksheet.addRow([fromMonth !== toMonth ? `Report From ${fromMonth} to ${toMonth}` : `Report of ${fromMonth}`]);
    monthStatusRow.getCell(1).font = { bold: true, underline: true };
    worksheet.mergeCells('A1:C1');
    worksheet.mergeCells('D1:H1');
    worksheet.addRow([]);
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' }; // Center align the header cells
    });

    // Calculate and set column widths based on content
    const columnWidths = headers.map((header) => ({
      width: header.length + 15, // Add some extra space for padding
    }));
    worksheet.columns = columnWidths;

    const data: any = [];
    if (this.listOfReportData && Array.isArray(this.listOfReportData) && this.listOfReportData.length > 0) {
      this.listOfReportData.forEach((listItem: any, index: any) => {
        data.push([listItem.workspaceName, listItem.projectName, listItem.totalWorkedHrs]);
      });
    }
    const addedRows = worksheet.addRows(data);

    // Add data rows and set alignment for data cells
    // data.forEach((rowData: any) => {
    //   const dataRow = worksheet.addRow(rowData);
    //   dataRow.eachCell((cell) => {
    //     cell.alignment = { horizontal: 'center' }; // Center align the data cells
    //   });
    // });

    //Generate Excel File with given name
    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, `${`Project Report _ ${sheetName}`}.xlsx`);
    });
  }
  setMonthAndYear(normalizedMonthAndYear: Moment, datepicker: MatDatepicker<Moment>, control: number) {
    if (control === 0) {
      const ctrlValue = this.fromMonthControl.value || moment();
      ctrlValue.date(1);
      ctrlValue.month(normalizedMonthAndYear.month());
      ctrlValue.year(normalizedMonthAndYear.year());
      ctrlValue.hour(0);
      ctrlValue.minute(0);
      ctrlValue.second(0);
      ctrlValue.millisecond(0);
      this.fromMonthControl.setValue(ctrlValue);
      if (this.toMonthControl.value && this.fromMonthControl.value && this.toMonthControl.value.diff(this.fromMonthControl.value) < 0) {
        this.fromMonthControl.setErrors({ conflict: true });
        this.toMonthControl.setErrors(null);
      } else {
        this.fromMonthControl.setErrors(null);
        this.toMonthControl.setErrors(null);
      }
    } else {
      const ctrlValue = this.toMonthControl.value || moment();
      ctrlValue.date(1);
      ctrlValue.month(normalizedMonthAndYear.month());
      ctrlValue.year(normalizedMonthAndYear.year());
      ctrlValue.hour(0);
      ctrlValue.minute(0);
      ctrlValue.second(0);
      ctrlValue.millisecond(0);
      this.toMonthControl.setValue(ctrlValue);
      if (this.toMonthControl.value && this.fromMonthControl.value && this.toMonthControl.value.diff(this.fromMonthControl.value) < 0) {
        this.toMonthControl.setErrors({ conflict: true });
        this.fromMonthControl.setErrors(null);
      } else {
        this.toMonthControl.setErrors(null);
        this.fromMonthControl.setErrors(null);
      }
    }
    this.doResetPageNumber = true;
    this.getProjectReport();
    datepicker.close();
  }
  getProjectsData() {
    this.showSpinner = true;
    const requestBody: ProjectsRequestDataModel = {
      status: true,
      custom_fields: false,
      tag: false,
      team: true,
      billing_configuration: false,
      documents: false,
      workspace: true,
    };
    this.subscriptions.push(
      this.taskService.getProjectsData(requestBody).subscribe({
        next: (response: any) => {
          if (response) {
            if (response.data) {
              if (response.data.list) {
                const projectList = response.data.list;
                this.selectedProjects = [...response.data.list];
                this.doResetPageNumber = true;
                this.getProjectReport();
                this.projectSelectionInputList = [...response.data.list];
              }
            }
            this.showSpinner = false;
          }
        },
        error: () => {
          this.showSpinner = false;
        },
      })
    );
  }
  public getSelectedProjectList(eventArgs: any) {
    this.selectedProjects = eventArgs;
    this.doResetPageNumber = true;
    this.getProjectReport();
  }
  myFilter = (d: Date | null): boolean => {
    const lastDayOfMonth = moment();
    lastDayOfMonth.date(31);
    lastDayOfMonth.hour(23);
    lastDayOfMonth.minute(59);
    lastDayOfMonth.second(59);

    return lastDayOfMonth.isAfter(moment(d));
  };
}
