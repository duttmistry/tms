import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { asBlob } from 'html-docx-js-typescript';
import { saveAs } from 'file-saver';

@Component({
  selector: 'pkg-lib-document-list',
  templateUrl: './lib-document-list.component.html',
  styleUrls: ['./lib-document-list.component.scss'],
})
export class LibDocumentListComponent implements OnInit, OnChanges {
  @Input() documentList: any;
  @Input() documentData: any;
  @Input() teamMembersList: any;
  @Input() isDisableEditDocuments = false;
  isEditDocumentDisabled = false;
  isShowEditor = false;
  @Output() editEmitter: EventEmitter<any> = new EventEmitter();
  @Output() deleteEmitter: EventEmitter<any> = new EventEmitter();
  @Output() emmitSharedTeamMember: EventEmitter<any> = new EventEmitter();
  @Input() loggedInUser: any;
  emitterDataObject: any = {};
  isShowShareWithTeam = true;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    this.teamMembersList = [...this.teamMembersList];
    if (changes['documentList']) {
      if (changes['documentList'].currentValue && changes['documentList'].currentValue.length > 0) {
        if (changes['documentList'].currentValue[0].id) {
          const findDocumentIndex = this.documentList.findIndex(
            (documentObject: any) => documentObject.id == changes['documentList'].currentValue[0].id
          );
          if (findDocumentIndex > -1) {
            this.documentList[findDocumentIndex].authorized_users = changes['documentList'].currentValue[0].authorized_users;
          }
        }
      }
    }
    if (changes['loggedInUser']) {
      this.loggedInUser = changes['loggedInUser'].currentValue || '';
    }
    // check for isDisableEditDocuments
    if (changes['isDisableEditDocuments']) {
      if (changes['isDisableEditDocuments'].currentValue === true) {
        this.isEditDocumentDisabled = true;
      } else if (changes['isDisableEditDocuments'].currentValue === false) {
        this.isEditDocumentDisabled = false;
      }
    }
  }

  onEditDoc(editorData: any) {
    if (editorData) {
      this.emitterDataObject.editorData = editorData;
      this.editEmitter.emit(this.emitterDataObject);
    }
  }
  async onDocumentDownload(doc: any) {
    const converted: any = await asBlob(doc.content, {
      orientation: 'landscape',
      margins: { top: 720 },
    });
    const toBeDownloadedData = converted;
    if (toBeDownloadedData) {
      saveAs(toBeDownloadedData, 'test.docx');
    }
  }

  onDeleteDocument(doc: any) {
    this.deleteEmitter.emit({
      id: doc.id,
    });
  }

  emmitSharedTeam(event: any, document: any) {
    // emit to add project
    if (document) {
      const requestBody = {
        id: document.id || '',
        teamMembers: event || [],
      };
      this.emmitSharedTeamMember.emit(requestBody);
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
