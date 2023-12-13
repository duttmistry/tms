import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { LeaveReportsService } from '../../../core/services/module/administration/leaveReports.service';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Encryption } from '@tms-workspace/encryption';
import { STORAGE_CONSTANTS } from '../../../core/services/common/constants';
import { UserService } from '../../../core/services/module/users/users.service';
import { SiteSettingService } from '../../../core/services/common/site-setting.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from 'libs/ui/material-controls/src/lib/snackbar/snackbar.component';

@Component({
  selector: 'main-app-tms-workspace-leave-master-data',
  templateUrl: './leave-master-data.component.html',
  styleUrls: ['./leave-master-data.component.scss'],
})
export class LeaveMasterDataComponent implements OnInit, OnDestroy {
  //#region for data member
  @ViewChild('currentLeaveUpdateDialog', { static: true }) currentLeaveUpdateDialog!: TemplateRef<any>;
  displayedColumns: string[] = [
    'name',
    'currentLeaveCL',
    'currentLeavePL',
    'currentLeaveLWP',
    'usedLeaveCL',
    'usedLeavePL',
    'usedLeaveLWP',
    'reservedLeaveCL',
    'reservedLeavePL',
    'reservedLeaveLWP',
    'action',
  ];
  public dataSource = new MatTableDataSource<any>();
  public emptyData = new MatTableDataSource([{ empty: 'row' }]);
  public showSpinner = true;
  public leaveMasterData: any = [];
  public leaveUpdateForm!: FormGroup;
  public userId: any;
  public userRole: any;
  public isUserLeaveResponsiblePerson = false;
  public loggedInUserId: any;

  public allUsersList: any = [];
  //#endregion

  //#region for component structure mthods

  constructor(
    private leaveReportsService: LeaveReportsService,
    private siteSettingService: SiteSettingService,
    private userService: UserService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private _snackBar: MatSnackBar
  ) {
    this.initializeCurrentLeaveUpdate();
  }
  ngOnDestroy(): void {
    this.dialog.closeAll();
  }
  ngOnInit(): void {
    const user = JSON.parse(Encryption._doDecrypt(localStorage.getItem(STORAGE_CONSTANTS.USER_DATA) as string));
    this.userRole = user.user_role.toLowerCase();
    this.loggedInUserId = this.userService.getLoggedInUserId().toString();
    this.getLeaveMasterData();
    this.checkIfUserIsLeaveResponsiblePerson();
  }

  //#endregion

  //#region for member function

  //Form method
  public initializeCurrentLeaveUpdate() {
    this.leaveUpdateForm = this.fb.group({
      cl: ['', [Validators.pattern(/^-?\d+(\.\d+)?$/)]],
      pl: ['', [Validators.pattern(/^-?\d+(\.\d+)?$/)]],
      lwp: ['', [Validators.pattern(/^-?\d+(\.\d+)?$/)]],
      comment: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    });
  }

  get _currentLeaveUpdate() {
    return this.leaveUpdateForm.controls;
  }

  //This method used for check responsible persone
  checkIfUserIsLeaveResponsiblePerson() {
    this.siteSettingService.getModuleWiseSiteSettingsData('leave').subscribe((res: any) => {
      if (res.data) {
        let leaveRPData = res.data.find((data: any) => data.identifier == 'leave_reponsible_person');
        console.log(leaveRPData);
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

  //This method used for get leave master data
  public getLeaveMasterData() {
    this.showSpinner = true;
    this.leaveReportsService.getLeaveMasterData().subscribe(
      (response: any) => {
        if (response) {
          if (response?.data && response.data?.length > 0) {
            this.leaveMasterData = [];
            response?.data.forEach((leaveData: any) => {
              let employeObj: any = {};
              employeObj.name = leaveData?.first_name + ' ' + leaveData?.last_name;
              const currentLeave = leaveData?.leaveBalance;
              currentLeave.map((res: any) => {
                employeObj.userId = res?.user_id;
                if (res?.leave_type === 'CL') {
                  employeObj['currentLeaveCL'] = res?.current_balance;
                  employeObj['usedLeaveCL'] = res?.applied_balance;
                  employeObj['reservedLeaveCL'] = res?.reserved_balance;
                } else if (res?.leave_type === 'PL') {
                  employeObj['currentLeavePL'] = res?.current_balance;
                  employeObj['usedLeavePL'] = res?.applied_balance;
                  employeObj['reservedLeavePL'] = res?.reserved_balance;
                } else if (res?.leave_type === 'LWP') {
                  employeObj['currentLeaveLWP'] = res?.current_balance;
                  employeObj['usedLeaveLWP'] = res?.applied_balance;
                  employeObj['reservedLeaveLWP'] = res?.reserved_balance;
                }
              });
              const userObj = {
                id: leaveData.id,
                name: leaveData.first_name + ' ' + leaveData.last_name,
                avatar: leaveData.employee_image,
                designation: leaveData.designation,
              };
              this.allUsersList.push(userObj);
              this.leaveMasterData = [...this.leaveMasterData, employeObj];
            });

            this.dataSource = new MatTableDataSource(this.leaveMasterData);

            this.showSpinner = false;
          } else {
            this.leaveMasterData = [];
            this.showSpinner = false;
          }
        }
      },
      (err: any) => {
        this.showSpinner = false;
      }
    );
  }

  getSelectedUsersFromFilter(event: any) {
    const selectedUserIds = event ? event.map((user: any) => user.id) : [];
    // Filter the leaveMasterData based on selectedUserIds
    const filteredData = this.leaveMasterData.filter((item: any) => selectedUserIds.includes(item.userId));
    // Set the filtered data as the new dataSource
    this.dataSource = new MatTableDataSource(filteredData);
    console.log(filteredData);
    if (selectedUserIds?.length === 0) {
      this.dataSource = new MatTableDataSource(this.leaveMasterData);
    }
  }

  openDialog(element?: any) {
    this.userId = element?.userId || '';
    this.leaveUpdateForm.patchValue({
      cl: element.currentLeaveCL,
      lwp: element.currentLeaveLWP,
      pl: element.currentLeavePL,
    });
    this.dialog.open(this.currentLeaveUpdateDialog, {
      disableClose: true,
    });
  }

  onSave() {
    this.leaveUpdateForm.markAllAsTouched();
    if (this.leaveUpdateForm.valid) {
      this.leaveReportsService.updateCurrentLeave(this.leaveUpdateForm.value, this.userId).subscribe((response: any) => {
        if (response) {
          this.leaveUpdateForm.reset();
          this.getLeaveMasterData();
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: response?.message },
          });
          this.dialog.closeAll();
        }
      });
    }
  }

  onClose() {
    this.dialog.closeAll();
    this.leaveUpdateForm.reset();
  }

  //#endregion
}
