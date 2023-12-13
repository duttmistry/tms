import { Component, ElementRef, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { MatFormField } from '@angular/material/form-field';
import { Encryption } from '@tms-workspace/encryption';
import { environment } from './../../../../environments/environment';
import { Subscription } from 'rxjs';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { ProjectsService } from '../../../core/services/module/projects/projects.service';

import { UserService } from '../../../core/services/module/users/users.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Route, Router } from '@angular/router';

import { STORAGE_CONSTANTS } from '../../../core/services/common/constants';
import { FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '@tms-workspace/material-controls';
import * as moment from 'moment';
import { SiteSettingService } from '../../../core/services/common/site-setting.service';
import { Utility } from '../../../core/utilities/utility';
import { MatDialog } from '@angular/material/dialog';
import { TaskService } from '../../../core/services/module/tasks/task.service';
import { GlobalService } from '../../../core/services/common/global.service';

export interface IUserData {
  date: string;
  day: string;
  userName: string;
  expectedTime: string;
  idleTime: string;
  actualTime: string;
  manualTime: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  //#region properties
  baseUrl = environment.base_url;
  prefStorageName = STORAGE_CONSTANTS.DASHBOARD_PREF;
  employeeId!: number;
  skillDescControl = new FormControl('', [Validators.maxLength(1024)]);
  userData!: any;
  isInputHidden = true;
  isDescHidden = false;
  removeAssignedProjectError = false;
  skypeUrl: any = '';
  productionDate: any = '';
  loggedInUserId!: number;
  dialogRef: any;
  dialogProjectListRef: any;
  selectedProjects: any[] = [];
  allRemovedProjectsIds: any[] = [];
  @ViewChild('formField') formField!: ElementRef<MatFormField>;
  @ViewChild('desc') desc!: ElementRef<HTMLParagraphElement>;
  @ViewChild('inputBio') inputBioElm!: ElementRef<HTMLElement>;
  isDialogOpen = false;
  // lateArrivalThreshold: any;
  @ViewChild('dialogContent') dialogContent!: TemplateRef<any>;
  @ViewChild('projectsLists') projectsLists!: TemplateRef<any>;
  subscriptions: Subscription[] = [];
  selectedWorkspacesIds: any[] = [];
  notSelectedWorkspacesProjectsIds: any[] = [];
  selectedStandaloneProjectsIds: any[] = [];
  workspaceProjectIds: any[] = [];
  standaloneProjectsIds: any[] = [];
  projectList: any = [];
  totalProjectCount: any;
  dateOfJoining: any;
  dateOfBirth: any;
  experience: any;
  encryptedUserId!: string;
  showSpinner = true;
  ceoProfileData: any;
  isCEOUser = false;
  teamLeadHierarchy: any = [];
  userRole: any;
  params_user_id: any;
  user_id: any;
  public userFilterPrefStorageID = STORAGE_CONSTANTS.TASK_FILTERS;
  public encUser_id: any;
  public userDetails: any;
  //#endregion
  constructor(
    private userService: UserService,
    private storageService: StorageService,
    private projectService: ProjectsService,
    private spinnerService: SpinnerService,
    private domSanatizer: DomSanitizer,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    private router: Router,
    private renderer: Renderer2,
    private siteSettingsService: SiteSettingService,
    private dialog: MatDialog,
    private taskService: TaskService,
    private globalService: GlobalService,
  ) {
    this.getParamsData()
  }

  ngOnInit(): void {
    window.scroll(0, 0);
    this.getUserProfileData();
    this.getCeoProfile();
    this.userRole = this.userService.getUserDataFromLS();
  }

  navigateToLeaveHistory() {
    this.router.navigate(['leave', 'history', Encryption._doEncrypt(this.employeeId.toString())], { state: { data: 'Profile' } });
  }

  navigateToLeaveTransectionHistory() {
    this.router.navigate(['leave', 'transection-history', Encryption._doEncrypt(this.employeeId.toString())], { state: { data: 'Profile' } });
  }

  getCertificateData() {
    // let content = this.userService
    //   .getCertificateFile(this.userData.certificates[0].certificate_file)
    //   .subscribe((res) => {
    //     console.log(res);
    //   });
    // let pdfContent =
    //   URL.createObjectURL(this.b64toBlob(content, 'application/pdf')) +
    //   '#toolbar=0&navpanes=0&scrollbar=0&view=FitH';
    // this.pdfview.nativeElement.setAttribute('data', this.pdfContent);
  }
  getCeoProfile() {
    const id = 1;
    this.siteSettingsService.getCEOProfile(id).subscribe(
      (res: any) => {
        if (res) {
          this.ceoProfileData = res;
          if (this.employeeId == res?.user_id) {
            this.isCEOUser = true;
          }
        }
      },
      (error) => {
        //  console.log('error: ', error);
      }
    );
  }
  // get project list to bind in user profile
  getActiveProjectsList() {
    this.spinnerService.showSpinner();
    this.showSpinner = true;
    this.subscriptions.push(
      this.projectService.getActiveProjects(this.encryptedUserId).subscribe(
        (response: any) => {
          if (response) {
            if (response?.data && response?.data?.length > 0) {
              this.projectList = response?.data || [];
            } else {
              this.projectList = [];
            }
          }
          this.showSpinner = false;
          this.spinnerService.hideSpinner();
        },
        (error) => {
          this.spinnerService.hideSpinner();
          console.log('error:', error);
          this.showSpinner = false;
        }
      )
    );
  }

  getUserProfileData() {
    //const userData = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage('userData') as string));
    // this.employeeId = userData.user_id;
    this.showSpinner = true;
    if (this.employeeId) {
      this.spinnerService.showSpinner();
      this.subscriptions.push(
        this.userService.getUserById(this.employeeId.toString()).subscribe(
          (res) => {
            if (res?.status == 409) {
              this.router.navigate(['unauthorized-access']);
              this.spinnerService.hideSpinner();
            } else {
              this.userData = res;
              this.user_id = this.userData?.id.toString()
              if (this.userData && this.userData.id) {
                this.encryptedUserId = Encryption._doEncrypt(this.userData.id.toString());
                this.userDetails = {
                  // name: `Me(${this.userData.first_name} ${this.userData.last_name})`,
                  name: this.userData.first_name + ' ' + this.userData.last_name,
                  id: this.userData.id,
                };
                this.getActiveProjectsList();
              }
              this.skypeUrl = this.domSanatizer.bypassSecurityTrustUrl('skype:' + this.userData?.skype + '?chat');
              this.productionDate = this.userData?.production_date ? this.formatDate(this.userData?.production_date) : '-';
              this.dateOfJoining = this.userData?.workdetails?.joiningDate ? this.formatDate(this.userData?.workdetails?.joiningDate) : '-';

              this.dateOfBirth = this.formatDate(this.userData?.dob);
              this.skillDescControl.setValue(this.userData?.skill_description);
              this.experience = Utility?.calcaulateExp(
                this.userData?.workdetails ? this.userData?.workdetails : {},
                this.userData?.experience ? this.userData?.experience : []
              );
              this.teamLeadHierarchy = this.userData?.hierarchy?.reverse();

              // console.log('%c  this.teamLeadHierarchy:', 'color: #0e93e0;background: #aaefe5;', this.teamLeadHierarchy);
              // console.log("teamLeadHierarchy",this.teamLeadHierarchy);
              this.getCertificateData();
            }
            this.skypeUrl = this.domSanatizer.bypassSecurityTrustUrl('skype:' + this.userData?.skype + '?chat');
            this.productionDate = this.userData?.production_date ? this.formatDate(this.userData?.production_date) : '-';
            this.skillDescControl.setValue(this.userData?.skill_description);

            this.getCertificateData();
            this.spinnerService.hideSpinner();
            this.showSpinner = false;
            // console.log("user data",this.userData)
          },
          (error) => {
            this.spinnerService.hideSpinner();
            this.showSpinner = false;
          }
        )
      );
    }
  }

  updateSkill() {
    this.isInputHidden = true;
    this.isDescHidden = false;
    if (this.skillDescControl.valid) {
      this.userService.updateSkillDescription(this.skillDescControl.value || '').subscribe((res: any) => {
        this.snackBar.openFromComponent(SnackbarComponent, {
          data: {
            message: res.message,
          },
        });
      });
    }
  }

  onEditSkill() {
    this.isInputHidden = false;
    this.isDescHidden = true;
    setTimeout(() => {
      this.inputBioElm.nativeElement.focus();
    }, 10);
  }

  onKeypressBio(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement && event.target.value.trim() === '' && event.key === ' ') {
      event.preventDefault();
    }
  }

  // bioInputValidation(input: any) {
  //   const trimmedInput = input.trim();
  //   const firstCharacter = trimmedInput.charAt(0);
  //   let error_message = '';
  //   if (firstCharacter === ' ') {
  //     error_message = 'First character cannot be space';
  //     return { isError: true, message: error_message };
  //     // return false;
  //   }
  //   if (trimmedInput.length < 3) {
  //     error_message = 'Minimum 3 characters required';
  //     return { isError: true, message: error_message };
  //     // return false;
  //   }
  //   return { isError: false, message: '' };
  // }

  focusOnInputBio() {
    this.renderer.selectRootElement(this.inputBioElm.nativeElement).focus();
  }

  //This method used for fromate date
  public formatDate(dateString: string): string {
    if (!dateString) {
      return '';
    }
    const dateParts = dateString.split('T')[0].split('-');
    const year = dateParts[0];
    const month = dateParts[1];
    const day = dateParts[2];

    return `${day}/${month}/${year}`;
  }

  public navigateToTaskListPage(project: any) {
    if (project && this.userDetails && this.userDetails !== '') {
      const filtersData = {
        search: '',
        assignee: this.userDetails ? [this.userDetails] : [],
        state: ['todo', 'inprogress', 'onhold'],
        fromDate: '',
        toDate: '',
        groupBy: 'project_id',
        showCompleted: false,
        projects: [{ id: project?.id }],
      };
      this.userFilterPrefStorageID = STORAGE_CONSTANTS.TASK_FILTERS + '_' + this.encryptedUserId;
      localStorage.setItem(this.userFilterPrefStorageID, Encryption._doEncrypt(JSON.stringify(filtersData)));
      this.router.navigate(['tasks/list'], { queryParams: { user_id: this.encryptedUserId } });
    }
  }

  assignProjectsModel() {
    this.dialogRef = this.dialog.open(this.dialogContent, {
      hasBackdrop: true,
      disableClose: true,
    });
    // dialogRef.afterClosed().subscribe(() => {
    // });
  }

  closeDialog(): void {
    this.removeAssignedProjectError = false;
    this.dialogRef?.close();
  }
  closeDialogProject(): void {
    this.removeAssignedProjectError = false;
    this.dialogProjectListRef?.close();
  }

  removeAssignedProjects() {
    const selectedProjectsIds = [...this.selectedStandaloneProjectsIds, ...this.notSelectedWorkspacesProjectsIds];
    this.allRemovedProjectsIds = [...this.standaloneProjectsIds, ...this.workspaceProjectIds];
    // console.log('this.allRemovedProjectsIds: ', this.allRemovedProjectsIds);
    this.dialogProjectListRef = this.dialog.open(this.projectsLists, {
      hasBackdrop: true,
      disableClose: true,
    });
    // console.log('selectedProjectsIds: ', selectedProjectsIds);
    // console.log('selectedWorkspacesIds: ', this.selectedWorkspacesIds);
    // console.log('notSelectedWorkspacesProjectsIds: ', this.notSelectedWorkspacesProjectsIds);
    // console.log('selectedStandaloneProjectsIds: ', this.selectedStandaloneProjectsIds);
  }
  removeAssignedProjectsConfirmation() {
    const selectedProjectsIds = [...this.selectedStandaloneProjectsIds, ...this.notSelectedWorkspacesProjectsIds];
    const body = {
      project_ids: selectedProjectsIds,
      workspace_ids: this.selectedWorkspacesIds,
    };
    if (selectedProjectsIds?.length > 0 || this.selectedWorkspacesIds?.length > 0) {
      // console.log('this.params_user_id: ', this.params_user_id);
      this.taskService.inactiveBulkProjects(body, Encryption._doEncrypt(this.params_user_id.toString() ? this.params_user_id.toString() : this.user_id.toString())).subscribe({
        next: (res: any) => {
          if (res?.message == 'Success' && res?.success) {
            this.snackBar.openFromComponent(SnackbarComponent, {
              data: {
                message: 'Assigned projects removed successfully',
              },
            });
          }
          this.closeDialog();
          this.closeDialogProject();
        },
        error: (err: any) => {
          this.snackBar.openFromComponent(SnackbarComponent, {
            data: {
              message: err?.error?.message ? err?.error?.message : 'Something went wrong, please try again.',
            },
          });
          this.closeDialog();
          this.closeDialogProject();
        },
      });
    } else if (!(selectedProjectsIds?.length > 0) && !(this.selectedWorkspacesIds?.length > 0)) {
      this.removeAssignedProjectError = true;
    }
  }

  getSelectedProjects(eventArgs: any) {
    this.selectedProjects = eventArgs;
  }
  selectedWorkspace(eventArgs: any) {
    this.selectedWorkspacesIds = eventArgs?.selected_workspace?.map((workspace: any) => workspace?.id);
    // console.log('this.selectedWorkspacesIds: ', this.selectedWorkspacesIds);
    const selected_workspace_projects_Ids: any = {
      ids: [],
      projects: [],
    };
    eventArgs?.selected_workspace?.map((workspace: any) => {
      if (!workspace.selected) {
        workspace.projects?.map((project: any) => {
          if (!project?.selected) {
            selected_workspace_projects_Ids.ids.push(project?.id);
            selected_workspace_projects_Ids.projects.push(project);
          }
        });
      }
    });
    const not_selected_workspace_projects_Ids: any = {
      ids: [],
      projects: [],
    };
    eventArgs?.not_selected_workspace?.map((workspace: any) => {
      if (workspace.selected) {
        workspace.projects?.map((project: any) => {
          if (!project?.selected) {
            not_selected_workspace_projects_Ids.ids.push(project?.id);
            not_selected_workspace_projects_Ids.projects.push(project);
          }
        });
      }
    });
    this.notSelectedWorkspacesProjectsIds = [...not_selected_workspace_projects_Ids.ids, ...selected_workspace_projects_Ids.ids];
    this.workspaceProjectIds = [...not_selected_workspace_projects_Ids.projects, ...selected_workspace_projects_Ids.projects];
    // console.log('this.workspaceProjectIds: ', this.workspaceProjectIds);
    if (
      this.notSelectedWorkspacesProjectsIds?.length > 0 ||
      this.selectedWorkspacesIds?.length > 0 ||
      this.selectedStandaloneProjectsIds?.length > 0
    ) {
      this.removeAssignedProjectError = false;
    } else {
      this.removeAssignedProjectError = true;
    }
  }
  getSelectedProjects_standalone(eventArgs: any) {
    const standloneIds: any = {
      ids: [],
      projects: [],
    };

    eventArgs?.map((project: any) => {
      if (!project?.checked) {
        standloneIds.ids.push(project?.id);
        standloneIds.projects.push(project);
      }
    });
    this.selectedStandaloneProjectsIds = standloneIds.ids;
    this.standaloneProjectsIds = standloneIds.projects;
    if (
      this.notSelectedWorkspacesProjectsIds?.length > 0 ||
      this.selectedWorkspacesIds?.length > 0 ||
      this.selectedStandaloneProjectsIds?.length > 0
    ) {
      this.removeAssignedProjectError = false;
    } else {
      this.removeAssignedProjectError = true;
    }
  }
  // unsubscribe observables on component destroy
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
  navigateToProfilePage(id:any){
    this.globalService.getPermissionProfile(id.toString()).subscribe((res: any) => {
      if(res && res.success){
        if(id){
        this.router.navigate(['/users/profile', Encryption._doEncrypt(id.toString())]);
        this.employeeId = id;
        this.getUserProfileData();
        }
      }else{
        this.snackBar.openFromComponent(SnackbarComponent, {
          data: {
            message: res?.message ? res?.message : 'Something went wrong, please try again.',
          },
        });
      }
    });

  }
  getParamsData(){
    const userId = this.activatedRoute.snapshot.paramMap.get('id') || '';
    this.params_user_id = userId ? +Encryption._doDecrypt(userId) : '';
    const userData = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string));
    this.loggedInUserId = userData.user_id;
    this.employeeId = userId ? +Encryption._doDecrypt(userId) : userData.user_id;
    this.encUser_id = Encryption._doEncrypt(this?.loggedInUserId?.toString());
  }
}
