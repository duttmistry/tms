import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ProjectsService } from '../../../core/services/module/projects/projects.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { PERMISSION_CONSTANTS, PROJECT_STATUS_CONSTANTS, PROJECT_STATUS_OPTIONS } from '../../../core/services/common/constants';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { LoginService } from '../../../core/services/login/login.service';
import { Encryption } from '@tms-workspace/encryption';
import { FormControl } from '@angular/forms';
import moment from 'moment';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'main-app-billing-configuration',
  templateUrl: './billing-configuration.component.html',
  styleUrls: ['./billing-configuration.component.scss'],
})
export class BillingConfigurationComponent implements OnInit {
  projectStatusOptions = PROJECT_STATUS_OPTIONS;
  onGoing = PROJECT_STATUS_CONSTANTS.ON_GOING;
  closed = PROJECT_STATUS_CONSTANTS.CLOSED;
  emptyData = new MatTableDataSource([{ empty: 'row' }]);

  displayedColumns = ['projectTitle', 'projectTags', 'totalWorked', 'projectStatus'];
  _todaysDate = moment(new Date().toISOString().split('T')[0]);
  dataSource = new MatTableDataSource();
  projectsData: any;
  searchProjectControl = new FormControl('');
  projectStatusFilterControl = new FormControl();
  isBillableFilterControl = new FormControl();
  totalRecords!: number;

  limit = 25;
  page = 1;

  allowToUpdate = false;
  showSpinner = true;
  constructor(
    private spinnerService: SpinnerService,
    private _snackBar: MatSnackBar,
    private router: Router,
    private projectService: ProjectsService,
    private permissionService: PermissionService,
    private storageService: StorageService,
    private loginService: LoginService,
    private dialog: MatDialog
  ) {}
  ngOnInit(): void {
    this.getProjectsData(true);

    this.checkForUpdatePermission();
  }
  checkForUpdatePermission() {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);

    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.allowToUpdate = this.permissionService.getModuleActionPermission(permission, 'reports.billing_configuration', 'update');
      // console.log('permission', this.allowToUpdate);
    } else {
      this.loginService.logout();
    }
  }

  redirectToBillingForm(project_id: number) {
    this.router.navigate(['reports', 'billing-configuration', Encryption._doEncrypt(project_id.toString())]);
  }

  onSearchKeyUp(event: any) {
    if (event?.target && !event?.target?.value) {
      this.getProjectsData();
    }
  }

  removeFilter(event: any) {
    if (event instanceof PointerEvent) {
      event.stopPropagation();
    }
    this.getProjectsData();
  }

  onPageSelectionChange(event: any) {
    this.limit = event?.pageSize;
    this.page = event.pageIndex + 1;
    this.getProjectsData();
  }

  selectAllProjectStatus() {
    this.projectStatusFilterControl.patchValue([...this.projectStatusOptions]);
    this.getProjectsData();
  }
  clearAllProjectStatus() {
    this.projectStatusFilterControl.reset();
    this.getProjectsData();
  }

  getProjectsData(initialLoad = false) {
    this.showSpinner = true;
    let body = {
      page: this.page,
      limit: this.limit,
      sortBy: 'name',
      orderBy: 'asc',
      search: this.searchProjectControl.value,
      status: this.projectStatusFilterControl.value ? this.projectStatusFilterControl.value.map((status: any) => status.value) : '',
      billable: this.isBillableFilterControl.value,
    };
    if (initialLoad) {
      this.spinnerService.showSpinner();
    }

    this.projectService.getBillingProjectList(body).subscribe(
      (res: any) => {
        if (res.data && res.data.length == 0) {
          this.projectsData = [];
          this.dataSource = new MatTableDataSource(this.projectsData);
          this.totalRecords = 0;
        } else {
          let data = res.data.list.map((item: any) => ({
            ...item,
            project_tags: item.project_tags ? JSON.parse(item.project_tags) : [],
            project_estimated_end_date: item.project_estimated_end_date ? moment(item.project_estimated_end_date.split('T')[0]) : '',
            total_worked_hours: '',
            totalWorkedHours: '',
          }));

          this.projectsData = data;

          const projectIds = res.data.list.map((item: any) => item.id);
          this.getProjectTotalTimeWorked(projectIds);

          this.dataSource = new MatTableDataSource(this.projectsData);
          this.totalRecords = res.data.totalRecords;

          if (initialLoad) {
            this.spinnerService.hideSpinner();
          }
        }
        this.showSpinner = false;
        //   (error) => {
        //     if (initialLoad) {
        //       this.spinnerService.hideSpinner();
        //     }
        //     this.showSpinner = false;
        //   }
        // );
        // }
      },
      (error) => {
        if (initialLoad) {
          this.spinnerService.hideSpinner();
        }
        this.showSpinner = false;
      }
    );
  }

  getProjectTotalTimeWorked(projectIds: any) {
    this.projectService.getTotalWorkedTime({ project_ids: projectIds }).subscribe((res: any) => {
      let totalWorkedHoursData = res.data || [];
      this.projectsData = this.projectsData.map((item: any) => {
        let workHours = totalWorkedHoursData.find((data: any) => data.project_id == item.id);

        return {
          ...item,
          total_worked_hours: this.formatHours(workHours.total_worked_hours),
          totalWorkedHours: this.getHours(workHours.total_worked_hours),
        };
      });

      this.dataSource = new MatTableDataSource(this.projectsData);
    });
  }

  getHours(time: any) {
    let hours = +time.split(':')[0] + +time.split(':')[1] / 60 + +time.split(':')[2] / 3600;
    // console.log(hours);

    return hours;
  }

  askForConfirmation(title: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title,
      },
    });

    return dialogRef.afterClosed();
  }

  formatHours(time: string) {
    let hours = +time.split(':')[0];
    let minutes = +time.split(':')[1];

    return hours > 0 ? hours + 'h' + ' ' + (minutes > 0 ? minutes + 'm' : '') : '-';
  }

  updateBillingCongfigurationStatus(event: any, element: any) {
    if (element.project_workspace_is_active == 0 && element.projectStatus == this.closed) {
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'Please enable the workspace of this project' },
        duration: 45000,
      });
      this.getProjectsData(true);
      return;
    }

    let confirmationTitle =
      event.value == this.closed
        ? "The status of this project will be updated to 'Closed' and the status of all the tasks associated with this project will be set to 'Completed'. Are you sure you want to proceed?"
        : `The status of this project will be updated to '${
            event.value == this.onGoing ? 'Ongoing' : 'Under Maintenance'
          }'. Are you sure you want to proceed?`;

    this.askForConfirmation(confirmationTitle).subscribe((result) => {
      if (result) {
        let body = {
          id: element.projectStatusId,
          project_id: element.id,
          status: event.value,
          isBillable: element.projectBillable,
        };
        this.spinnerService.showSpinner();
        this.projectService.updateBillingConfigurationStatus(body).subscribe(
          (res: any) => {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: res.message },
              duration: 45000,
            });
            this.spinnerService.hideSpinner();
            this.getProjectsData(true);
          },
          (error) => {
            this.spinnerService.hideSpinner();

            this.getProjectsData(true);
          }
        );
      } else {
        this.getProjectsData(true);
      }
    });
  }
}
