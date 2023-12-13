import { Component, ViewChild, OnDestroy, Input, HostListener, Inject, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { TemplateService } from '../../../core/services/module/template/template.service';
import { SnackbarComponent } from '@tms-workspace/material-controls';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { TemplatePreviewComponent } from '../../../shared/components/template-preview/template-preview.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { ACTION_CONSTANTS, PERMISSION_CONSTANTS } from '../../../core/services/common/constants';
import { StorageService } from '../../../core/services/common/storage.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import 'quill-mention';
import 'quill-table';
import Quill from 'quill';
import { QuillEditorComponent } from 'ngx-quill';
import { Location } from '@angular/common';
import htmlEditButton from 'quill-html-edit-button';

@Component({
  selector: 'main-app-messaging-templates',
  templateUrl: './messaging-templates.component.html',
  styleUrls: ['./messaging-templates.component.scss'],
  providers: [{ provide: MAT_DIALOG_DATA, useValue: {} }],
})
export class MessagingTemplatesComponent implements OnInit {
  isEnableTemplate = true;
  templateTitleControl = new FormControl('', Validators.required);
  templateEnableControl = new FormControl(false);
  templateContentControl = new FormControl('', Validators.required);
  templateSubjectControl = new FormControl('', Validators.required);
  chatContentControl = new FormControl('', Validators.required);
  notificationTitleControl = new FormControl('', Validators.required);
  previewContentDialogRef: any = null;
  previewMode = false;
  previewContent = '';
  ckeConfig: any;
  mycontent: any;
  isEditTemplate = false;
  templateId = '';
  allowAdd = false;
  allowEdit = false;
  allowDelete = false;
  dropdownOptions: string[] = [];
  templateData: any = '';
  isTemplateData = false;
  templateText = '';
  // quill Configuration
  atValues: { id: number; value: string }[] = [];
  quill!: Quill;
  quillConfiguration = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      // [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ color: [] }, { background: [] }],
      [{ script: 'sub' }, { script: 'super' }],
      ['link', 'table', 'formula'], // 'image', 'video',
      // ['undo', 'redo'],
      ['clean'],
    ],
    htmlEditButton: {
      debug: true, // logging, default:false
      msg: 'Edit the content in HTML format', //Custom message to display in the editor, default: Edit HTML here, when you click "OK" the quill editor's contents will be replaced
      okText: 'OK', // Text to display in the OK button, default: Ok,
      cancelText: 'Cancel', // Text to display in the cancel button, default: Cancel
      buttonHTML: 'Source', // Text to display in the toolbar button, default: <>
      buttonTitle: 'Show HTML source', // Text to display as the tooltip for the toolbar button, default: Show HTML source
      syntax: false, // Show the HTML with syntax highlighting. Requires highlightjs on window.hljs (similar to Quill itself), default: false
      prependSelector: 'div#myelement', // a string used to select where you want to insert the overlayContainer, default: null (appends to body),
      editorModules: {}, // The default mod
    },
    mention: {
      allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
      mentionDenotationChars: ['@'],
      source: (searchTerm: any, renderList: any) => {
        const mentions = this.dropdownOptions;
        if (searchTerm.length === 0) {
          renderList(mentions, searchTerm);
        } else {
          const matches = mentions.filter((mention: any) => mention.value.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1);
          renderList(
            matches.map((match) => match.replace(/@/g, '')),
            searchTerm
          );
        }
      },
    },
  };

  @ViewChild(QuillEditorComponent, { static: false }) quillEditor!: QuillEditorComponent;
  constructor(
    private templateService: TemplateService,
    private _snackBar: MatSnackBar,
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private storageService: StorageService,
    private permissionService: PermissionService,
    @Inject(MAT_DIALOG_DATA) public data: { content: string },
    private location: Location
  ) {
    // Sanitize and render the HTML content

    this.activatedRoute.params.subscribe((params: any) => {
      if (params && params['id']) {
        this.templateId = Encryption._doDecrypt(params['id']).toString();
        this.isEditTemplate = true;
        this.getTemplateById(this.templateId);
      }
    });
    this.checkForActionPermission();
    this.getVariableList();
    Quill.register({
      'modules/htmlEditButton': htmlEditButton,
    });
  }

  ngOnInit() {
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
        ['Source'],
        ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-'],
        ['Undo', 'Redo'],
        ['NumberedList', 'BulletedList', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
        ['Image', 'Table'],
        ['Styles', 'Format', 'Font', 'FontSize'],
        ['TextColor', 'BGColor'],
      ],
      // extraPlugins: 'uploadimage',
      // uploadUrl: `${environment.base_url}project/upload/file`,

      // // Configure your file manager integration. This example uses CKFinder 3 for PHP.
      // filebrowserBrowseUrl: `${environment.base_url}project/upload/file`,
      // filebrowserImageBrowseUrl: `${environment.base_url}project/upload/file`,
      // filebrowserUploadUrl: `${environment.base_url}project/upload/file`,
      // filebrowserImageUploadUrl: `${environment.base_url}project/upload/file`,
    };
  }
  onClickSaveTemplate() {
    this.isEditTemplate ? this.updateTemplate() : this.createTemplate();
  }

  onClickPreviewTemplate() {
    this.isTemplateData = true;
    this.templateContentControl.patchValue(this.templateData);
    if (this.templateContentControl?.value == '' || this.templateText == '') {
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'Please provide template content' },
        duration: 45000,
      });
    } else if (this.templateText?.replace(/\s/g, '').length == 0) {
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'Template content not allowed only white spaces.' },
        duration: 45000,
      });
    } else {
      // if (this.templateText !== null) {
      //   console.log('The content consists of only whitespace.');
      //   const strippedContent = this.templateText.replace(/\s/g, '');
      //   if (strippedContent.length === 0) {
      //   } else {
      //     console.log('The content contains non-whitespace characters.');
      //   }
      // }
      this.previewMode = !this.previewMode;
      if (this.templateContentControl.valid) {
        const htmlPlainContent = this.templateContentControl.value || '';
        this.previewContentDialogRef = this.dialog.open(TemplatePreviewComponent, {
          width: '500px',
          data: { content: htmlPlainContent },
        });
      }
    }
  }

  createTemplate() {
    // content: this.templateContentControl.value || '',
    this.isTemplateData = true;
    this.templateContentControl.patchValue(this.templateData);
    if (this.templateContentControl?.value == '' || this.templateText == '') {
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'Please provide template content' },
        duration: 45000,
      });
    } else if (this.templateText?.replace(/\s/g, '').length == 0) {
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'Template content not allowed only white spaces.' },
        duration: 45000,
      });
    } else {
      const reqBody = {
        name: this.templateTitleControl.value || '',
        subject: this.templateSubjectControl.value || '',
        content: this.templateContentControl.value || '',
        notificationMessage: this.notificationTitleControl.value || '',
        chatMessage: this.chatContentControl.value || '',
        isActive: this.templateEnableControl.value,
      };
      // console.log('reqBody', reqBody);
      if (this.isValidFormData()) {
        this.templateService.createTemplate(reqBody).subscribe((res: any) => {
          if (res && res.data) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: res.message },
              duration: 45000,
            });
            this.resetControls();
            this.router.navigate(['templates']);
          }
        });
      } else {
        // console.log('isValidFormData');
      }
    }
  }

  updateTemplate() {
    this.isTemplateData = true;
    this.templateContentControl.patchValue(this.templateData);
    if (this.templateContentControl?.value == '' || this.templateText == '') {
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'Please provide template content' },
        duration: 45000,
      });
    } else if (this.templateText?.replace(/\s/g, '').length == 0) {
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'Template content not allowed only white spaces.' },
        duration: 45000,
      });
    } else {
      const reqBody = {
        name: this.templateTitleControl.value || '',
        subject: this.templateSubjectControl.value || '',
        content: this.templateContentControl.value || '',
        notificationMessage: this.notificationTitleControl.value || '',
        chatMessage: this.chatContentControl.value || '',
        isActive: this.templateEnableControl.value,
      };
      if (this.isValidFormData()) {
        this.templateService.updateTemplate(reqBody, this.templateId).subscribe((res: any) => {
          if (res && res.data) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: res.message },
              duration: 45000,
            });
            this.resetControls();
            this.router.navigate(['templates']);
          }
        });
      }
    }
  }

  resetControls() {
    if (this.isEditTemplate == true) {
      this.getTemplateById(this.templateId);
    } else {
      this.templateTitleControl.reset();
      this.templateSubjectControl.reset();
      this.templateContentControl.reset();
      this.notificationTitleControl.reset();
      this.chatContentControl.reset();
      this.templateEnableControl.reset();
    }
  }

  isValidFormData() {
    if (
      this.templateTitleControl.valid &&
      this.templateSubjectControl.valid &&
      this.templateContentControl.valid &&
      this.notificationTitleControl.valid &&
      this.chatContentControl.valid &&
      this.templateEnableControl.valid
    ) {
      return true;
    } else {
      this.templateTitleControl.markAsTouched();
      this.templateSubjectControl.markAsTouched();
      this.templateContentControl.markAsTouched();
      this.notificationTitleControl.markAsTouched();
      this.chatContentControl.markAsTouched();
      return false;
    }
  }

  getTemplateById(id: any) {
    this.templateService.getTemplateById(id).subscribe((res: any) => {
      if (res && res.data) {
        const { data } = res;
        this.templateTitleControl.patchValue(data.name);
        this.templateSubjectControl.patchValue(data.subject);
        this.templateContentControl.patchValue(data.content);
        this.notificationTitleControl.patchValue(data.notificationMessage);
        this.chatContentControl.patchValue(data.chatMessage);
        this.templateEnableControl.patchValue(data.isActive);
        this.templateData = data?.content;
        this.templateText = data?.content;
        // this.mycontent = data?.content;
      }
    });
  }

  checkForActionPermission() {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.allowAdd = this.permissionService.getModuleActionPermission(permission, 'templates', ACTION_CONSTANTS.CREATE);
      this.allowEdit = this.permissionService.getModuleActionPermission(permission, 'templates', ACTION_CONSTANTS.EDIT);
      this.allowDelete = this.permissionService.getModuleActionPermission(permission, 'templates', ACTION_CONSTANTS.DELETE);
    } else {
      this.router.navigate(['unauthorized-access']);
    }
  }

  getVariableList() {
    this.templateService.getVariableList().subscribe((res: any) => {
      // console.log('res dataaa', res.data);

      if (res && res.data) {
        this.dropdownOptions = res.data.map((m: any) => ({ id: m._id, value: m.name }));
      } else {
        this.dropdownOptions = [];
      }
    });
  }

  onDropdownSelectionChange(selectedOption: string) {
    // Handle the selected option as needed
    // You can update the editor's content based on the selected option here
    // console.log('selected variable=>>', selectedOption);
  }

  onEditorContentChange(event: any) {
    // this.templateContentControl.setValue(event.html);
    this.templateData = event.html;
    this.templateText = event.text;
    this.adjustEditorHeight();
  }

  adjustEditorHeight() {
    const quillContainer = document.querySelector('.ql-container') as HTMLElement;
    if (quillContainer) {
      quillContainer.style.minHeight = '130px';
      quillContainer.style.height = 'auto';
    }
  }

  checkContentOnBlur() {
    const div: any = document.createElement('div');

    // div.innerHTML = this._addTaskForm['description'].value.trim();
    // if (div.firstChild && div.firstChild.firstChild.data && div.firstChild.firstChild.data.trim().length == 0) {
    //   this._addTaskForm['description'].reset();
    // }
  }

  goBack() {
    this.location.back();
  }
  ///CK Editor
  onChange(event: any): void {
    console.log(event);
    console.log(this.mycontent);
    this.templateData = event;
    this.templateText = event;
    // this.adjustEditorHeight();
    // this._addTaskForm['description'].setValue(event);
    // console.log('this.addTaskForm.value', this.addTaskForm.value);
    //this.log += new Date() + "<br />";
  }

}
