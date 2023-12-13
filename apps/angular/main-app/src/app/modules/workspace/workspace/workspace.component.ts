import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { environment } from './../../../../environments/environment';
import { Subscription } from 'rxjs';
import { IWorkspaceListModel } from '../../../core/model/workspace/workspace.model';
import { LoginService } from '../../../core/services/login/login.service';
import { WorkspaceService } from '../../../core/services/module/workspace/workspace.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';

import { Clipboard } from '@angular/cdk/clipboard';
import { StorageService } from '../../../core/services/common/storage.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { FormControl } from '@angular/forms';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ACTION_CONSTANTS, MODULE_CONSTANTS, PERMISSION_CONSTANTS, STORAGE_CONSTANTS } from '../../../core/services/common/constants';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
@Component({
  selector: 'app-view-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  workspaceList!: IWorkspaceListModel[];
  // totalProjectCount!: number;
  baseUrl = environment.base_url;
  subscriptions: Subscription[] = [];
  userRole!: string;
  allowDelete = false;
  allowEdit = false;
  allowAdd = false;
  allowTasks = false;
  allowSettings = true;
  copyLink!: string;
  searchWorkspaceControl = new FormControl('');
  sortByControl = new FormControl('');
  isActiveControl = new FormControl('');
  sortByList: string[] = [];
  pageIndex = 1;
  limit = 30;
  pageSize = 30;
  currentProjectsCount = 30;
  filterObject = {
    sortBy: 'title',
    orderBy: 'asc',
    search: '',
    page: this.pageIndex,
    limit: this.limit,
  };
  workspaceCount = 0;
  allWorkSpaceData: any = [];

  @ViewChild('uiElement', { static: false }) public uiElement!: ElementRef;
  showSpinner = true;
  constructor(
    private workspaceService: WorkspaceService,
    private permissionService: PermissionService,
    private _snackBar: MatSnackBar,
    private router: Router,
    public dialog: MatDialog,
    private clipboard: Clipboard,
    private storageService: StorageService,
    private loginService: LoginService,
    private spinnerService: SpinnerService
  ) {
    this.checkForActionPermission();
  }

  ngOnInit(): void {
    window.scroll(0, 0);
    const user = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string));
    this.userRole = user.user_role;
    this.getWorkspaceData(true);
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
  @HostListener('window:scroll', ['$event'])
  onScroll() {
    if (this.uiElement) {
      const nativeElement = this.uiElement.nativeElement;
      if (
        nativeElement.clientHeight + Math.round(nativeElement.scrollTop) == nativeElement.scrollHeight &&
        this.currentProjectsCount < this.workspaceCount
      ) {
        this.currentProjectsCount += this.pageSize;
        this.pageIndex++;
        // this.getAllProjectsData();
        this.filterObject.page = this.pageIndex;
        this.getWorkspaceData(true);
      }
    }
  }
  checkForActionPermission() {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.allowAdd = this.permissionService.getModuleActionPermission(permission, MODULE_CONSTANTS.WORKSPACE, ACTION_CONSTANTS.CREATE);
      this.allowEdit = this.permissionService.getModuleActionPermission(permission, MODULE_CONSTANTS.WORKSPACE, ACTION_CONSTANTS.EDIT);
      this.allowTasks = this.permissionService.getModuleActionPermission(permission, MODULE_CONSTANTS.WORKSPACE, ACTION_CONSTANTS.TASKS);
      this.allowDelete = this.permissionService.getModuleActionPermission(permission, MODULE_CONSTANTS.WORKSPACE, ACTION_CONSTANTS.DELETE);
      this.allowSettings = this.permissionService.getModuleActionPermission(permission, MODULE_CONSTANTS.WORKSPACE, ACTION_CONSTANTS.SETTINGS);
    } else {
      this.loginService.logout();
    }
  }

  copyEditlink(event: any, id: number) {
    event.stopPropagation();
    // let link = location.host + '/workspace/edit/' + Encryption._doEncrypt(id.toString());
    let link: any = this.router.createUrlTree(['workspace', 'edit', Encryption._doEncrypt(id.toString())]);
    link = location.host + this.router.serializeUrl(link);
    this.clipboard.copy(link);
    // console.log(link);

    this._snackBar.openFromComponent(SnackbarComponent, {
      data: { message: 'Copied!' },
      duration: 45000,
    });
  }

  getWorkspaceData(initialLoad: boolean = false) {
    this.showSpinner = true;
    if (initialLoad) {
      this.spinnerService.showSpinner();
      this.showSpinner = true;
    }

    this.subscriptions.push(
      this.workspaceService.getWorkspace(this.filterObject).subscribe(
        (response: any) => {
          if (response && response?.list) {
            // this.totalProjectCount = response.list.totalProjectCount;
            this.workspaceList = response.list;
            const workSpaceData = response.list;
            this.workspaceCount = response?.totalRecords;
            if (this.pageIndex == 1) {
              this.allWorkSpaceData = workSpaceData;
            } else if (this.pageIndex > 1) {
              this.allWorkSpaceData.push(...workSpaceData);
            }
            // console.log(this.workspaceList);
            // this.workspaceService.getWorkspaceProjectCount().subscribe((res: any) => {
            //   const projectCountData = res.data;
            //   if (this.workspaceList && this.workspaceList.length > 0) {
            //     this.workspaceList.forEach((workspace) => {
            //       const countData = projectCountData.find((item: any) => item.id == workspace.id);
            //       if (countData) {
            //         workspace['linkedProjectCount'] = countData.project_count;
            //         workspace['totalTaskCount'] = countData.workspace_total_task;
            //         // this.totalProjectCount = countData.total_project;
            //       }
            //     });
            //   }
            // });
            this.showSpinner = false;
          } else {
            this.workspaceList = [];
            this.workspaceCount = 0;
            this.showSpinner = false;
          }
          if (initialLoad) {
            this.spinnerService.hideSpinner();
            this.showSpinner = false;
          }
        },
        (error: any) => {
          if (initialLoad) {
            this.spinnerService.hideSpinner();
            this.showSpinner = false;
          }
        }
      )
    );
  }

  editWorkspace(id: number) {
    this.router.navigate(['workspace', 'edit', Encryption._doEncrypt(id.toString())]);
  }

  // deleteWorkspace(id: number) {
  //   this.spinnerService.showSpinner();
  //   this.subscriptions.push(
  //     this.workspaceService.deleteWorkspaceById(id.toString()).subscribe(
  //       (res) => {
  //         this._snackBar.openFromComponent(SnackbarComponent, {
  //           data: { message: res.message },
  //           duration: 45000,
  //         });

  //         this.workspaceList = this.workspaceList.filter((workspace) => workspace.id !== id);
  //         this.spinnerService.hideSpinner();
  //       },
  //       (error) => {
  //         this.spinnerService.hideSpinner();
  //       }
  //     )
  //   );
  // }

  // openDeleteDialog(id: number, name: string): void {
  //   const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
  //     width: '500px',
  //     data: {
  //       title: `Are you sure you want to delete ${name} ?`,
  //     },
  //   });

  //   this.subscriptions.push(
  //     dialogRef.afterClosed().subscribe((result) => {
  //       if (result) {
  //         this.deleteWorkspace(id);
  //       }
  //     })
  //   );
  // }

  redirectToTask(workspace: any) {
    if (workspace) {
      const workspaceObject = {
        id: workspace.id || '',
        title: workspace.title || '',
      };
      this.storageService.setIntoLocalStorage('workspace', JSON.stringify(workspaceObject));
    }
    this.router.navigate(['tasks', 'list'], {
      queryParams: {
        w_id: Encryption._doEncrypt(workspace.id.toString()),
      },
    });
  }

  searchWorkSpace(event: any) {
    (event.target as HTMLInputElement).blur();

    this.filterObject.search = this.searchWorkspaceControl.value?.trim() || '';

    this.getWorkspaceData();
  }

  // check if textbox is made empty, then call API
  onSearchKeyUp(event: any) {
    if (event?.target && !event?.target?.value) {
      this.filterObject.search = '';
      this.getWorkspaceData();
    }
  }

  workspaceOrderBy() {
    // this.orderBy = this.orderBy == 'asc' ? 'desc' : 'asc';
    this.filterObject.orderBy = this.filterObject.orderBy == 'asc' ? 'desc' : 'asc';

    this.getWorkspaceData();
  }

  onSelectSortBy() {
    this.filterObject.sortBy = this.sortByControl.value || '';
    this.getWorkspaceData();
  }

  redirectToProjects(workspace_id: number) {
    const w_id = Encryption._doEncrypt(workspace_id.toString()) || '';
    this.router.navigate(['project'], {
      queryParams: {
        w_id,
      },
    });
  }

  redirectToSettings(workspace: any) {
    // if (workspace) {
    //   const workspaceObject = {
    //     id: workspace.id || '',
    //     title: workspace.title || '',
    //   };
    //   this.storageService.setIntoLocalStorage('workspace', JSON.stringify(workspaceObject));
    // }
    // this.router.navigate(['tasks', 'list', Encryption._doEncrypt(workspace.id.toString())]);
  }
}
