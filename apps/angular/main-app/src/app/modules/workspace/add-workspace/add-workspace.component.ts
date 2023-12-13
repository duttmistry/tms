import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef, Input, HostListener } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription, interval } from 'rxjs';
import { environment } from '../../../../../src/environments/environment';
import { ISingleWorkspaceDataModel } from '../../../core/model/workspace/workspace.model';
import { ITeamMembersData } from '../../../core/model/projects/project.model';
import { WorkspaceService } from '../../../core/services/module/workspace/workspace.service';
import { DocumentsService } from '../../../core/services/module/documents/documents.service';
import { GlobalService } from '../../../core/services/common/global.service';
import { Encryption } from '@tms-workspace/encryption';
import { ResponsiblePersonComponent } from '../../../shared/components/responsible-person/responsible-person.component';
import { TeamMemberDialogComponent } from '../../../shared/components/team-member-dialog/team-member-dialog.component';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { MatDialog } from '@angular/material/dialog';
import { StorageService } from '../../../core/services/common/storage.service';
import { LoginService } from '../../../core/services/login/login.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ACTION_CONSTANTS, MODULE_CONSTANTS, PERMISSION_CONSTANTS, STORAGE_CONSTANTS } from '../../../core/services/common/constants';
import { UserService } from '../../../core/services/module/users/users.service';
import { DisableWorkspaceDialogComponent } from '../disable-workspace-dialog/disable-workspace-dialog.component';

