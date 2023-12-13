import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Input, HostListener, AfterViewInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { map, startWith } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { IWorkspaceListModel } from '../../../core/model/workspace/workspace.model';
import {
  ISingleProjectResDataModel,
  ITagsResModel,
  ProjectKeyRequestBody,
  ProjectKeyResponseModel,
} from '../../../core/model/projects/project.model';
import { environment } from './../../../../environments/environment';
import { ProjectsService } from '../../../core/services/module/projects/projects.service';
import { WorkspaceService } from '../../../core/services/module/workspace/workspace.service';
import { Encryption } from '@tms-workspace/encryption';
import { ResponsiblePersonComponent } from '../../../shared/components/responsible-person/responsible-person.component';
import { TeamMemberDialogComponent } from '../../../shared/components/team-member-dialog/team-member-dialog.component';
import { StorageService } from '../../../core/services/common/storage.service';
import { _doEncrypt } from 'libs/utils/encryption/src/lib/utils-encryption';

import { MatDialog } from '@angular/material/dialog';
import { LoginService } from '../../../core/services/login/login.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import * as moment from 'moment';
import { DocumentsService } from '../../../core/services/module/documents/documents.service';
import { DomSanitizer } from '@angular/platform-browser';
import { GlobalService } from '../../../core/services/common/global.service';
import { UserService } from '../../../core/services/module/users/users.service';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ACTION_CONSTANTS, MODULE_CONSTANTS, PERMISSION_CONSTANTS, STORAGE_CONSTANTS } from '../../../core/services/common/constants';
@Component({
  selector: 'app-add-projects',
  templateUrl: './add-projects.component.html',
  styleUrls: ['./add-projects.component.scss'],
})
export class AddProjectsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('teamMembersDialogRef')
  teamMembersDialogComp!: TeamMemberDialogComponent;

  @ViewChild('fileDropRef', { static: false })
  uploadDocFileInput!: ElementRef;
  @Input()
  workspaceResListData: IWorkspaceListModel[] = [];
  projectId: string | null = null;
  teamMembersChangedManually = false;
  editResProjectData!: ISingleProjectResDataModel;

  basicDetailsForm!: FormGroup;

  teamMembersData: any = [];
  baseUrl = environment.base_url;

  separatorKeysCodes: number[] = [ENTER, COMMA];
  isDateSelectionInvalid = false;
  uploadedDocuments: any = [];
  isDialogOpen = false;

  // handle tags --------------------------------------start---------------------------------------
  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;
  filteredTagsList!: Observable<ITagsResModel[]>;
  selectedTags: any = [];

  @Input()
  allTagsList: ITagsResModel[] = [];
  isFormSubmitted = false;
  subscriptions: Subscription[] = [];
  documentList: any = [];
  isShowDocumentModal = false;
  isEditDocument = false;
  documentData: any = {};
  responsiblePerson: number | null = null;
  @ViewChild('responsiblePersonRef')
  responsiblePersonComp!: ResponsiblePersonComponent;
  temporaryAuthorizedUsersForDocument!: any[];

  projectResponseData: any;
  editResTeamData: any;
  @Input()
  teamMembersList!: any;
  actionPermissionData: any;
  editUploadedDocumentsData: any = [];
  isTagsDisabled = false;
  isResponsiblePersonDisabled = false;
  isDisableAddDocuments = false;
  isDisableEditDocuments: any;
  loggedInUserId!: any;
  @ViewChild('fileDropRef') fileDropRef: any;
  superAdminIds: any;
  constructor(
    private formBuilder: FormBuilder,
    private projectService: ProjectsService,
    private workspaceService: WorkspaceService,
    private _snackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private documentService: DocumentsService,
    private globalService: GlobalService,
    private sanitizer: DomSanitizer,
    private storageService: StorageService,
    public dialog: MatDialog,
    private loginService: LoginService,
    private permissionService: PermissionService,
    private spinnerService: SpinnerService,
    private userService: UserService
  ) {
    this.initializeFormControls();
  }
  ngAfterViewInit(): void {
    this.initializeEditProjectData();
  }

  ngOnInit(): void {
    window.scroll(0, 0);
    this.projectId = this.activatedRoute.snapshot.paramMap.get('id') || null;
    this.filteredTagsList = this._basicDetailsForm['tags'].valueChanges.pipe(
      startWith(null),
      map((tag: any) => (tag ? this._filter(tag) : this.allTagsList.slice()))
    );

    this.setFieldPermission();
    this.getLoggedInUser();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  initializeFormControls() {
    this.basicDetailsForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.pattern(/[a-zA-Z0-9]/), Validators.minLength(3), Validators.maxLength(250)]],
      linkedWorkspace: [''],
      tags: [''],
      startDate: [''],
      estimatedDate: [''],
      projectKey: ['', [Validators.required, Validators.pattern(/[a-zA-Z0-9]/), Validators.minLength(3), Validators.maxLength(8)]],
      description: [''],
    });
  }

  validateDate(e?: any) {
    if (e && e instanceof PointerEvent) {
      e.stopPropagation();
    }

    const startDate = this._basicDetailsForm['startDate'].value || '';
    const estimatedEndDate = this._basicDetailsForm['estimatedDate'].value || '';
    // if (startDate && !estimatedEndDate) {
    //   this._basicDetailsForm['estimatedDate'].setErrors({ isRequired: true });
    // } else if (estimatedEndDate && !startDate) {
    //   this._basicDetailsForm['startDate'].setErrors({ isRequired: true });
    // }

    if (startDate && estimatedEndDate && startDate > estimatedEndDate) {
      this.isDateSelectionInvalid = true;

      this._basicDetailsForm['estimatedDate'].setErrors({ isEndDateLessThanStartDate: true });
    } else {
      this._basicDetailsForm['estimatedDate'].setErrors(null);
      this.isDateSelectionInvalid = false;
    }
  }

  get _basicDetailsForm() {
    return this.basicDetailsForm.controls;
  }

  initializeEditProjectData() {
    if (this.projectId) {
      this.projectId = Encryption._doDecrypt(this.projectId) as string;
      this.spinnerService.showSpinner();
      let encryptedProjectId = Encryption._doEncrypt(this.projectId);
      this.subscriptions.push(
        this.projectService.getProjectById(encryptedProjectId).subscribe(
          (response) => {
            if (response) {
              this.spinnerService.hideSpinner();
              this.editResProjectData = response;

              // this.teamMembersDialogComp.selectedTeamMembers([response.created_by]);

              const tags = response.projectTag.map((tag) => {
                return {
                  id: tag.tag_id,
                  name: tag.tag ? tag.tag.title : '',
                };
              });
              this.selectedTags = tags;
              this.basicDetailsForm.setValue({
                name: response.name,
                linkedWorkspace: response.projectWorkspace?.workspace ? response.projectWorkspace.workspace.id : '',
                tags: '',
                projectKey: response.project_key,
                startDate: response.start_date ? moment(new Date(response.start_date.split('T')[0])) : '',
                estimatedDate: response.estimated_end_date ? moment(new Date(response.estimated_end_date.split('T')[0])) : '',
                description: response.description,
              });
              this._basicDetailsForm['projectKey'].disable();

              this.editResTeamData = response.projectTeam;
              if (this.editResTeamData && this.editResTeamData.length) {
                const ids = this.editResTeamData.map((team: any) => team.user_id);
                this.teamMembersDialogComp.selectedTeamMembers(ids);
              }

              this.responsiblePersonComp.selectedRP(response.responsible_person);
            }
          },
          (error) => {
            this.spinnerService.hideSpinner();
          }
        )
      );

      this.spinnerService.showSpinner();
      this.subscriptions.push(
        this.projectService.getDocumentsByProjectId(this.projectId).subscribe(
          (response) => {
            if (response) {
              if (response.data && response.data.length > 0) {
                response.data.forEach((doc: any) => {
                  if (doc.doc_content || doc.doc_title) {
                    this.documentList.push(doc);
                  } else {
                    this.editUploadedDocumentsData.push(doc);
                  }
                });
              }
              this.spinnerService.hideSpinner();
            }
          },
          (error) => {
            this.spinnerService.hideSpinner();
          }
        )
      );
    } else {
      this.setSuperAdminAsTeamMember();
    }
  }

  setSuperAdminAsTeamMember() {
    // add super admin users in team while creating project
    let superAdmins = this.teamMembersList.filter((item: any) => item.user_with_role.role_id == 1);
    this.superAdminIds = superAdmins.map((item: any) => item.id);
    this.teamMembersDialogComp.selectedTeamMembers(this.superAdminIds);
  }

  setFieldPermission() {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      if (this.projectId) {
        this.actionPermissionData = this.permissionService.getModuleActionPermissionData(permission, MODULE_CONSTANTS.PROJECT, ACTION_CONSTANTS.EDIT);
      } else {
        this.actionPermissionData = this.permissionService.getModuleActionPermissionData(
          permission,
          MODULE_CONSTANTS.PROJECT,
          ACTION_CONSTANTS.CREATE
        );
      }

      // check for permission to disable controls
      // check for project title
      const titleObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['title'] !== undefined);
      titleObject && !titleObject.title ? (titleObject.is_required ? '' : this._basicDetailsForm['name'].disable()) : '';

      // check for link workspace
      const workspaceObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['link_workspace'] !== undefined);
      workspaceObject && !workspaceObject.link_workspace
        ? workspaceObject.is_required
          ? ''
          : this._basicDetailsForm['linkedWorkspace'].disable()
        : '';

      // check for project key
      const projectKeyObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['project_key'] !== undefined);
      projectKeyObject && !projectKeyObject.project_key ? (projectKeyObject.is_required ? '' : this._basicDetailsForm['projectKey'].disable()) : '';

      // check for start date
      const startDateOject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['start_date'] !== undefined);
      startDateOject && !startDateOject.start_date ? (startDateOject.is_required ? '' : this._basicDetailsForm['startDate'].disable()) : '';

      // check for end date
      const endDateObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['end_date'] !== undefined);
      endDateObject && !endDateObject.end_date ? (endDateObject.is_required ? '' : this._basicDetailsForm['estimatedDate'].disable()) : '';

      // check for description
      const descriptionObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['description'] !== undefined);
      descriptionObject && !descriptionObject.description
        ? descriptionObject.is_required
          ? ''
          : this._basicDetailsForm['description'].disable()
        : '';

      // check for tags
      const tagsObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['tag'] !== undefined);
      if (tagsObject && !tagsObject.tag) {
        if (!tagsObject.is_required) {
          this._basicDetailsForm['tags'].disable();
          this.isTagsDisabled = true;
        }
      }

      // check for add documents
      const documentObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['documents'] !== undefined);
      // If Action = create, flag for documents = false, is_required = true => set isDisableAddDocuments = false And if is_required = false, set isDisableAddDocuments = true
      if (this.actionPermissionData.create) {
        if (documentObject && !documentObject.documents) {
          if (documentObject.is_required) {
            this.isDisableAddDocuments = false;
          } else if (!documentObject.is_required) {
            this.isDisableAddDocuments = true;
          }
        }
      }

      if (this.actionPermissionData.update) {
        // If Action = edit, flag for documents = false, is_required = true => set isDisableEditDocuments = true
        if (documentObject && !documentObject.documents) {
          if (documentObject.is_required) {
            this.isDisableEditDocuments = { ...this.isDisableEditDocuments, value: false };
          } else {
            this.isDisableEditDocuments = true;
          }
        }
      }

      // check if team is false then disable responsible person control and team members
      const teamObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['team'] !== undefined);
      if (teamObject && !teamObject.team) {
        if (!teamObject.is_required) {
          this.isResponsiblePersonDisabled = true;
        }
        // above field (isResponsiblePersonDisabled) same applied to team members
      }
    } else {
      this.loginService.logout();
    }
  }

  // handle tags ---------------------------------------start----------------------------------------
  // gets tags data from API

  // push newly created tag
  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    let findIndex;
    this.filteredTagsList.subscribe((tagResponse: any) => {
      if (tagResponse && tagResponse.length > 0) {
        // on add new tag, check if tag already exists with same name, then check to true and push that tag into tags array
        findIndex = tagResponse.findIndex((tagObject: any) => tagObject.name === event.value);
        if (findIndex > -1) {
          const findExistingIndex = this.selectedTags.findIndex((tagObj: any) => tagObj.name === event.value);
          if (findExistingIndex <= -1) {
            this.selectedTags.push(tagResponse[findIndex]);
          }
        }
      }
    });
    // Add our fruit
    if (value && (findIndex == undefined || findIndex <= -1)) {
      this.selectedTags.push({
        id: 999999,
        name: value,
      });
    }

    // Clear the input value
    event.chipInput!.clear();

    this._basicDetailsForm['tags'].setValue(null);
  }

  // remove tag from tags Array
  removeTag(item: any): void {
    const index = this.selectedTags.findIndex((tag: any) => tag.id == item.id);

    if (index >= 0) {
      this.selectedTags.splice(index, 1);
    }
  }

  // add tag if not already there in list
  selectedTag(event: MatAutocompleteSelectedEvent): void {
    const newValue = event.option.value;

    if (this.selectedTags.find((tag: any) => tag.id == newValue.id)) {
      this.selectedTags = [...this.selectedTags.filter((tag: any) => tag.id !== newValue.id)];
    } else {
      this.selectedTags.push(newValue);
    }
    this.tagInput.nativeElement.value = '';
    this._basicDetailsForm['tags'].setValue(null);

    // keep the autocomplete opened after each item is picked.
    // requestAnimationFrame(() => {
    //   this.openAuto(this.matACTrigger);
    // });
  }

  // Keeps the autocomplete open
  // openAuto(trigger: MatAutocompleteTrigger) {
  //   trigger.openPanel();
  //   this.tagInput.nativeElement.focus();
  // }

  private _filter(value: any): any {
    if (!value.id) {
      const filterValue = value.toLowerCase();
      return this.allTagsList.filter((tag: any) => tag.name.toLowerCase().includes(filterValue));
    } else {
      const filterValue = value.name.toLowerCase();

      return this.allTagsList.filter((tag: any) => tag.name.toLowerCase().includes(filterValue));
    }
  }

  checkSelectedItem(item: any) {
    return this.selectedTags.find((res: any) => res.id == item.id) ? true : false;
  }
  // handle tags ---------------------------------------ends----------------------------------------

  // This function is used to validate estimated end date
  // must be greater than start date

  redirectToProjectList() {
    //if (this.basicDetailsForm.dirty || this.teamMembersData.length) {

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Are you sure you want to cancel ?`,
      },
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.router.navigate(['/project']);
        }
      })
    );
  }
  onLinkWorkspace(event: any) {
    if (!this.projectId) {
      this.subscriptions.push(
        this.workspaceService.getWorkspaceById(event.value.toString()).subscribe(
          (res: any) => {
            if (res) {
              // if (this.teamMembersData && this.teamMembersData.length == 0) {
              if (res.team && res.team.length > 0) {
                // temp = res.team.map((member: any) => {
                //   return {
                //     id: member.user.id,
                //     name: (member.user.first_name || '') + ' ' + (member.user.last_name || ''),
                //     avatar: member.user.employee_image || '',
                //   };
                // });
                if (this.teamMembersChangedManually) {
                  const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                    width: '500px',
                    data: {
                      title: `Are you sure you want to override the team members with this workspace's team member?`,
                    },
                  });

                  this.subscriptions.push(
                    dialogRef.afterClosed().subscribe((result) => {
                      if (result) {
                        this.teamMembersChangedManually = false;
                        let filteredTeam =
                          res.team && res.team.filter((team: any) => !this.teamMembersData.find((item: any) => item.user.id == team.user.id));

                        let ids = filteredTeam && filteredTeam.map((member: any) => member.user.id);
                        this.teamMembersDialogComp.data = [];
                        this.teamMembersData = [];
                        this.setSuperAdminAsTeamMember();
                        this.responsiblePersonComp.selectedRP(res.responsible_person);

                        this.teamMembersDialogComp.selectedTeamMembers(ids);
                      }
                    })
                  );
                } else {
                  let filteredTeam =
                    res.team && res.team.filter((team: any) => !this.teamMembersData.find((item: any) => item.user.id == team.user.id));

                  let ids = filteredTeam && filteredTeam.map((member: any) => member.user.id);
                  this.teamMembersDialogComp.data = [];
                  this.teamMembersData = [];

                  this.setSuperAdminAsTeamMember();
                  this.responsiblePersonComp.selectedRP(res.responsible_person);

                  this.teamMembersDialogComp.selectedTeamMembers(ids);
                }

                // this.teamMembersData = res.team.map((member: any) => {
                //   return {
                //     user: {
                //       id: member.user.id,
                //       name: `${member.user.first_name || ''} ${member.user.last_name}`,
                //       avatar: member.user.employee_image,
                //     },
                //     report_to: member.report_to || [],
                //   };
                // });
              }

              // if (!this.teamMembersData.find((member: any) => member.user.id == this.loggedInUserId)) {
              //   this.teamMembersDialogComp.selectedTeamMembers([this.loggedInUserId]);
              // }

              // }
              // if (res.responsible_person) {
              //   if (this.responsiblePerson == null) {
              //     // this.responsiblePerson = res.responsible_person;
              //     this.responsiblePersonComp.selectedRP(res.responsible_person);
              //   }
              // }
            }
          },
          (error) => {
            console.log('error:', error);
          }
        )
      );
    }
  }

  // handle team members section ----------------------------------------start-----------------------------------------------

  getSelectedTeamMembers(event: any) {
    if (this.projectId && this.editResTeamData) {
      const member = this.editResTeamData.find((member: any) => member.user_id == event.id);
      if (member) {
        this.teamMembersDialogComp.selectedTeamMembers(member.report_to);
        this.teamMembersData.push({
          user: event,
          report_to: member.report_to,
        });
        this.teamMembersData = [...this.teamMembersData];
      } else {
        let report_to = [];
        event.teamLead && event.teamLead.id ? report_to.push(event.teamLead.id) : '';
        event.projectManager && event.projectManager.id ? report_to.push(event.projectManager.id) : '';
        this.teamMembersDialogComp.selectedTeamMembers(report_to);
        this.teamMembersData.push({
          user: event,
          report_to: report_to,
        });

        this.teamMembersData = [...this.teamMembersData];
      }
    } else {
      if (event.manuallySelected) {
        this.teamMembersChangedManually = true;
      }
      let report_to = [];
      event.teamLead && event.teamLead.id ? report_to.push(event.teamLead.id) : '';
      event.projectManager && event.projectManager.id ? report_to.push(event.projectManager.id) : '';
      this.teamMembersDialogComp.selectedTeamMembers(report_to);
      this.teamMembersData.push({
        user: event,
        report_to: report_to,
      });

      this.teamMembersData = [...this.teamMembersData];
    }
  }

  getDeletedTeamMembers(event: any) {
    const index = this.teamMembersData.findIndex((item: any) => item.user.id == event.id);
    if (index !== -1) {
      this.teamMembersData.splice(index, 1);
      if (event && event.id) {
        if (event.manuallySelected) {
          this.teamMembersChangedManually = true;
        }
        this.teamMembersData.forEach((teamMemberObject: any) => {
          if (teamMemberObject.report_to && teamMemberObject.report_to.length > 0) {
            const findIndex = teamMemberObject.report_to.findIndex((reportToObject: any) => reportToObject == event.id);
            if (findIndex > -1) {
              teamMemberObject.report_to.splice(findIndex, 1);
              teamMemberObject.report_to = [...teamMemberObject.report_to];
            }
          }
        });
        // this.teamMembersData = [...this.teamMembersData];

        // console.log('teamMembersData', this.teamMembersData);
      }
    }
  }

  removeTeamMember(id: number) {
    this.teamMembersChangedManually = true;
    this.teamMembersDialogComp.remove(id);
  }

  getSelectedResponsiblePerson(event: any) {
    if (event.manuallySelected) {
      this.teamMembersChangedManually = true;
    }

    this.responsiblePerson = event.id;

    if (!this.teamMembersData.find((member: any) => member.user.id == event.id)) {
      this.teamMembersDialogComp.selectedTeamMembers([event.id]);
    }
  }

  getDeletedReportingPerson(rp_user: any, tm_id: number) {
    this.teamMembersChangedManually = true;
    const index = this.teamMembersData.findIndex((item: any) => item.user.id == tm_id);

    if (index !== -1) {
      const responsiblePersonFindIndex = this.teamMembersData[index].report_to.findIndex((id: any) => id == rp_user.id);
      if (responsiblePersonFindIndex > -1) {
        this.teamMembersData[index].report_to.splice(responsiblePersonFindIndex, 1);
      }
    }
  }

  getSelectedReportingPerson(event: any, id: number) {
    this.teamMembersChangedManually = true;
    const index = this.teamMembersData.findIndex((memeber: any) => memeber.user.id == id);
    if (index !== -1) {
      this.teamMembersData[index].report_to.push(event.id);
      const member = this.teamMembersData.find((member: any) => member.user.id == event.id);
      if (!member) {
        this.teamMembersDialogComp.selectedTeamMembers([event.id]);
      }
    }
  }

  // handle team members section ----------------------------------------end-----------------------------------------------

  // handle documents section ------------------------------------start-----------------------------------------

  getAndPreviewDocument(file_path: string) {
    this.subscriptions.push(
      this.documentService.getDocumentFile(file_path).subscribe((res) => {
        this.previewFile(res as File);
      })
    );
  }

  previewFile(file: File) {
    const objectURL = URL.createObjectURL(file);
    let documentFile: any = this.sanitizer.bypassSecurityTrustUrl(objectURL);

    this.router.navigate([]).then((result) => {
      window.open(documentFile.changingThisBreaksApplicationSecurity, '_blank');
    });
  }

  onDragover(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  // Dragleave listener
  onDragLeave(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  // Drop listener
  onDrop(evt: any) {
    // check if add permission is granted
    evt.preventDefault();
    evt.stopPropagation();
    if (!this.isDisableAddDocuments) {
      if (evt.dataTransfer.files?.length >= 0) {
        for (let file of evt.dataTransfer.files) {
          if (this.uploadedDocuments.find((item: any) => item.name == file.name)) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: `The file with the same name already exists.` },
              duration: 45000,
            });
            return;
          }
          let isValid = this.globalService.checkFileType(file, this.globalService.projectUploadDocumentFileTypes);
          if (isValid) {
            this.uploadedDocuments.push(file);
          }
        }
      }
    }
  }

  @HostListener('document:dragover', ['$event'])
  @HostListener('drop', ['$event'])
  onDragDropFileVerifyZone(event: any) {
    event.preventDefault();
    event.dataTransfer.effectAllowed = 'none';
    event.dataTransfer.dropEffect = 'none';
  }

  removeFileWhileEditWorkspace(document: any, i: number) {
    if (document && document.id) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: {
          title: `Are you sure you want to delete?`,
        },
      });

      this.subscriptions.push(
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.spinnerService.showSpinner();
            this.subscriptions.push(
              this.projectService.deleteDocumentByDocumentId(document.id.toString()).subscribe(
                (response: any) => {
                  if (response) {
                    if (response.status === 200) {
                      // splice document from array;
                      if (this.editUploadedDocumentsData && this.editUploadedDocumentsData.length > 0) {
                        this.editUploadedDocumentsData = this.editUploadedDocumentsData.filter((doc: any) => doc.id !== document.id);
                      }
                      this._snackBar.openFromComponent(SnackbarComponent, {
                        data: { message: response.message },
                        duration: 45000,
                      });
                    }
                    this.spinnerService.hideSpinner();
                  }
                },
                (error) => {
                  this.spinnerService.hideSpinner();
                  console.log('error:', error);
                }
              )
            );
          }
        })
      );
    }
  }

  removeDocument(i: number) {
    this.uploadDocFileInput.nativeElement.value = '';
    this.uploadedDocuments.splice(i, 1);
  }

  documentFileBrowseHandler(e: any) {
    // check if add permission is granted
    if (!this.isDisableAddDocuments) {
      if (e.target.files.length >= 0) {
        for (const file of e.target.files) {
          if (this.uploadedDocuments.find((item: any) => item.name == file.name)) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: `The file with the same name already exists.` },
              duration: 45000,
            });
            return;
          }
          const isValid = this.globalService.checkFileType(file, this.globalService.projectUploadDocumentFileTypes);

          if (isValid) {
            this.uploadedDocuments.push(file);
          }
        }
      }
    }
  }

  clearFileInput() {
    this.fileDropRef.nativeElement.value = '';
  }

  onEditDocument(event: any) {
    if (event.editorData) {
      this.documentData = event.editorData;
      this.isEditDocument = true;
      this.isShowDocumentModal = true;
    }
  }

  onModalClose(event: any) {
    // console.log('onModalClose', event, this.documentList);

    // const findIndex = this.documentList.findIndex((document: any) => document.doc_title === event.docTitle);
    // console.log('onModalClose', findIndex);

    // if (findIndex > -1) {
    //   this._snackBar.openFromComponent(SnackbarComponent, {
    //     data: { message: 'document already exist with this title' },
    //     duration: 45000,
    //   });

    //   return;
    // }

    this.isShowDocumentModal = event.isModalOpen;
    if (event.editorData) {
      if (this.isEditDocument) {
        if (this.documentData && this.documentData.id && !this.documentData.id.toString().includes('tempId')) {
          const findIndex = this.documentList.findIndex((document: any) => document.id == this.documentData.id);
          if (findIndex > -1) {
            // update document data

            // check if authorized users are not present that means new document is created so no need to call update document API

            const requestBody = {
              workspace_id: this.documentList[findIndex].workspace_id,
              project_id: this.documentList[findIndex].project_id,
              doc_title: event.docTitle,
              doc_content: event.editorData,
              authorized_users: event.authorized_users
                ? event.authorized_users.map((user: any) => user.id)
                : this.documentList[findIndex].authorized_users,
            };
            this.spinnerService.showSpinner();
            this.projectService.updateProjectByDocumentId(this.documentData.id, requestBody).subscribe(
              (response: any) => {
                if (response) {
                  if (response.status == 200) {
                    this._snackBar.openFromComponent(SnackbarComponent, {
                      data: { message: response.message },
                      duration: 45000,
                    });

                    if (response.data) {
                      this.documentList[findIndex] = response.data;
                    }
                  }
                  this.spinnerService.hideSpinner();
                }
              },
              (error: any) => {
                this.spinnerService.hideSpinner();
                console.log('error:', error);
              }
            );
          }
        } else {
          // replace document object locally.
          const findIndex = this.documentList.findIndex((document: any) => document.id == this.documentData.id);
          if (findIndex > -1) {
            this.documentList[findIndex].id = this.documentData.id || '';
            this.documentList[findIndex].doc_content = event.editorData || '';
            this.documentList[findIndex].authorized_users = event.authorized_users ? event.authorized_users.map((user: any) => user.id) : [];
            this.documentList[findIndex].plainTextData = event.plainTextData || '';
            this.documentList[findIndex].doc_title = event.docTitle || '';
          }
        }
      } else {
        // check if project is in edit mode then directly call create document API
        if (this.projectId) {
          this.documentList.push({
            id: this.documentList.length + 1 + 'tempId',
            doc_content: event.editorData,
            authorized_users: event.authorized_users ? event.authorized_users.map((user: any) => user.id) : [],
            plainTextData: event.plainTextData,
            doc_title: event.docTitle || '',
            isNewDocument: true,
          });
          this.saveDocuments();
        } else {
          this.documentList.push({
            id: this.documentList.length + 1 + 'tempId',
            doc_content: event.editorData,
            authorized_users: event.authorized_users ? event.authorized_users.map((user: any) => user.id) : [],
            plainTextData: event.plainTextData,
            doc_title: event.docTitle || '',
            isNewDocument: true,
          });
        }
      }
      this.isEditDocument = false;
      this.documentData = '';
    } else {
      this.isEditDocument = false;
    }
  }

  openDocumentModal() {
    this.documentData = '';
    this.isShowDocumentModal = true;
  }

  onDeleteDocument(event: any) {
    if (event && event.id) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: {
          title: `Are you sure you want to delete?`,
        },
      });

      this.subscriptions.push(
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            if (event.id && typeof event.id == 'string' && event.id.includes('tempId')) {
              if (this.documentList && this.documentList.length > 0) {
                this.documentList = this.documentList.filter((document: any) => document.id !== event.id);
              }
              return;
            }
            this.spinnerService.showSpinner();
            this.subscriptions.push(
              this.projectService.deleteDocumentByDocumentId(event.id.toString()).subscribe(
                (response: any) => {
                  if (response) {
                    if (response.status === 200) {
                      // splice document from array;
                      if (this.documentList && this.documentList.length > 0) {
                        this.documentList = this.documentList.filter((document: any) => document.id !== event.id);
                      }
                      this._snackBar.openFromComponent(SnackbarComponent, {
                        data: { message: response.message },
                        duration: 45000,
                      });
                    }
                    this.spinnerService.hideSpinner();
                  }
                },
                (error) => {
                  this.spinnerService.hideSpinner();
                  console.log('error:', error);
                }
              )
            );
          }
        })
      );
    }
  }

  getLoggedInUser() {
    const userData: any = this.userService.getUserDataFromLS();
    if (userData.user_id) {
      this.loggedInUserId = userData.user_id;
    }
  }

  //handle documents section---------------------------------------end------------------------------------------

  addProject() {
    const basicDetailFormValue = this.basicDetailsForm.value;

    const teamMembers = this.teamMembersData.map((res: any) => {
      return {
        user_id: res.user.id,
        report_to: res.report_to ? res.report_to : [],
      };
    });
    const tags = this.selectedTags.map((tag: any) => {
      if (tag.id == 999999) {
        return {
          title: tag.name,
        };
      } else {
        return {
          title: tag.name,
        };
      }
    });
    const formData = new FormData();
    formData.append('name', basicDetailFormValue.name || '');
    formData.append('start_date', basicDetailFormValue.startDate ? this.formateDate(basicDetailFormValue.startDate.toDate()) : '');
    formData.append('estimated_end_date', basicDetailFormValue.estimatedDate ? this.formateDate(basicDetailFormValue.estimatedDate.toDate()) : '');
    formData.append('description', basicDetailFormValue.description || '');
    formData.append('team', JSON.stringify(teamMembers));
    formData.append('project_key', basicDetailFormValue.projectKey ? basicDetailFormValue.projectKey.toUpperCase() : null);
    formData.append('workspace_id', basicDetailFormValue.linkedWorkspace || '');
    formData.append('tags', JSON.stringify(tags));
    formData.append('responsible_person', this.responsiblePerson ? this.responsiblePerson.toString() : '');
    // formData.append('avatarFile', 'null');

    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.projectService.addProject(formData).subscribe(
        (response) => {
          if (response) {
            if (response.data) {
              this.projectResponseData = response.data || '';
            }
            if (response.success) {
              this._snackBar.openFromComponent(SnackbarComponent, {
                data: { message: response.message },
                duration: 45000,
              });

              this.spinnerService.hideSpinner();
              this.saveDocuments();
              // this.uploadDocuments(response.data.id);
            }
          }
        },
        (error) => {
          this.spinnerService.hideSpinner();
        }
      )
    );
  }

  formateDate(date: Date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = date.getFullYear();

    return yyyy + '-' + mm + '-' + dd;
  }

  updateProject() {
    const basicDetailFormValue = this.basicDetailsForm.getRawValue();

    const teamMembers = this.teamMembersData.map((team: any) => {
      const data = this.editResTeamData.find((item: any) => item.user_id == team.user.id);
      if (data) {
        return {
          id: data.id,
          project_id: data.project_id,
          user_id: data.user_id,
          report_to: team.report_to,
        };
      } else {
        return {
          user_id: team.user.id,
          project_id: this.projectId,
          report_to: team.report_to,
        };
      }
    });

    const tags = this.selectedTags.map((tag: any) => {
      if (tag.id == 999999) {
        return {
          title: tag.name,
        };
      } else {
        return {
          title: tag.name,
        };
      }
    });

    const formData = new FormData();
    formData.append('name', basicDetailFormValue.name || '');
    formData.append('start_date', basicDetailFormValue.startDate ? this.formateDate(basicDetailFormValue.startDate.toDate()) : '');
    formData.append('estimated_end_date', basicDetailFormValue.estimatedDate ? this.formateDate(basicDetailFormValue.estimatedDate.toDate()) : '');
    formData.append('description', basicDetailFormValue.description || '');
    formData.append('team', JSON.stringify(teamMembers));
    formData.append('project_key', basicDetailFormValue.projectKey ? basicDetailFormValue.projectKey.toUpperCase() : null);
    formData.append('workspace_id', basicDetailFormValue.linkedWorkspace || '');
    formData.append('tags', JSON.stringify(tags));
    formData.append('responsible_person', this.responsiblePerson ? this.responsiblePerson.toString() : '');
    // formData.append('avatarFile', 'null');

    this.spinnerService.showSpinner();

    const encryptedId: any = Encryption._doEncrypt(this.projectId || '');
    this.subscriptions.push(
      this.projectService.updateProject(encryptedId, formData).subscribe(
        (response) => {
          this.spinnerService.hideSpinner();
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: response.message },
            duration: 45000,
          });
          this.saveDocuments();
        },
        (error) => {
          this.spinnerService.hideSpinner();
        }
      )
    );
  }

  saveDocuments() {
    if ((this.documentList && this.documentList.length > 0) || (this.uploadedDocuments && this.uploadedDocuments.length > 0)) {
      const user: any = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA);
      const currentUser = JSON.parse(Encryption._doDecrypt(user));

      const createdDocumentsList: any = [];
      // If !projectId means proejct is being created and all documents are first time created
      let formData = new FormData();
      if (!this.projectId) {
        formData.append('workspace_id', this.projectResponseData.projectWorkspace?.workspace_id || '');
        formData.append('project_id', this.projectResponseData.id || '');

        this.documentList.forEach((document: any) => {
          const documentObject = {
            doc_title: document.doc_title || '',
            doc_content: document.doc_content || '',
            authorized_users: document.authorized_users,
          };
          createdDocumentsList.push(documentObject);
        });
      } else {
        // project is edited and pass only new documents with flag isNewDocument and call create document API
        formData.append(
          'workspace_id',
          this.editResProjectData.projectWorkspace ? this.editResProjectData.projectWorkspace.workspace.id.toString() : ''
        );
        formData.append('project_id', this.editResProjectData.id.toString() || '');

        this.documentList.forEach((document: any) => {
          if (document.isNewDocument) {
            const documentObject = {
              doc_title: document.doc_title || '',
              doc_content: document.doc_content || '',
              authorized_users: document.authorized_users,
            };
            createdDocumentsList.push(documentObject);
          }
        });
      }
      if (createdDocumentsList.length == 0 && this.uploadedDocuments && this.uploadedDocuments.length == 0) {
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: { message: 'The project has been updated successfully.' },
          duration: 45000,
        });
        this.navigateToProjectAfterInterval();
      } else {
        formData.append('createDocuments', JSON.stringify(createdDocumentsList));

        this.uploadedDocuments.forEach((document: File) => {
          formData.append('uploadDocuments', document);
        });
        const teamMembers = this.teamMembersData.map((res: any) => res.user.id);
        formData.append('team_member', JSON.stringify(teamMembers));

        if (formData) {
          this.spinnerService.showSpinner();
          this.subscriptions.push(
            this.projectService.createDocument(formData).subscribe(
              (response) => {
                if (response) {
                  if (response.status == 201) {
                    // if (this.projectId) {

                    //   if (response.data && response.data.length > 0) {
                    //     this.documentList[this.documentList.length - 1] = response.data[0];
                    //   }
                    // } else {
                    //   this.router.navigate(['/project']);
                    // }
                    if (response.data && response.data.length > 0 && this.documentList && this.documentList.length > 0) {
                      response.data.forEach((responseObject: any) => {
                        if (responseObject.doc_title && responseObject.doc_content) {
                          const documentFindIndex = this.documentList.findIndex(
                            (documentObject: any) =>
                              documentObject.doc_content == responseObject.doc_content && documentObject.doc_title == responseObject.doc_title
                          );
                          if (documentFindIndex > -1) {
                            this.documentList[documentFindIndex].id = responseObject.id;
                            this.documentList[documentFindIndex].isNewDocument = false;
                          }
                        }
                      });
                    }
                    if (createdDocumentsList && createdDocumentsList.length > 0) {
                      if (this.projectId) {
                        this._snackBar.openFromComponent(SnackbarComponent, {
                          data: { message: response.message },
                          duration: 45000,
                        });
                      } else {
                        this.navigateToProjectAfterInterval();
                      }
                    } else {
                      this._snackBar.openFromComponent(SnackbarComponent, {
                        data: { message: 'The project has been updated successfully.' },
                        duration: 45000,
                      });
                      this.navigateToProjectAfterInterval();
                    }
                  }
                  this.spinnerService.hideSpinner();
                }
              },
              (error) => {
                console.log(error);
                this.spinnerService.hideSpinner();
              }
            )
          );
        } else {
          this.router.navigate(['/project']);
        }
      }
    } else {
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: `Project has been ${this.projectId ? 'updated' : 'created'} successfully` },
        duration: 45000,
      });
      this.navigateToProjectAfterInterval();
    }

    //update team_members for already uploaded documents

    if (this.editUploadedDocumentsData && this.editUploadedDocumentsData.length) {
      const team = this.teamMembersData.map((res: any) => res.user.id);
      const ids = this.editUploadedDocumentsData.map((doc: any) => doc.id);
      // console.log('editUploadedDocumentsData', this.editUploadedDocumentsData);

      this.projectService
        .updateTeamForUploadedDocuments({
          authorized_users: team,
          documentids: ids,
        })
        .subscribe((res) => {});
    }
  }

  onSubmit() {
    this.isFormSubmitted = true;
    this.basicDetailsForm.markAllAsTouched();

    if (this.basicDetailsForm.invalid) {
      return;
    }

    if (this.isDateSelectionInvalid) {
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'Start date can not be greater than estimated end date' },
        duration: 45000,
      });
      return;
    }
    if (!this.projectId) {
      this.addProject();
    } else {
      this.updateProject();
    }
  }
  // onChangeTag(event: any, tag: any) {
  //   this._basicDetailsForm['tags'].setValue(null);
  //   if (event.checked) {
  //     this.selectedTags.push(tag);
  //   } else if (!event.checked) {
  //     const findIndex = this.selectedTags.findIndex((tagObject: any) => tagObject.id == tag.id);
  //     if (findIndex > -1) {
  //       this.selectedTags.splice(findIndex, 1);
  //     }
  //   }
  // }
  onSelectTag(tag: any) {
    this._basicDetailsForm['tags'].setValue(null);

    if (this.selectedTags.find((item: any) => item.id == tag.id)) {
      const findIndex = this.selectedTags.findIndex((tagObject: any) => tagObject.id == tag.id);
      if (findIndex > -1) {
        this.selectedTags.splice(findIndex, 1);
      }
    } else {
      this.selectedTags.push(tag);
    }
  }

  // Share document with team members
  setSharedTeamMember(teamMembersToBeSharedWith: any) {
    if (teamMembersToBeSharedWith) {
      let requestBody: any = [];
      if (teamMembersToBeSharedWith.teamMembers && teamMembersToBeSharedWith.teamMembers.length > 0) {
        teamMembersToBeSharedWith.teamMembers.forEach((teamMember: any) => {
          if (teamMember && teamMember.id) {
            requestBody.push(teamMember.id);
          }
        });
      }
      const body = {
        authorized_users: requestBody,
      };
      if (teamMembersToBeSharedWith && teamMembersToBeSharedWith.id && !teamMembersToBeSharedWith.id.toString().includes('tempId')) {
        this.spinnerService.showSpinner();
        this.subscriptions.push(
          this.projectService.shareDocumentWithTeamMembers(body, teamMembersToBeSharedWith.id.toString()).subscribe(
            (response: any) => {
              if (response) {
                const findIndex = this.documentList.findIndex((documentObject: any) => documentObject.id == teamMembersToBeSharedWith.id);
                if (findIndex > -1) {
                  this.documentList[findIndex].authorized_users = JSON.stringify(requestBody);
                  this.documentList = [...this.documentList];
                }
                this.spinnerService.hideSpinner();
                if (response.message) {
                  this._snackBar.openFromComponent(SnackbarComponent, {
                    data: { message: response.message || 'Document sharing list has been successfully updated.' },
                    duration: 45000,
                  });
                }
              }
            },
            (error: any) => {
              this.spinnerService.hideSpinner();
            }
          )
        );
      } else {
        // store temporary in Array
        if (teamMembersToBeSharedWith.teamMembers && teamMembersToBeSharedWith.teamMembers.length > 0 && requestBody && requestBody.length > 0) {
          this.temporaryAuthorizedUsersForDocument = requestBody;
          // update authorized users in particular document
          const findIndex = this.documentList.findIndex((documentObject: any) => documentObject.id == teamMembersToBeSharedWith.id);
          if (findIndex > -1) {
            this.documentList[findIndex].authorized_users = requestBody || [];
            if (teamMembersToBeSharedWith.teamMembers && teamMembersToBeSharedWith.teamMembers.length > 0 && requestBody && requestBody.length > 0) {
              this.temporaryAuthorizedUsersForDocument = requestBody;
              // update authorized users in particular document
              const findIndex = this.documentList.findIndex((documentObject: any) => documentObject.id == teamMembersToBeSharedWith.id);
              if (findIndex > -1) {
                this.documentList[findIndex].authorized_users = requestBody || [];
              }
            }
          }
        }
      }
    }
  }

  // This method will not allow user to add space in project key
  onProjectKeyUp() {
    const originalProjectKey = this._basicDetailsForm['projectKey'].value;
    if (originalProjectKey && originalProjectKey.includes(' ')) {
      const projectKeyToBeSet = originalProjectKey.toString().replace(/\s/g, '');
      this._basicDetailsForm['projectKey'].setValue(projectKeyToBeSet);
    }
  }

  // check if the project key entered is already used by other project then show error message
  onProjectKeyBlur() {
    const projectKey = this._basicDetailsForm['projectKey'].value;
    if (projectKey) {
      const projectKeyRequestBody: ProjectKeyRequestBody = {
        key: projectKey,
      };
      this.subscriptions.push(
        this.projectService.checkIfProjectKeyExists(projectKeyRequestBody).subscribe({
          next: (response: ProjectKeyResponseModel) => {
            if (response) {
              if (response.status && response.success) {
                if (
                  !this._basicDetailsForm['projectKey'].hasError('required') &&
                  !this._basicDetailsForm['projectKey'].hasError('minlength') &&
                  !this._basicDetailsForm['projectKey'].hasError('maxlength') &&
                  !this._basicDetailsForm['projectKey'].hasError('pattern')
                ) {
                  this._basicDetailsForm['projectKey'].setErrors(null);
                }
              } else {
                this._basicDetailsForm['projectKey'].setErrors({ duplicateKey: true });
              }
            }
          },
          error: (error: any) => {
            console.log('error:', error);
          },
        })
      );
      // console.log(this._basicDetailsForm['projectKey'].errors);
    }
  }

  navigateToProjectAfterInterval() {
    setTimeout(() => {
      this.router.navigate(['/project']);
    }, 500);
  }
  openAuto(trigger: MatAutocompleteTrigger) {
    trigger.openPanel();
    this.tagInput.nativeElement.focus();
  }
}
