import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddWorkspaceComponent } from './add-workspace/add-workspace.component';
import { WorkspaceComponent } from './workspace/workspace.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { WorkspaceRoutingModule } from './workspace-routing.module';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';

import { AngularEditorModule } from '@kolkov/angular-editor';
import { SharedModule } from '../../shared/shared.module';
import { AddWorkspaceContainerComponent } from './add-workspace-container/add-workspace-container.component';
import { DisableWorkspaceDialogComponent } from './disable-workspace-dialog/disable-workspace-dialog.component';
import { CKEditorModule } from 'ckeditor4-angular';
@NgModule({
  declarations: [AddWorkspaceComponent, DisableWorkspaceDialogComponent, WorkspaceComponent, AddWorkspaceContainerComponent],
  schemas: [NO_ERRORS_SCHEMA],
  imports: [
    CommonModule,
    UiMaterialControlsModule,
    HttpClientModule,
    CKEditorModule,
    FormsModule,
    ReactiveFormsModule,
    AngularEditorModule,
    RouterModule,
    SharedModule,
    WorkspaceRoutingModule,
  ],
})
export class WorkspaceModule { }
