import { FormControl, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/module/users/users.service';
import { SiteSettingService } from '../../../core/services/common/site-setting.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';

@Component({
  selector: 'main-app-leave-admin',
  templateUrl: './leave-admin.component.html',
  styleUrls: ['./leave-admin.component.scss'],
})
export class LeaveAdminComponent implements OnInit {
  teamMembersList = [];

  leaveResponsiblePersons: any = [];
  cronJobDay = new FormControl(1, [Validators.min(1), Validators.max(31), Validators.pattern('^[0-9]+$')]); //Validators.pattern('[0-3]{1}[0-9]{1}')
  cronJobTime = new FormControl('');
  CLBalance = new FormControl(0, [Validators.min(0), Validators.pattern('^[0-9]+$')]);
  PLBalance = new FormControl(0, [Validators.min(0), Validators.pattern('^[0-9]+$')]);
  clLeaveData: any;
  leaveResponsiblePersonData: any;
  leaveCronData: any;
  plLeaveData: any;
  isSelectedPersonData: any;
  showSpinner = true;
  module = 'LeaveAdmin';
  showError = true;
  constructor(
    private spinnerService: SpinnerService,
    private _snackBar: MatSnackBar,
    private userService: UserService,
    private siteSettingService: SiteSettingService
  ) {}
  ngOnInit(): void {
    this.getModuleWiseSiteSettingsData();
    this.getTeamMembersData();
    // console.log(_GetByModule('leave'));
  }

  getModuleWiseSiteSettingsData() {
    this.spinnerService.showSpinner();
    this.siteSettingService.getModuleWiseSiteSettingsData('leave').subscribe(
      (res: any) => {
        this.spinnerService.hideSpinner();
        if (res.data && res.data.length) {
          this.leaveResponsiblePersonData = res.data.find((item: any) => item.identifier == 'leave_reponsible_person');
          if (this.leaveResponsiblePersonData) {
            this.leaveResponsiblePersons = this.leaveResponsiblePersonData.value;
          }

          this.leaveCronData = res.data.find((item: any) => item.identifier == 'leave_cron_date');
          if (this.leaveCronData && this.leaveCronData.value) {
            this.cronJobDay.setValue(this.leaveCronData.value.split('-')[0]);

            this.cronJobTime.setValue(this.leaveCronData.value.split('-')[1]);
          } else {
            this.cronJobDay.setValue(1);

            this.cronJobTime.setValue('11:00 AM');
          }

          this.clLeaveData = res.data.find((item: any) => item.identifier == 'leave_to_add_for_cl');
          if (this.clLeaveData) {
            this.CLBalance.setValue(this.clLeaveData.value);
          }

          this.plLeaveData = res.data.find((item: any) => item.identifier == 'leave_to_add_for_pl');
          if (this.plLeaveData) {
            this.PLBalance.setValue(this.plLeaveData.value);
          }
        }
      },
      (error) => {
        this.spinnerService.hideSpinner();
      }
    );
  }

  getTeamMembersData() {
    this.showSpinner = true;
    this.spinnerService.showSpinner();
    this.userService.getAllUsers({ sortBy: 'first_name', orderBy: 'asc' }).subscribe(
      (response: any) => {
        this.spinnerService.hideSpinner();
        if (response) {
          const responseData = response.data || '';
          if (responseData && responseData.list && responseData.list.length > 0) {
            this.teamMembersList = responseData.list || [];
          }
        }
        this.showSpinner = false;
      },
      (error) => {
        this.spinnerService.hideSpinner();
        this.showSpinner = false;
        console.log('error', error);
      }
    );
  }

  selectLeaveresponsiblePerson(event: any) {
    // this.leaveResponsiblePersons = [];
    this.isSelectedPersonData = this.leaveResponsiblePersons.push(event.id);
  }

  deleteLeaveResponsiblePerson(event: any) {
    // this.leaveResponsiblePersons = [];
    this.leaveResponsiblePersons = this.leaveResponsiblePersons.filter((userId: any) => userId !== event.id);
  }

  onCancel() {
    if (
      this.isSelectedPersonData ||
      !(this.cronJobDay.value?.toString() === '01') ||
      !(this.cronJobTime.value?.toString() === '11:00 AM') ||
      this.CLBalance.value !== 5 ||
      this.PLBalance.value !== 5
    ) {
      this.getModuleWiseSiteSettingsData();
    }
    this.isSelectedPersonData = null;
  }

  onSave() {
    if (this.cronJobDay.invalid || this.cronJobTime.invalid || this.CLBalance.invalid || this.PLBalance.invalid) {
      return;
    }

    this.leaveResponsiblePersonData.value = this.leaveResponsiblePersons;
    if (!this.cronJobTime.value && !this.cronJobDay.value) {
      this.leaveCronData.value = '01' + '-' + '11:00 AM';
    } else if (!this.cronJobDay.value) {
      this.leaveCronData.value = '01' + '-' + this.cronJobTime.value;
    } else if (!this.cronJobTime.value) {
      this.leaveCronData.value = this.cronJobDay.value + '-' + '11:00 AM';
    } else {
      this.leaveCronData.value = this.cronJobDay.value + '-' + this.cronJobTime.value;
    }
    this.clLeaveData.value = this.CLBalance.value ? this.CLBalance.value : 1;
    this.plLeaveData.value = this.PLBalance.value ? this.PLBalance.value : 1;
    let body = {
      module: 'leave',
      fields: [this.leaveResponsiblePersonData, this.leaveCronData, this.clLeaveData, this.plLeaveData],
    };
    this.showError = false;
    if (this.leaveResponsiblePersons?.length > 0) {
      this.showError = true;
      this.spinnerService.showSpinner();
      this.siteSettingService.setModuleWiseSiteSettingsData(body).subscribe(
        (res: any) => {
          this.spinnerService.hideSpinner();
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: res.message },
            duration: 45000,
          });
          this.getModuleWiseSiteSettingsData();
        },
        (error) => {
          this.spinnerService.hideSpinner();
          this.showError = true;
        }
      );
    }
  }
}
