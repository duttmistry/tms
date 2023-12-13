import { Component } from '@angular/core';

@Component({
  selector: 'main-app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.scss'],
})
export class DocumentListComponent {
  isShowDocumentModal = false;
  isEditDocument = false;
  documentData: any = {};
  documentList: any = [];

  addDocument() {
    this.documentData = '';
    this.isShowDocumentModal = true;
  }

  onModalClose(event: any) {
    this.isShowDocumentModal = event.isModalOpen;
    if (event.editorData) {
      if (this.isEditDocument) {
        if (this.documentData && this.documentData.id) {
          const findIndex = this.documentList.findIndex(
            (document: any) => document.id == this.documentData.id
          );
          if (findIndex > -1) {
            this.documentList[findIndex].content = event.editorData;
            this.documentList[findIndex].plainTextData = event.plainTextData;
          }
        }
      } else {
        this.documentList.push({
          id: this.documentList.length + 1 + '',
          content: event.editorData,
          plainTextData: event.plainTextData,
        });
      }
      this.isEditDocument = false;
      this.documentData = '';
    }
  }

  onEditDocument(event: any) {
    if (event.editorData) {
      this.documentData = event.editorData;
      this.isEditDocument = true;
      this.isShowDocumentModal = true;
    }
  }
}