@Component({
  selector: 'app-add-workspace',
  templateUrl: './add-workspace.component.html',
  styleUrls: ['./add-workspace.component.scss'],
})
export class AddWorkspaceComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('teamMembers')
  teamMembersComp!: TeamMemberDialogComponent;

  @ViewChild('responsiblePersonRef')
  responsiblePersonComp!: ResponsiblePersonComponent;
  @ViewChild('avatarFileInput', { static: false }) avatarFileInput!: ElementRef;
  @ViewChild('fileDropRef', { static: false }) documentInput!: ElementRef;

  workspaceId: string | null = null;
  ckeConfig: any
  basicDetailsForm!: FormGroup;
  teamMembersForm!: FormGroup;
  isFormSubmitted = false;
  notesControl!: FormControl;
  teamMembersData: any = [];
  baseUrl = environment.base_url;
  editDocumentsResData: any = [];
  teamIds!: any;
  workspaceDocuments: any = [];
  deletedDocuments: any = [];
  avatarFile: File | null = null;

  editWorkspaceResData!: ISingleWorkspaceDataModel;
  editAvatarResData: string | null = null;
  subscriptions: Subscription[] = [];
  @Input()
  unlinkedProjectList!: any;

  @Input()
  teamMembersList: any;
  responsiblePerson: number | null = null;
  documentFile: any;
  actionPermissionData: any;
  isDisabledAvatarImage = false;
  isResponsiblePersonDisabled = false;
  isDisabledDocuments = false;
  angularEditorSouce = interval(500);
  angularEditorSubscription!: Subscription;
  QuillConfiguration = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // toggled buttons
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['clean'], // remove formatting button
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ font: [] }],
      [{ align: [] }],
    ],
  };
  notesContent: any = "";
  userRole: any;
  quillConfiguration = this.QuillConfiguration;
  @ViewChild('fileDropRef') fileDropRef: any;

  constructor(
    private formBuilder: FormBuilder,
    private workspaceService: WorkspaceService,
    private _snackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private permissionService: PermissionService,
    private documentService: DocumentsService,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog,
    private globalService: GlobalService,
    private storageService: StorageService,
    private loginService: LoginService,
    private spinnerService: SpinnerService,
    private userService: UserService
  ) {
    this.workspaceId = this.activatedRoute.snapshot.paramMap.get('id');
    this.setFieldPermission();
    this.initializeFormControls();
  }

  ngOnInit(): void {
    window.scroll(0, 0);
    // fill data for Link Project field in form

    const user = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string));
    this.userRole = user.user_role;

    this.ckeConfig = {
      stylesSet: [
        { name: 'Italic', element: 'em' },
        { name: 'Subtitle', element: 'h2', attributes: { class: 'subtitle' } },
        { name: 'SpecialContainer', element: 'div', styles: { 'background-color': '#EEEEEE', 'font-size': '20px' } },
        { name: 'big', element: 'big' },
        { name: 'small', element: 'small' },
        { name: 'typewriter', element: 'tt' },
        { name: 'computerCode', element: 'code' },
        { name: 'keyboardPhase', element: 'kbd' },
        { name: 'sampleText', element: 'samp' },
        { name: 'variable', element: 'var' },
        { name: 'deletedText', element: 'del' },
        { name: 'insertedText', element: 'ins' },
        { name: 'citedWork', element: 'cite' },
        { name: 'inlineQuotation', element: 'q' },
      ],
      toolbar: [
        ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-'],
        ['Undo', 'Redo'],
        ['NumberedList', 'BulletedList', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
        ['Image', 'Table'],
        ['Styles', 'Format', 'Font', 'FontSize'],
        ['TextColor', 'BGColor'],
      ],
      extraPlugins: 'uploadimage',
      uploadUrl: `${environment.base_url}project/upload/file`,

      // Configure your file manager integration. This example uses CKFinder 3 for PHP.
      filebrowserBrowseUrl: `${environment.base_url}project/upload/file`,
      filebrowserImageBrowseUrl: `${environment.base_url}project/upload/file`,
      filebrowserUploadUrl: `${environment.base_url}project/upload/file`,
      filebrowserImageUploadUrl: `${environment.base_url}project/upload/file`,
    };
  }
  ngAfterViewInit(): void {
    this.initializeEditWorkspaceData();
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
  updateWorkspaceStatus() {
    if (this.workspaceId && this.editWorkspaceResData) {
      const dialogRef = this.dialog.open(DisableWorkspaceDialogComponent, {
        width: '550px',
        data: {
          title:
            this.editWorkspaceResData.is_active == false
              ? `Are you sure you want to proceed with activating workspace?`
              : `Deactivating workspace will close all the ongoing projects running under it and complete all their tasks. Are you sure you want to proceed?`,
          is_active: this.editWorkspaceResData.is_active,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.workspaceService
            .updateWorkspaceStatus(Encryption._doEncrypt(this.workspaceId ? this.workspaceId.toString() : ''))
            .subscribe((res: any) => {
              this.editWorkspaceResData.is_active = res.data.is_active;

              this._snackBar.openFromComponent(SnackbarComponent, {
                data: { message: res.message },
                duration: 45000,
              });
            });
        }
      });
    }
  }
  setFieldPermission() {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));

      if (this.workspaceId) {
        this.actionPermissionData = this.permissionService.getModuleActionPermissionData(
          permission,
          MODULE_CONSTANTS.WORKSPACE,
          ACTION_CONSTANTS.EDIT
        );
      } else {
        this.actionPermissionData = this.permissionService.getModuleActionPermissionData(
          permission,
          MODULE_CONSTANTS.WORKSPACE,
          ACTION_CONSTANTS.CREATE
        );
      }
    } else {
      this.loginService.logout();
    }
  }

  selectAllProjectStatus() {
    this._basicDetailsForm['linkedProject'].patchValue([...this.unlinkedProjectList]);
  }
  clearAllProjectStatus() {
    this._basicDetailsForm['linkedProject'].reset();
  }

  initializeFormControls() {
    this.basicDetailsForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.pattern(/[a-zA-Z0-9]/), Validators.minLength(3), Validators.maxLength(125)]],
      linkedProject: [[]],
      description: [''],
    });

    this.notesControl = new FormControl('');

    // disable controls if permission is false for control
    // check for workspace title
    const titleObject: any = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['title'] !== undefined);
    titleObject && !titleObject.title ? (titleObject?.is_required ? '' : this._basicDetailsForm['title']?.disable()) : '';

    // check for project linked
    const linkedProjectObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['projects'] !== undefined);
    linkedProjectObject && !linkedProjectObject.projects
      ? linkedProjectObject.is_required
        ? ''
        : this._basicDetailsForm['linkedProject'].disable()
      : '';

    // check for avatar image
    const avatarImageObject: any = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['avatar'] !== undefined);
    avatarImageObject && !avatarImageObject.avatar ? (avatarImageObject.is_required ? '' : (this.isDisabledAvatarImage = true)) : false;

    // check for description
    const descriptionObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['description'] !== undefined);
    descriptionObject && !descriptionObject.description ? (descriptionObject.is_required ? '' : this._basicDetailsForm['description'].disable()) : '';

    // check if team is false then disable responsible person control and team members
    const teamObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['team'] !== undefined);
    if (teamObject && !teamObject.team) {
      if (!teamObject.is_required) {
        this.isResponsiblePersonDisabled = true;
      }
      // above field (isResponsiblePersonDisabled) same applied to team members
    }

    // check for documents
    const documentObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['documents'] !== undefined);
    if (documentObject && !documentObject.documents) {
      if (!documentObject.is_required) {
        this.isDisabledDocuments = true;
      }
    }

    // check for Notes
    const notesObject = this.actionPermissionData.fields.find((fieldObject: any) => fieldObject['notes'] !== undefined);
    if (notesObject && !notesObject.notes) {
      if (!notesObject.is_required) {
        this.notesControl.disable();
        this.quillConfiguration.toolbar = [];

        this.angularEditorSubscription = this.angularEditorSouce.subscribe((response: any) => {
          const toolBarContainer = document.querySelectorAll('.ql-toolbar');
          if (toolBarContainer && toolBarContainer[0]) {
            toolBarContainer[0].remove();
          }
          const editorAreaElement: any = document.querySelectorAll('.ql-editor');
          if (editorAreaElement && editorAreaElement[0]) {
            editorAreaElement[0].style.cursor = 'not-allowed';
          }
          this.angularEditorSubscription.unsubscribe();
          // }
        });
      }
    } else if (notesObject && notesObject.notes) {
      this.notesControl.enable();
      this.quillConfiguration = this.QuillConfiguration;
    }
  }

  get _basicDetailsForm() {
    return this.basicDetailsForm.controls;
  }

  // for set value in form while edit workspace
  initializeEditWorkspaceData() {
    if (this.workspaceId) {
      this.spinnerService.showSpinner();
      this.workspaceId = Encryption._doDecrypt(this.workspaceId) as string;
      this.subscriptions.push(
        this.workspaceService.getWorkspaceById(this.workspaceId).subscribe(
          (data: any) => {
            this.spinnerService.hideSpinner();
            this.editWorkspaceResData = data;
            this.editDocumentsResData = data.documents;
            this.editAvatarResData = data.avatar;
            // this.teamMembersComp.selectedTeamMembers([data.created_by]);

            this.basicDetailsForm.patchValue({
              title: data.title,
              linkedProject: this.unlinkedProjectList.filter((project: any) => data.workspaceProject.find((p: any) => p.project_id == project.id)),
              description: data.description,
            });
            this.notesContent = data?.notes ? data?.notes : "";
            if (data.notes) {
              this.notesControl.setValue(data.notes);
              // console.log('this.notesContent: ', this.notesContent);
            }

            if (data.team && data.team.length > 0) {
              let ids = data.team.map((res: any) => res.user_id);

              this.teamMembersComp.selectedTeamMembers(ids);
            }
            this.responsiblePersonComp.selectedRP(data.responsible_person);
          },
          (error) => {
            this.spinnerService.hideSpinner();
          }
        )
      );
    } else {
      // let id = this.userService.getLoggedInUserId();
      // this.teamMembersComp.selectedTeamMembers([id]);

      // add super admin users in team while creating workspace
      let superAdmins = this.teamMembersList.filter((item: any) => item.user_with_role.role_id == 1);
      this.teamMembersComp.selectedTeamMembers(superAdmins.map((item: any) => item.id));
    }
  }

  // handle team members -------------------------------------------start------------------------------------

  getSelectedTeamMembers(event: any) {
    if (this.workspaceId && this.editWorkspaceResData) {
      let m = this.editWorkspaceResData.team.find((member: any) => member.user_id == event.id);
      if (m) {
        this.teamMembersData.push({
          user: event,
          report_to: m.report_to,
        });
      } else {
        this.teamMembersData.push({
          user: event,
          report_to: [],
        });
      }
    } else {
      this.teamMembersData.push({
        user: event,
        report_to: [],
      });
    }
  }

  getDeletedTeamMembers(data: ITeamMembersData) {
    let index = this.teamMembersData.findIndex((item: any) => item.user.id == data.id);
    if (index !== -1) {
      this.teamMembersData.splice(index, 1);
    }

    this.teamMembersData.forEach((item: any, index: number) => {
      let i = item.report_to.findIndex((rep_id: any) => rep_id == data.id);
      if (i !== -1) {
        this.teamMembersData[index].report_to.splice(i, 1);
        this.teamMembersData[index].report_to = [...this.teamMembersData[index].report_to];
        // console.log(this.teamMembersData[index].report_to);
      }
    });

    // console.log('delete', this.teamMembersData);
  }

  removeTeamMember(id: number) {
    this.teamMembersComp.remove(id);
  }

  getSelectedReportingPerson(event: any, id: number) {
    // console.log(event, id);

    let index = this.teamMembersData.findIndex((memeber: any) => memeber.user.id == id);
    if (index !== -1) {
      this.teamMembersData[index].report_to.push(event.id);

      let member = this.teamMembersData.find((member: any) => member.user.id == event.id);
      if (!member) {
        this.teamMembersComp.selectedTeamMembers([event.id]);
      }
    }
  }

  getDeletedReportingPerson(event: any, id: number) {
    // console.log(event, id);

    let index = this.teamMembersData.findIndex((item: any) => item.user.id == id);
    if (index !== -1) {
      let i = this.teamMembersData[index].report_to.findIndex((id: any) => id == event.id);

      if (i !== -1) {
        this.teamMembersData[index].report_to.splice(i, 1);
      }
    }
  }

  getSelectedResponsiblePerson(event: any) {
    if (this.teamMembersData.find((member: any) => member.user.id == event.id)) {
      this.responsiblePerson = event.id;
    } else {
      this.teamMembersComp.selectedTeamMembers([event.id]);

      this.responsiblePerson = event.id;
    }
  }
  //handle team member --------------------------------------------end---------------------------------------

  //   handle documents  --------------------------------------------start---------------------------------------------

  getAndPreviewDocument(file_path: string) {
    this.subscriptions.push(
      this.documentService.getDocumentFile(file_path).subscribe((res) => {
        // console.log(res);

        this.previewFile(res as File);
      })
    );
  }

  previewFile(file: File) {
    const objectURL = URL.createObjectURL(file);
    this.documentFile = this.sanitizer.bypassSecurityTrustUrl(objectURL);

    this.router.navigate([]).then((result) => {
      window.open(this.documentFile.changingThisBreaksApplicationSecurity, '_blank');
    });
  }

  onDragover(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.addDragOverStyles();
  }

  // Dragleave listener
  onDragLeave(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.removeDragOverStyles();
  }

  private addDragOverStyles(): void {
    const dropContainer = document.querySelector('.document-dropzone');
    dropContainer?.classList.add('drag-over');
  }

  private removeDragOverStyles(): void {
    const dropContainer = document.querySelector('.document-dropzone');
    dropContainer?.classList.remove('drag-over');
  }

  // Drop listener
  onDrop(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    // check if permission is granted
    if (!this.isDisabledDocuments) {
      this.removeDragOverStyles();
      if (evt.dataTransfer.files?.length >= 0) {
        for (const file of evt.dataTransfer.files) {
          if (this.workspaceDocuments.find((item: any) => item.name == file.name)) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: `A file with the same name has already been uploaded.` },
              duration: 45000,
            });
            return;
          }
          const isValid =
            this.globalService.checkFileType(file, this.globalService.expectedDocumentsFileTypes) && this.globalService.checkFileSize(file, 5);
          if (isValid) {
            this.workspaceDocuments.push(file);
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

  removeFileWhileEditWorkspace(document_path: string, i: number) {
    this.deletedDocuments.push(document_path);
    this.editDocumentsResData.splice(i, 1);
  }

  removeDocument(i: number) {
    this.documentInput.nativeElement.value = '';
    this.workspaceDocuments.splice(i, 1);
  }

  documentFileBrowseHandler(e: any) {
    const file = e.target.files[0];
    // console.log(file);

    if (e.target.files.length >= 0) {
      for (let file of e.target.files) {
        if (this.workspaceDocuments.find((item: any) => item.name == file.name)) {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: `A file with the same name has already been uploaded.` },
            duration: 45000,
          });
          return;
        }
        let isValid =
          this.globalService.checkFileType(file, this.globalService.expectedDocumentsFileTypes) && this.globalService.checkFileSize(file, 5);

        if (isValid) {
          this.workspaceDocuments.push(file);
        }
      }
    }
  }

  clearFileInput() {
    this.fileDropRef.nativeElement.value = '';
  }

  // handle avatar file --start--
  avatarFileBrowseHandler(e: any) {
    const files = e.target.files;

    if (files[0] instanceof File) {
      if (this.globalService.checkFileType(files[0], this.globalService.expectedAvatarFileTypes) && this.globalService.checkFileSize(files[0], 1)) {
        this.avatarFile = files[0];
      }
    }
  }

  removeAvatarFile() {
    // this.avatarFileInput.nativeElement.value = '';
    this.avatarFile = null;
    this.editAvatarResData = null;
  }

  //handle avatar file --end--

  // handle documents -----------------------------------------end--------------------------------------------------

  // handle submit -----------------------------------------------start------------------------------------------------

  addWorkspace() {
    const formData = new FormData();
    const basicDetailFormValue = this.basicDetailsForm.getRawValue();

    formData.append('title', basicDetailFormValue.title || '');
    formData.append('description', basicDetailFormValue.description || '');

    const project = basicDetailFormValue.linkedProject.map((project: any) => ({
      project_id: project.id,
    }));
    formData.append('project', JSON.stringify(project));

    if (this.avatarFile instanceof File) {
      formData.append('avatarFile', this.avatarFile);
    }
    this.workspaceDocuments.map((file: File) => {
      formData.append('documents', file);
    });

    if (this.notesControl.value) {
      formData.append('notes', this.notesControl.value);
    } else {
      formData.append('notes', '');
    }

    formData.append('responsible_person', this.responsiblePerson ? this.responsiblePerson.toString() : '');

    const team = this.teamMembersData.map((res: any) => {
      return {
        user_id: res.user.id,
        report_to: res.report_to ? res.report_to : [],
      };
    });

    formData.append('team', JSON.stringify(team));
    this.spinnerService.showSpinner();

    this.subscriptions.push(
      this.workspaceService.addWorkspace(formData).subscribe(
        (response) => {
          this.spinnerService.hideSpinner();
          if (response.success) {
            this.router.navigate(['/workspace']);
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: response.message },
              duration: 45000,
            });
          }
        },
        (error) => {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: error.error ? error.error.message : error.message },
            duration: 45000,
          });
          this.spinnerService.hideSpinner();
        }
      )
    );
  }

  updateWorkspace() {
    let formData = new FormData();
    let basicDetailFormValue = this.basicDetailsForm.getRawValue();

    formData.append('title', basicDetailFormValue.title || '');
    formData.append('description', basicDetailFormValue.description || '');
    formData.append('responsible_person', this.responsiblePerson ? this.responsiblePerson.toString() : '');

    this.workspaceDocuments.map((file: File) => {
      formData.append('documents', file);
    });

    if (this.notesControl.value) {
      formData.append('notes', this.notesControl.value);
    } else {
      formData.append('notes', '');
    }

    formData.append('deletedDocuments', JSON.stringify(this.deletedDocuments));
    let project = basicDetailFormValue.linkedProject.map((project: any) => {
      let data = this.editWorkspaceResData.workspaceProject.find((item: any) => {
        if (item.project && item.project.id == project.id) {
          return true;
        } else {
          return false;
        }
      });

      if (data) {
        return {
          id: data.id,
          project_id: project.id,
        };
      } else {
        return {
          project_id: project.id,
        };
      }
    });

    formData.append('project', JSON.stringify(project));
    if (this.editAvatarResData) {
      formData.append('avatar', this.editAvatarResData);
      formData.append('avatarFile', '');
    } else {
      if (this.avatarFile instanceof File) {
        formData.append('avatar', '');

        formData.append('avatarFile', this.avatarFile);
      }
    }

    const team = this.teamMembersData.map((res: any) => {
      let user = this.editWorkspaceResData.team.find((item: any) => item.user_id == res.user.id);
      if (user) {
        return {
          user_id: res.user.id,
          id: user.id,
          workspace_id: this.workspaceId,
          report_to: res.report_to,
        };
      } else {
        return {
          user_id: res.user.id,
          report_to: res.report_to,
        };
      }
    });
    // console.log(team);
    formData.append('team', JSON.stringify(team));
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.workspaceService.updateWorkspaceById(this.workspaceId as string, formData).subscribe(
        (response) => {
          this.spinnerService.hideSpinner();
          if (response.success) {
            this.router.navigate(['/workspace']);
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: response.message },
              duration: 45000,
            });
          }
        },
        (error) => {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: error.error ? error.error.message : error.message },
            duration: 45000,
          });
          this.spinnerService.hideSpinner();
        }
      )
    );
  }

  onSubmit() {
    this.isFormSubmitted = true;
    this.basicDetailsForm.markAllAsTouched();

    // if (this.basicDetailsForm.invalid) {
    //   this._snackBar.openFromComponent(SnackbarComponent, {
    //     data: { message: 'Please fill required and correct data' },
    //     duration: 45000,
    //   });
    //   return;
    // }

    // if (!this.teamMembersData.length) {
    //   this._snackBar.openFromComponent(SnackbarComponent, {
    //     data: { message: 'Please add team members' },
    //     duration: 45000,
    //   });
    //   return;
    // }

    // if (this.responsiblePerson == null) {
    //   this._snackBar.openFromComponent(SnackbarComponent, {
    //     data: { message: 'Please select responsible person' },
    //     duration: 45000,
    //   });
    //   return;
    // }
    if (!this.workspaceId) {
      this.addWorkspace();
    } else {
      this.updateWorkspace();
    }
  }

  navigateToWorkspaceList() {
    //  if (this.basicDetailsForm.dirty || this.teamMembersData.length || this.notesControl.dirty) {

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Are you sure you want to cancel ?`,
      },
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.router.navigate(['/workspace']);
        }
      })
    );
  }

  onTeamMembersClick() {
    // console.log('clicked');
  }
  //handle submit ---------------------------------------------------end-------------------------------------------------]

  //////////////CKEditor Changes //////////////////

  onChange(event: any): void {
    // console.log(event);
    // console.log(this.notesContent);
    this.notesControl.setValue(event);
    // console.log('this.addTaskForm.value', this.notesControl.value);
    //this.log += new Date() + "<br />";
  }




}
