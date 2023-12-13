import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { environment } from './../../../../environments/environment';
import { Subscription, catchError, from, fromEvent, interval, mapTo, of, switchMap } from 'rxjs';
import { IProjectListDataModel } from '../../../core/model/projects/project.model';
import { ProjectsService } from '../../../core/services/module/projects/projects.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { LoginService } from '../../../core/services/login/login.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { FormControl } from '@angular/forms';
import { WorkspaceService } from '../../../core/services/module/workspace/workspace.service';
import { TagService } from '../../../core/services/module/projects/tag.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {
  ACTION_CONSTANTS,
  MODULE_CONSTANTS,
  PERMISSION_CONSTANTS,
  PROJECT_STATUS_CONSTANTS,
  PROJECT_STATUS_OPTIONS,
  STORAGE_CONSTANTS,
} from '../../../core/services/common/constants';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit, OnDestroy, AfterViewInit {
  allProjectsData!: IProjectListDataModel[];
  totalCount!: number;
  pageIndex = 1;
  pageSize = 30;
  currentProjectsCount = 30;
  baseUrl = environment.base_url;
  allowAdd = false;
  allowEdit = false;
  allowTasks = false;
  allowDelete = false;
  allowSettings = false;
  workspaceControl: any = new FormControl([]);
  workspaceList: any = [];
  tagsControl = new FormControl();
  tagList: any[] = [];

  @ViewChild('uiElement', { static: false }) public uiElement!: ElementRef;

  subscriptions: Subscription[] = [];
  projectStatusOptions = PROJECT_STATUS_OPTIONS;

  UNDER_MAINTENANCE = PROJECT_STATUS_CONSTANTS.UNDER_MAINTENANCE;
  ON_GOING = PROJECT_STATUS_CONSTANTS.ON_GOING;
  CLOSED = PROJECT_STATUS_CONSTANTS.CLOSED;
  orderBy = 'asc';
  filterObject: any = {
    orderBy: this.orderBy,
    sortBy: 'name',
    workspace: [],
    tags: '',
    status: [this.UNDER_MAINTENANCE, this.ON_GOING],
    search: '',
    page: this.pageIndex,
    limit: this.pageSize,
  };

  intervalCheck = interval(1000);
  intervalCheckSubscription: any;
  searchProjectControl = new FormControl('');
  projectStatusControl: FormControl<any> = new FormControl([...this.projectStatusOptions.filter((option) => option.value !== this.CLOSED)]);
  showSpinner = true;
  userRole: any;
  constructor(
    private projectService: ProjectsService,
    private loginService: LoginService,
    private storageService: StorageService,
    private permissionService: PermissionService,
    private router: Router,
    private _snackBar: MatSnackBar,
    public dialog: MatDialog,
    private clipboard: Clipboard,
    private spinnerService: SpinnerService,
    private workspaceService: WorkspaceService,
    private tagService: TagService,
    private activatedRoute: ActivatedRoute
  ) {
    this.checkForActionPermission();
  }
  ngAfterViewInit(): void {}

  ngOnInit(): void {
    window.scroll(0, 0);
    // this.getAllProjectsData();
    const user = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string));
    this.userRole = user.user_role;

    let w_id = this.activatedRoute.snapshot.queryParams['w_id'] || undefined;
    if (w_id && w_id !== undefined) {
      w_id = +Encryption._doDecrypt(w_id);
      this.filterObject.workspace = [w_id];
    }
    this.getWorkSpaceList(w_id);
    this.getTagsList();
    this.getProjectList(this.filterObject, true);
  }

  checkForActionPermission() {
    // get permission for operations
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.allowAdd = this.permissionService.getModuleActionPermission(permission, MODULE_CONSTANTS.PROJECT, ACTION_CONSTANTS.CREATE);
      this.allowEdit = this.permissionService.getModuleActionPermission(permission, MODULE_CONSTANTS.PROJECT, ACTION_CONSTANTS.EDIT);
      this.allowTasks = this.permissionService.getModuleActionPermission(permission, MODULE_CONSTANTS.PROJECT, ACTION_CONSTANTS.TASKS);
      this.allowDelete = this.permissionService.getModuleActionPermission(permission, MODULE_CONSTANTS.PROJECT, ACTION_CONSTANTS.DELETE);
      this.allowSettings = this.permissionService.getModuleActionPermission(permission, MODULE_CONSTANTS.PROJECT, ACTION_CONSTANTS.SETTINGS);
    } else {
      this.loginService.logout();
    }
  }

  selectAllProjectStatus() {
    this.projectStatusControl.patchValue([...this.projectStatusOptions]);
    this.onSelectProjectStatus();
  }
  clearAllProjectStatus() {
    this.projectStatusControl.reset();
    this.onSelectProjectStatus();
  }

  selectAllWorkspace() {
    // let ids = this.workspaceList.map((item: any) => item.id);
    this.workspaceControl.patchValue([...this.workspaceList]);
    this.onSelectWorkspace();
  }
  clearAllWorkspace() {
    this.workspaceControl.reset();
    this.onSelectWorkspace();
  }

  selectAllTags() {
    // let ids = this.tagList.map((item) => item.id);

    this.tagsControl.patchValue([...this.tagList]);
    this.onSelectTags();
  }
  clearAllTags() {
    this.tagsControl.reset();
    this.onSelectTags();
  }
  copyEditlink(id: number) {
    // let link = location.host + '/workspace/edit/' + Encryption._doEncrypt(id.toString());
    let link: any = this.router.createUrlTree(['project', 'edit', Encryption._doEncrypt(id.toString())]);
    link = location.host + this.router.serializeUrl(link);
    this.clipboard.copy(link);
    // console.log(link);

    this._snackBar.openFromComponent(SnackbarComponent, {
      data: { message: 'Copied!' },
      duration: 45000,
    });
  }

  // to get project list data initially and when scrolled down
  // getAllProjectsData() {
  //   this.spinnerService.showSpinner();
  //   this.subscriptions.push(
  //     this.projectService.getProjects(this.pageIndex, this.pageSize).subscribe(
  //       (response) => {
  //         if (response) {
  //           if (response.list) {
  //             const list: any = response.list;
  //             if (list && list.length > 0) {
  //               if (this.pageIndex == 1) {
  //                 this.totalCount = response.totalRecords;
  //                 this.allProjectsData = list;
  //               } else if (this.pageIndex > 1) {
  //                 this.allProjectsData.push(...list);
  //               }
  //             }
  //             // show remaining tags in tooltip
  //             if (this.allProjectsData && this.allProjectsData.length > 0) {
  //               this.allProjectsData.forEach((projectObject: any) => {
  //                 if (projectObject.project_tags && projectObject.project_tags.length > 2) {
  //                   projectObject.otherTags = projectObject.project_tags.slice(2);
  //                   projectObject.otherTags = projectObject.otherTags.map((otherTag: string) => otherTag).join(', ');
  //                 }
  //               });
  //             }
  //           }
  //         }
  //         this.spinnerService.hideSpinner();
  //       },
  //       (error) => {
  //         this.spinnerService.hideSpinner();
  //       }
  //     )
  //   );
  // }

  // redirect to edit project page
  editProject(id: number) {
    this.router.navigate(['project', 'edit', Encryption._doEncrypt(id.toString())]);
  }

  // delete selected project
  // deleteProject(id: number) {
  //   const projectId = Encryption._doEncrypt(id.toString());
  //   this.spinnerService.showSpinner();
  //   this.subscriptions.push(
  //     this.projectService.deleteProject(projectId).subscribe(
  //       (res) => {
  //         this._snackBar.openFromComponent(SnackbarComponent, {
  //           data: { message: res.message },
  //           duration: 45000,
  //         });
  //         this.spinnerService.hideSpinner();
  //         this.pageIndex = 1;
  //         this.pageSize = 15;
  //         // this.getAllProjectsData();
  //         this.getProjectList(this.filterObject);
  //       },
  //       (error) => {
  //         this.spinnerService.hideSpinner();
  //       }
  //     )
  //   );
  // }

  // when page scrolled down, check if there are more projects to load, then call get projects data
  @HostListener('window:scroll', ['$event'])
  onScroll() {
    if (this.uiElement) {
      const nativeElement = this.uiElement.nativeElement;
      if (
        nativeElement.clientHeight + Math.round(nativeElement.scrollTop) >= nativeElement.scrollHeight - 5 &&
        this.currentProjectsCount < this.totalCount
      ) {
        this.currentProjectsCount += this.pageSize;
        this.pageIndex++;
        this.filterObject.page = this.pageIndex;
        this.getProjectList(this.filterObject);
      }
    }
  }

  // To confirm that project will be deleted
  // openDeleteDialog(id: number, name: string): void {
  //   const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
  //     width: '500px',
  //     data: {
  //       title: `Are you sure you want to delete ${name}?`,
  //     },
  //   });

  //   this.subscriptions.push(
  //     dialogRef.afterClosed().subscribe((result) => {
  //       if (result) {
  //         this.deleteProject(id);
  //       }
  //     })
  //   );
  // }

  redirectToSettings(id: number) {
    // console.log(id);

    this.router.navigate(['project', 'settings', Encryption._doEncrypt(id.toString())]);
  }

  filterProjectsByWorkspace(workspace_id: number) {
    window.scroll(0, 0);
    this.uiElement.nativeElement.scrollTop = 0;
    let value = this.workspaceList.find((workspace: any) => workspace.id == workspace_id);
    this.workspaceControl.setValue([value]);
    this.filterObject.workspace = [workspace_id];
    this.pageIndex = 1;
    this.filterObject.page = this.pageIndex;
    this.currentProjectsCount = this.pageSize;

    this.getProjectList(this.filterObject);
  }

  redirectToTask(project: any) {
    if (project) {
      // console.log('project:', project);
      const projectObject = {
        id: project.id || '',
        title: project.project_title || '',
      };
      this.storageService.setIntoLocalStorage('project', JSON.stringify(projectObject));
      this.storageService.removeFromLocalStorage('workspace');
    }
    this.router.navigate(['tasks', 'list'], {
      queryParams: {
        p_id: Encryption._doEncrypt(project.id.toString()),
      },
    });
  }

  getWorkSpaceList(workspace_id?: any) {
    this.workspaceService.getWorkspaceListForFilter().subscribe(
      (res: any) => {
        if (res && res?.data) {
          this.workspaceList = res?.data || [];

          if (workspace_id) {
            let w = this.workspaceList.filter((workspace: any) => workspace.id == workspace_id);

            this.workspaceControl.setValue(w);
          }
        }
      },
      (err: any) => {
        this.workspaceList = [];
        throw err;
      }
    );
  }

  async getTagsList() {
    await this.tagService.getAllTagData().subscribe(
      (res: any) => {
        this.tagList = res?.data || [];
      },
      (err: any) => {
        throw err;
      }
    );
  }

  onSelectWorkspace(event?: any) {
    if (event instanceof PointerEvent) {
      event.stopPropagation();
    }
    this.filterObject.workspace = this.workspaceControl.value ? this.workspaceControl.value.map((item: any) => item.id) : '';
    this.pageIndex = 1;
    this.filterObject.page = this.pageIndex;
    this.currentProjectsCount = this.pageSize;

    this.getProjectList(this.filterObject);
  }
  onSelectProjectStatus(event?: any) {
    if (event instanceof PointerEvent) {
      event.stopPropagation();
    }
    this.filterObject.status = this.projectStatusControl.value ? this.projectStatusControl.value.map((status: any) => status.value) : '';
    this.pageIndex = 1;
    this.filterObject.page = this.pageIndex;
    this.currentProjectsCount = this.pageSize;

    this.getProjectList(this.filterObject);
  }

  onSelectTags(event?: any) {
    if (event instanceof PointerEvent) {
      event.stopPropagation();
    }
    this.filterObject.tags = this.tagsControl.value ? this.tagsControl.value.map((tag: any) => tag.id) : '';
    this.pageIndex = 1;
    this.filterObject.page = this.pageIndex;
    this.currentProjectsCount = this.pageSize;

    this.getProjectList(this.filterObject);
  }

  projectOrderBy() {
    this.orderBy = this.orderBy == 'asc' ? 'desc' : 'asc';
    this.filterObject.orderBy = this.orderBy;
    this.pageIndex = 1;
    this.filterObject.page = this.pageIndex;
    this.currentProjectsCount = this.pageSize;
    this.getProjectList(this.filterObject);
  }

  // check if textbox is made empty, then call API
  onSearchKeyUp(event: any) {
    if (event?.target && !event?.target?.value) {
      this.filterObject.search = this.searchProjectControl.value || '';
      this.pageIndex = 1;
      this.filterObject.page = this.pageIndex;
      this.currentProjectsCount = this.pageSize;

      this.getProjectList(this.filterObject);
    }
  }

  searchProject(event: any) {
    (event.target as HTMLInputElement).blur();
    this.filterObject.search = this.searchProjectControl.value?.trim() || '';
    this.pageIndex = 1;
    this.filterObject.page = this.pageIndex;
    this.currentProjectsCount = this.pageSize;

    this.getProjectList(this.filterObject);
  }

  //change get all project api to post method for sorting and filtering
  getProjectList(body: any, initialLoad: boolean = false) {
    this.showSpinner = true;
    if (initialLoad) {
      this.spinnerService.showSpinner();
    }
    this.projectService
      .getProjectList(body)
      .pipe(switchMap((res) => of(res)))

      .subscribe(
        (response: any) => {
          if (response && response?.data) {
            if (response.data?.list) {
              const list: any = response.data?.list;
              this.totalCount = response.data.totalRecords;
              if (this.pageIndex == 1) {
                const newArr = list.map((data: any) => ({
                  ...data,
                  project_tags: data?.project_tags ? JSON.parse(data.project_tags || '[]') : [],
                }));
                // this.allProjectsData = list;
                this.allProjectsData = newArr;
              } else if (this.pageIndex > 1) {
                const newArr = list.map((data: any) => ({
                  ...data,
                  project_tags: data?.project_tags ? JSON.parse(data.project_tags || '[]') : [],
                }));
                this.allProjectsData.push(...newArr);
              }
              // show remaining tags in tooltip
              if (this.allProjectsData && this.allProjectsData.length > 0) {
                this.allProjectsData.forEach((projectObject: any) => {
                  if (projectObject.project_tags && projectObject.project_tags.length > 2) {
                    projectObject.otherTags = projectObject.project_tags.slice(2);
                    // projectObject.otherTags = projectObject.otherTags.map((otherTag: string) => otherTag);
                  }
                });
              }
              this.intervalCheckSubscription ? this.intervalCheckSubscription.unsubscribe() : '';
              this.intervalCheckSubscription = this.intervalCheck.subscribe(() => {
                this.onScroll();
              });
            } else {
              this.allProjectsData = [];
              this.totalCount = 0;
              this.showSpinner = false;
            }
          }

          if (initialLoad) {
            this.spinnerService.hideSpinner();
          }
          this.showSpinner = false;
        },
        (err) => {
          if (initialLoad) {
            this.spinnerService.showSpinner();
          }
          this.showSpinner = false;
        }
      );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
