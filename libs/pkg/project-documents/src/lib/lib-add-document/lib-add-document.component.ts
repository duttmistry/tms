import {
  Component,
  Input,
  TemplateRef,
  ViewChild,
  OnInit,
  AfterViewInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  Inject,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '@tms-workspace/material-controls';
//const Table = require('@ckeditor/ckeditor5-table');
// const TableCaption = require('@ckeditor/ckeditor5-table/src/tablecaption');
// const TableCellProperties = require('@ckeditor/ckeditor5-table/src/tablecellproperties');
// const TableProperties = require('@ckeditor/ckeditor5-table/src/tableproperties');
// const TableToolbar = require('@ckeditor/ckeditor5-table/src/tabletoolbar');

//https://stackblitz.com/edit/ckeditor5-decoupled-in-angular?file=src%2Fapp%2Fapp.component.html
// declare const require: any;
// const DecoupledEditor = require('@ckeditor/ckeditor5-build-decoupled-document');

@Component({
  selector: 'pkg-lib-add-document',
  templateUrl: './lib-add-document.component.html',
  styleUrls: ['./lib-add-document.component.scss'],
})
export class LibAddDocumentComponent implements OnInit, AfterViewInit, OnChanges {
  name = 'ng2-ckeditor';
  ckeConfig: any;
  mycontent: any;
  log: any = '';
  @ViewChild('ckeditor') ckeditor: any;
  editorData: any = '';
  documentForm!: FormGroup;
  isFormSubmitted = false;
  plainTextData = '';
  emitterDataObject: any = {};
  isShowTeamMemberDialog = false;
  titleAlreadyExist = false;

  isDialogOpen = false;
  // baseUrl = environment.base_url;
  data: any[] = [];
  allData!: any[];
  authorized_users: any;
  displayAuthorizedUsers!: any[];
  isShowShareWithTeam = true;
  @Input() documentList: any;
  @ViewChild('callAPIDialog') callAPIDialog!: TemplateRef<any>;
  @Output() emitDocModal: EventEmitter<any> = new EventEmitter();
  @Output() emmitSelectedTeamMates: EventEmitter<any> = new EventEmitter();
  @Output() emmitDeletedTeamMates: EventEmitter<any> = new EventEmitter();
  @Output() emmitSharedTeamMember: EventEmitter<any> = new EventEmitter();
  @Input() documentData: any = {};
  @Input() teamMembersList: any;
  @Input() loggedInUser: any;
  loggedInUserProp: any;
  authorizedUsersTooltip: any = [];
  config: any;
  private editorInstance: any;
  private environment: any;
  constructor(
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    @Inject('environment')
    environment: any
  ) {
    this.environment = environment;
    // this.config = { placeholder: 'Type the content here!', removePlugins: ['imageUpload', 'mediaEmbed'] };
  }

  ngOnInit() {
    this.initializeForm();
    this.setDisplayAuthorizedUsers(this.documentData.authorized_users);
    this.ckeConfig = {
      toolbar: [
        ['Source', 'Templates', 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat'],
        ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'],
        ['Find', 'Replace', 'SelectAll'],
        [
          'NumberedList',
          'BulletedList',
          '-',
          'Outdent',
          'Indent',
          '-',
          'Blockquote',
          'CreateDiv',
          '-',
          'JustifyLeft',
          'JustifyCenter',
          'JustifyRight',
          'JustifyBlock',
          '-',
          'BidiLtr',
          'BidiRtl',
        ],
        ['Link', 'Unlink', 'Anchor'],
        ['Image', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe'],
        ['Styles', 'Format', 'Font', 'FontSize'],
        ['TextColor', 'BGColor'],
        ['Maximize', 'ShowBlocks'],
      ],
      extraPlugins: 'uploadimage',
      uploadUrl: `${this.environment.base_url}project/upload/file`,

      // Configure your file manager integration. This example uses CKFinder 3 for PHP.
      filebrowserBrowseUrl: `${this.environment.base_url}project/upload/file`,
      filebrowserImageBrowseUrl: `${this.environment.base_url}project/upload/file`,
      filebrowserUploadUrl: `${this.environment.base_url}project/upload/file`,
      filebrowserImageUploadUrl: `${this.environment.base_url}project/upload/file`,
    };
    this.mycontent = this.documentData ? this.documentData.content : '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['loggedInUser'] && changes['loggedInUser'].currentValue) {
      this.loggedInUserProp = changes['loggedInUser'].currentValue;
    }
  }

  initializeForm() {
    this.documentForm = this.formBuilder.group({
      documentControl: [this.documentData ? this.documentData.doc_content : '', Validators.required],
      docTitle: [this.documentData?.doc_title || '', [Validators.required, Validators.maxLength(64)]],
      documentId: this.documentData.id || '',
    });
    this.editorData = this.documentData?.doc_content || '';
  }

  get _form() {
    return this.documentForm.controls;
  }
  get documentFormGetter() {
    return this.documentForm.controls;
  }

  // Initialize ckEditor
  // public onReady(editor: any) {
  //   this.editorInstance = editor;
  //   editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  // }

  ngAfterViewInit() {
    this.editorData = this.documentData ? this.documentData.content : '';
    this.mycontent = this.documentData?.doc_content ? this.documentData.doc_content : '';
    this.openDialog();
  }

  // get data on change event
  public onChange(event: any) {
    // if (this.editorInstance) {
    //   this.plainTextData = this.editorInstance.getData().replace(/(<([^>]+)>)/gi, '');
    // }
    this._form['documentControl'].setValue(event);
  }

  // open the dialog
  openDialog() {
    this.dialog.open(this.callAPIDialog, {
      disableClose: true,
      width: '98%',
      height: '97%',
    });
  }
  // emit data on close if form is valid
  onSaveDocument() {
    this.isFormSubmitted = true;
    this.documentForm.markAllAsTouched();
    if (this.documentForm.valid) {
      const formValue = this.documentForm.getRawValue();
      const findIndex = this.documentList.findIndex(
        (document: any) => document.doc_title === formValue.docTitle && document.id !== formValue.documentId
      );
      if (findIndex > -1) {
        this.titleAlreadyExist = true;
      } else {
        this.emitterDataObject.editorData = formValue.documentControl;
        this.emitterDataObject.plainTextData = this.plainTextData;
        this.emitterDataObject.docTitle = formValue.docTitle || '';
        this.emitterDataObject.authorized_users = this.authorized_users;
        this.emitterDataObject.isModalOpen = false;
        this.emitDocModal.emit(this.emitterDataObject);
        this.dialog.closeAll();
      }
    } else {
      if (this.documentFormGetter['documentControl'].errors?.['required']) {
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: { message: 'Please enter content' },
          duration: 45000,
        });
      }
    }
  }

  // close modal when cancelled
  onCancelClick() {
    this.emitterDataObject.isModalOpen = false;
    this.emitDocModal.emit(this.emitterDataObject);
  }

  onShareDocument() {
    this.isShowTeamMemberDialog = true;
  }

  getSelectedPersonToShare(event: any) {
    console.log('selected event:', event);
  }

  getDeletedPersonToShare(event: any) {
    console.log('deleted event:', event);
  }

  emmitSharedTeam(event: any) {
    const requestBody = {
      id: this.documentData.id || '',
      teamMembers: event || [],
    };
    this.authorized_users = event || [];
    this.emmitSharedTeamMember.emit(requestBody);
    this.setDisplayAuthorizedUsers(this.authorized_users);
  }

  setDisplayAuthorizedUsers(authorized_users: any[]) {
    typeof authorized_users === 'string' ? (authorized_users = JSON.parse(authorized_users)) : '';
    if (authorized_users && authorized_users.length > 0) {
      this.displayAuthorizedUsers = [];
      authorized_users.forEach((userObject: any) => {
        let findIndex = -1;
        if (userObject.id) {
          findIndex = this.teamMembersList.findIndex((teamObject: any) => teamObject.user.id == userObject.id);
        } else {
          findIndex = this.teamMembersList.findIndex((teamObject: any) => teamObject.user.id == userObject);
        }
        if (findIndex > -1) {
          this.displayAuthorizedUsers.push(this.teamMembersList[findIndex].user);
          this.displayAuthorizedUsers[this.displayAuthorizedUsers.length - 1].initials = this.displayAuthorizedUsers[
            this.displayAuthorizedUsers.length - 1
          ].name
            .match(/(^\S\S?|\b\S)?/g)
            .join('')
            .match(/(^\S|\S$)?/g)
            .join('')
            .toUpperCase();
        }
      });
      // add tooltip to show all hidden authorized users
      if (this.displayAuthorizedUsers && this.displayAuthorizedUsers.length > 2) {
        const remainingAuthorizedUsers = this.displayAuthorizedUsers.slice(2);
        if (remainingAuthorizedUsers && remainingAuthorizedUsers.length > 0) {
          remainingAuthorizedUsers.forEach((userObject: any) => {
            this.authorizedUsersTooltip.push(userObject.name);
          });
        }
        if (this.authorizedUsersTooltip && this.authorizedUsersTooltip.length > 0) {
          this.authorizedUsersTooltip = this.authorizedUsersTooltip.join(', ');
        }
      }
    } else {
      this.displayAuthorizedUsers = [];
    }
  }

  // reInitialize component to reset checkbox flags
  // https://app.clickup.com/t/85ztc2f3q
  onPopupCancelled(event: any) {
    if (event && event.isPopupCancelled) {
      this.isShowShareWithTeam = false;
      setTimeout(() => {
        this.isShowShareWithTeam = true;
      }, 0);
    }
  }
}
