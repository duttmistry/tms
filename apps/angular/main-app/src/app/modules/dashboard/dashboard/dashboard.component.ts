import { Component, OnDestroy, OnInit } from '@angular/core';
import { StorageService } from '../../../core/services/common/storage.service';
import { ACTION_CONSTANTS, PERMISSION_CONSTANTS, PROJECT_ID_QUERY_PARAM_CONSTANT, STORAGE_CONSTANTS } from '../../../core/services/common/constants';
import { Encryption } from '@tms-workspace/encryption';
import { LoginService } from '../../../core/services/login/login.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Utility } from '../../../core/utilities/utility';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../../core/services/module/dashboard/dashboard.service';
import { MatSnackBar } from '@angular/material/snack-bar';
// import { WorkspaceService } from 'src/app/core/services/module/workspace/workspace.service';
import { SnackbarComponent } from 'libs/ui/material-controls/src/lib/snackbar/snackbar.component';

@Component({
  selector: 'main-app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  //#region Data member
  public hasOnlyMyTaskPermission = false;
  public hasMyTeamTaskPermission = false;
  public hasRemindersPermission = false;
  public hasleavesPermission = false;
  public hasGeneralActivityPermission = false;
  public hasProjectProgressPermission = false;
  public hasGeneralInfoPermission = false;
  public generalInfoPermissionObject = {};
  public taskPermissionObject = {};
  public loginUserName: any;
  public greetings = Utility.displayGreeting();
  isMyTeamtasksHidden = false;
  subscriptions: Subscription[] = [];
  //#endregion

  //#region Component Structure Methods
  constructor(
    private storageService: StorageService,
    private loginService: LoginService,
    private permissionService: PermissionService,
    private router: Router,
    private dashboardService: DashboardService,
    private _snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    const loggedInUserData = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string));
    // this.decUser_id = this.loggedInUserData?.user_id;
    // this.loggedinUserid = this.loggedInUserData?.user_id;
    this.loginUserName = loggedInUserData.user_firstname;

    if (permission != null) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.hasOnlyMyTaskPermission = this.permissionService.getModuleActionPermission(permission, 'dashboard', 'my_task');
      this.hasMyTeamTaskPermission = this.permissionService.getModuleActionPermission(permission, 'dashboard', 'my_team_task');
      this.hasRemindersPermission = this.permissionService.getModuleActionPermission(permission, 'dashboard', 'reminders');
      this.hasleavesPermission = this.permissionService.getModuleActionPermission(permission, 'dashboard', 'leaves');
      this.hasGeneralActivityPermission = this.permissionService.getModuleActionPermission(permission, 'dashboard', 'general_activity');
      this.hasProjectProgressPermission = this.permissionService.getModuleActionPermission(permission, 'dashboard', 'project_progress');

      this.hasGeneralInfoPermission = this.hasRemindersPermission || this.hasleavesPermission || this.hasGeneralActivityPermission;
      this.generalInfoPermissionObject = {
        hasRemindersPermission: this.hasRemindersPermission,
        hasleavesPermission: this.hasleavesPermission,
        hasGeneralActivityPermission: this.hasGeneralActivityPermission,
      };
      this.taskPermissionObject = {
        hasOnlyMyTaskPermission: this.hasOnlyMyTaskPermission,
        hasMyTeamTaskPermission: this.hasMyTeamTaskPermission,
      };
      this.subscriptions.push(
        this.dashboardService.getShowMyTeamTask().subscribe((currentVal: any) => {
          if (!currentVal) {
            this.isMyTeamtasksHidden = true;
          } else {
            this.isMyTeamtasksHidden = false;
          }
        })
      );
    } else {
      this.loginService.logout();
      this.router.navigate(['unauthorized-access']);
    }
    //Get previous session mesage
    this.subscriptions.push(
      this.loginService.getPreviousSession().subscribe((response: any) => {
        if (response) {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: response },
          });
        }
      })
    );
    this.loginService.setPreviousSessionMessage('');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
  navigateToAddTask() {
    // check if p_id exists in url then pass project id in add task page query parameters
    if (this.router.url && this.router.url.includes(PROJECT_ID_QUERY_PARAM_CONSTANT)) {
      const project_id = this.route.snapshot.queryParams[PROJECT_ID_QUERY_PARAM_CONSTANT];
      if (project_id) {
        this.router.navigate(['tasks', 'add'], {
          queryParams: { p_id: project_id, r_url: 'dashboard' },
        });
      } else {
        this.router.navigate(['tasks', 'add'], {
          queryParams: { r_url: 'dashboard' },
        });
      }
    } else {
      this.router.navigate(['tasks', 'add'], {
        queryParams: { r_url: 'dashboard' },
      });
    }
  }
  //#endregion

  //#region For member function

  //#endregion
}
