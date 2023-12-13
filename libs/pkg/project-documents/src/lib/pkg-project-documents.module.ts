import { CKEditorModule } from 'ckeditor4-angular';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibDocumentListComponent } from './lib-document-list/lib-document-list.component';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { LibAddDocumentComponent } from './lib-add-document/lib-add-document.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PkgPopupModule } from '@tms-workspace/popup';
import { OverlayModule } from '@angular/cdk/overlay';
import { PkgCustomDirectivesModule } from '@tms-workspace/custom-directives';
import { FormatdatetimePipe } from './formatdatetime/formatdatetime.pipe';
@NgModule({
  imports: [
    CommonModule,
    UiMaterialControlsModule,
    CKEditorModule,
    PkgCustomDirectivesModule,
    FormsModule,
    ReactiveFormsModule,
    PkgPopupModule,
    OverlayModule,
  ],
  declarations: [LibDocumentListComponent, LibAddDocumentComponent, FormatdatetimePipe],
  exports: [LibDocumentListComponent, LibAddDocumentComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class PkgProjectDocumentsModule {}
