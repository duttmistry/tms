import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectsService } from '../../../core/services/module/projects/projects.service';
import { FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import moment from 'moment';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { PERMISSION_CONSTANTS } from '../../../core/services/common/constants';
import { Encryption } from '@tms-workspace/encryption';
import { LoginService } from '../../../core/services/login/login.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';

@Component({
  selector: 'main-app-billing-details-form',
  templateUrl: './billing-details-form.component.html',
  styleUrls: ['./billing-details-form.component.scss'],
})
export class BillingDetailsFormComponent implements OnInit {
  projectId!: string;
  loading = true;
  projectResData: any;
  projectTeam: any;
  isBillableControl = new FormControl(false, [Validators.required]);
  quotedHoursControl = new FormControl(null, [Validators.min(1), Validators.max(9999)]);
  workedHoursControl = new FormControl();

  public allowToUpdate = false;
  public createdByNameAndDate: any;

  constructor(
    private _snackBar: MatSnackBar,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private projectService: ProjectsService,
    private spinnerService: SpinnerService,
    private storageService: StorageService,
    private loginService: LoginService,
    private permissionService: PermissionService
  ) {}
  ngOnInit(): void {
    this.getProjectDetails();
    this.checkForUpdatePermission();
  }

  getProjectDetails() {
    let p_id = this.activatedRoute.snapshot.paramMap.get('id') || null;

    if (p_id) {
      this.projectId = p_id;
      this.spinnerService.showSpinner();
      this.projectService.getProjectById(this.projectId).subscribe(
        (response: any) => {
          if (response) {
            this.projectResData = response;
            this.createdByNameAndDate =
              this.projectResData?.createdBy && this.projectResData?.created_at
                ? `Created By ${this.projectResData?.createdBy?.first_name} ${this.projectResData?.createdBy?.last_name} on ${moment(
                    this.projectResData?.created_at
                  )
                    .utc()
                    .format('DD/MM/YYYY hh:mm A')}`
                : '';
            this.loading = false;
            this.projectTeam = this.projectResData.projectTeam.map((team: any) => ({
              id: team.user.id,
              name: team.user.first_name + ' ' + team.user.last_name,
              avatar: team.user.employee_image,
            }));
            let isBillable = this.projectResData.projectBillingConfigration ? this.projectResData.projectBillingConfigration.is_billable : false;

            this.isBillableControl.setValue(isBillable);
            if (isBillable) {
              this.quotedHoursControl.setValue(this.projectResData.projectBillingConfigration.quoted_hours);
              const formattedTotalWorkedHours = this.formatHoursMinutes(this.projectResData.totalWorkedHours);
              if (formattedTotalWorkedHours !== '0h 0m') {
                this.workedHoursControl.setValue(formattedTotalWorkedHours);
              } else {
                this.workedHoursControl.setValue('');
              }
            }
          }

          this.spinnerService.hideSpinner();
        },
        (error) => {
          this.spinnerService.hideSpinner();
        }
      );
    }
  }
  redirectToBillingConfiguration() {
    this.router.navigate(['reports', 'billing-configuration']);
  }

  formateDate(date: string) {
    return moment(date.split('T')[0]).format('DD/MM/YYYY');
  }

  onSave() {
    if (this.isBillableControl.valid) {
      let body: any;
      if (this.isBillableControl.value) {
        if (this.quotedHoursControl.valid && this.workedHoursControl.valid) {
          body = {
            id: this.projectResData.projectBillingConfigration.id,
            project_id: this.projectResData.projectBillingConfigration.project_id,
            status: this.projectResData.projectBillingConfigration.project_status,
            isBillable: this.isBillableControl.value,
            quoted_hours: this.isBillableControl.value ? this.quotedHoursControl.value : '',
          };
        } else {
          return;
        }
      } else {
        body = {
          id: this.projectResData.projectBillingConfigration.id,
          project_id: this.projectResData.projectBillingConfigration.project_id,
          status: this.projectResData.projectBillingConfigration.project_status,
          isBillable: this.isBillableControl.value,
          quoted_hours: this.isBillableControl.value ? this.quotedHoursControl.value : '',
        };
      }

      this.spinnerService.showSpinner();
      this.projectService.updateBillingConfigurationStatus(body).subscribe(
        (res: any) => {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: res.message },
            duration: 45000,
          });
          this.spinnerService.hideSpinner();
          this.getProjectDetails();
        },
        (error) => {
          this.spinnerService.hideSpinner();
        }
      );
    }
  }

  public formatHoursMinutes(hoursMinutesString: any) {
    const [hoursStr, minutesStr] = hoursMinutesString.split(':');
    const hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    return `${hours}h ${minutes}m`;
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
}
