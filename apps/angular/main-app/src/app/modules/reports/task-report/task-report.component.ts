import { Component, OnInit } from '@angular/core';
import { ProjectsRequestDataModel } from '../../../core/model/task/task.model';
import { TaskService } from '../../../core/services/module/tasks/task.service';
import { FormControl } from '@angular/forms';
import moment from 'moment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportsService } from '../../../core/services/module/reports/reports.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { SnackbarComponent } from 'libs/ui/material-controls/src/lib/snackbar/snackbar.component';

@Component({
  selector: 'main-app-tms-workspace-task-report',
  templateUrl: './task-report.component.html',
  styleUrls: ['./task-report.component.scss'],
})
export class TaskReportComponent implements OnInit {
  //#region for data member
  public projectsData: any[] = [];
  public selectedProjectControl: FormControl = new FormControl();
  public searchControl = new FormControl();
  public fromDateControl = new FormControl(moment().startOf('month').format('YYYY-MM-DD'));
  public toDateControl = new FormControl(moment().format('YYYY-MM-DD'));
  public maxDate = moment().toDate();
  public userReportData: any;
  public searchValue = '';
  public downlodeLink = '';
  public isNoRecordFound = false;
  public exportingData = false;
  public showSpinner = true;
  //#endregion

  //#region for Component Structure
  constructor(
    private taskService: TaskService,
    private reportService: ReportsService,
    private _snackBar: MatSnackBar,
    private spinnerService: SpinnerService
  ) {}
  ngOnInit(): void {
    this.getProjectsData();
    this.reportService.getExportFlag().subscribe((response: any) => {
      this.exportingData = response;
    });
  }
  //#endregion

  //#region for member function

  //#region for on project selection method
  onProjectSelection() {
    this.searchValue = ''; // Clear the search input
  }

  //This methos used for get selected project name
  public getSelectedProjectName(): string {
    const selectedProjectId = this.selectedProjectControl.value;
    const selectedProject = this.projectsData?.find((project: any) => project.id === selectedProjectId);
    return selectedProject ? selectedProject.name : 'Select a project';
  }

  //#endregion

  //#region for get task report
  public getUserTaskReport() {
    const requestBody = {
      projectId: this.selectedProjectControl.value,
      fromDate: moment.isMoment(this.fromDateControl.value)
        ? this.fromDateControl.value.format('YYYY-MM-DD')
        : moment(this.fromDateControl.value).format('YYYY-MM-DD'),
      toDate: moment.isMoment(this.toDateControl.value)
        ? this.toDateControl.value.format('YYYY-MM-DD')
        : moment(this.toDateControl.value).format('YYYY-MM-DD'),
    };
    this.reportService.getUserTaskReport(requestBody).subscribe(
      (response: any) => {
        if (response) {
          if (response.data && Object.keys(response.data).length > 0) {
            this.isNoRecordFound = true;
            this.userReportData = Object.values(response.data).map((item: any) => ({
              user_id: item.user_id,
              user_name: item.user_name,
              total_time: item.total_time ? item.total_time : '00:00:00',
              data: [],
            }));
            // Sort the userReportData array based on total_time
            this.userReportData.sort((a: any, b: any) => {
              if (a.total_time < b.total_time) {
                return 1; // b should come before a
              } else if (a.total_time > b.total_time) {
                return -1; // a should come before b
              } else {
                return 0; // no change in order
              }
            });
          } else {
            this.userReportData = [];
            this.isNoRecordFound = false;
          }
        } else {
          this.userReportData = [];
          this.isNoRecordFound = false;
        }
      },
      (error) => {
        this.spinnerService.hideSpinner();
      }
    );
  }
  //This method used for get user wise task report
  public getUserWiseTaskReportList(userData: any) {
    const requestBody = {
      projectId: this.selectedProjectControl.value,
      user_id: userData.user_id,
      fromDate: moment.isMoment(this.fromDateControl.value)
        ? this.fromDateControl.value.format('YYYY-MM-DD')
        : moment(this.fromDateControl.value).format('YYYY-MM-DD'),
      toDate: moment.isMoment(this.toDateControl.value)
        ? this.toDateControl.value.format('YYYY-MM-DD')
        : moment(this.toDateControl.value).format('YYYY-MM-DD'),
    };
    const userIndex = this.userReportData.findIndex((item: any) => item.user_id === userData.user_id);

    this.reportService.getUserWiseTaskReport(requestBody).subscribe((response: any) => {
      if (response) {
        if (response.data) {
          if (userIndex >= 0) {
            this.isNoRecordFound = true;
            this.userReportData[userIndex].data = [...response.data];
          }
        } else {
          if (userIndex >= 0) {
            this.isNoRecordFound = false;
            this.userReportData[userIndex].data = [];
          }
        }
      } else {
        if (userIndex >= 0) {
          this.isNoRecordFound = false;
          this.userReportData[userIndex].data = [];
        }
      }
    });
  }

