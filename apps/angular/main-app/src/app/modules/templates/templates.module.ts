import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TemplatesRoutingModule } from './templates-routing.module';
import { MessagingTemplatesComponent } from './messaging-templates/messaging-templates.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { TemplateListComponent } from './template-list/template-list.component';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { QuillModule } from 'ngx-quill';
import { WorkflowComponent } from './workflow/workflow.component';
import { CKEditorModule } from 'ckeditor4-angular';

@NgModule({
  declarations: [MessagingTemplatesComponent, TemplateListComponent, WorkflowComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TemplatesRoutingModule,
    CKEditorModule,
    FormsModule,
    UiMaterialControlsModule,
    SharedModule,
    AngularEditorModule,
    QuillModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class TemplatesModule { }
