import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DocumentsRoutingModule } from './documents-routing.module';
import { DocumentListComponent } from './document-list/document-list.component';
import { PkgProjectDocumentsModule } from '@tms-workspace/project-documents';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
@NgModule({
  declarations: [DocumentListComponent],
  imports: [
    CommonModule,
    DocumentsRoutingModule,
    PkgProjectDocumentsModule,
    UiMaterialControlsModule,
  ],
})
export class DocumentsModule {}