  //#region for get projejct list
  public getProjectsData() {
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
    this.taskService.getProjectsData(requestBody).subscribe({
      next: (response: any) => {
        if (response) {
          if (response.data) {
            if (response.data.list) {
              const projectList = response.data.list;
              this.projectsData = projectList.map((proj: any) => {
                return {
                  id: proj.id,
                  name: proj.name,
                  projectTeam: proj.projectTeamData.map((teamDetails: any) => {
                    return {
                      id: teamDetails.id,
                      user: teamDetails.user,
                    };
                  }),
                };
              });
            }
          }
          if (this.projectsData.length > 0) {
            this.selectedProjectControl.setValue(this.projectsData[0].id);
            this.getUserTaskReport();
          }
        }
        this.showSpinner = false;
      },
      error: (error: any) => {
        console.log('error');
        this.showSpinner = false;
      },
    });
  }

  //This method used for save data and fetch user task report
  public onSave() {
    const selectedProjectId = this.selectedProjectControl.value;
    const fromDate = moment.isMoment(this.fromDateControl.value)
      ? this.fromDateControl.value.format('YYYY-MM-DD')
      : moment(this.fromDateControl.value).format('YYYY-MM-DD');
    const toDate = moment.isMoment(this.toDateControl.value)
      ? this.toDateControl.value.format('YYYY-MM-DD')
      : moment(this.toDateControl.value).format('YYYY-MM-DD');
    if (selectedProjectId !== null && fromDate !== null && toDate !== null) {
      if (fromDate <= toDate) {
        // Check if from date is not greater than to date
        this.getUserTaskReport();
      } else {
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: { message: 'The From Date must be equal to or earlier than the To Date.' },
          duration: 45000,
        });
      }
    } else {
      // console.log('No project or date selected.');
    }
  }

  //This method used for count total time
  calculateDuration(startTime: string, endTime: string): string {
    if (!startTime || !endTime) {
      return 'N/A'; // Or any other text you prefer
    }

    const startMoment = moment(startTime);
    const endMoment = moment(endTime);

    const duration = moment.duration(endMoment.diff(startMoment));
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    // return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
  }
  //#endregion

  //#region for export report
  public exportUserReports(): any {
    const projectId = this.selectedProjectControl.value;
    const slectedDate = moment(this.fromDateControl.value);
    const endDate = moment(this.toDateControl.value);
    const toDate = moment().endOf('month');
    const fromDate = moment().subtract(3, 'months').startOf('month'); // Current date minus 3 months
    const diff = endDate.diff(slectedDate, 'M');
    let requestBody: any;
    if (diff <= 3) {
      const body = {
        projectId: projectId,
        fromDate: fromDate,
        toDate: toDate,
      };
      requestBody = { ...body };
    } else if (diff > 3 && diff <= 12) {
      const body = {
        projectId: projectId,
        fromDate: slectedDate.startOf('month'),
        toDate: endDate.endOf('month'),
      };
      requestBody = { ...body };
    } else {
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'Downloading reports beyond 1 year limit is not supported.' },
        duration: 45000,
      });
    }
    if (requestBody) {
      //Exporting
      this.reportService.setExportFlag(requestBody);
    }
  }
  //#endregion

  //#endregion
}
