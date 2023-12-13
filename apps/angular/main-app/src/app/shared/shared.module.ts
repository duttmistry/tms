import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FormatdatePipe } from './pipe/formatdate/formatdate.pipe';

import { UiMaterialControlsModule } from '@tms-workspace/material-controls';

import { DecryptPipe } from './pipe/decrypt/decrypt.pipe';

import { ResponsiblePersonComponent } from './components/responsible-person/responsible-person.component';
import { TeamMemberDialogComponent } from './components/team-member-dialog/team-member-dialog.component';
import { AutoFocusDirective } from './directives/auto-focus-directive/auto-focus-directive.component';
import { FileExtensionPipe } from './pipe/fileext/fileext.pipe';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { StatusPopupComponent } from './components/status-popup/status-popup.component';
import { HoverColorDirective } from './directives/background-color-directive/hover-color.directive';
import { CommentDialogComponent } from './components/comment-popup-dialog/comment-dialog.component';
import { UserDialogComponent } from './components/users-dialog/users-dialog.component';
import { ReplaceDotPipe } from './pipe/replace/replace-dot.pipe';
import { StatePopupComponent } from './components/state-popup/state-popup.component';
import { MatChipsComponent } from './components/mat-chips/mat-chips.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { UnauthorizedAccessComponent } from './components/unauthorized-access/unauthorized-access.component';
import { ReplaceUnderscorePipe } from './pipe/replace/replace-underscore.pipe';
import { PkgCustomDirectivesModule } from '@tms-workspace/custom-directives';
import { QuillModule } from 'ngx-quill';
import { TabKeyDirective } from './directives/tab-key/tab-key.directive';
import { ToggleButtonComponent } from './components/toggle-button/toggle-button.component';
import { StatePipe } from './pipe/state/state.pipe';
import { CommonTableComponent } from './components/common-table/common-table.component';
import { CKEditorModule } from 'ckeditor4-angular';
import { TemplatePreviewComponent } from './components/template-preview/template-preview.component';
import { WorkspaceGroupedProjectSelectionComponent } from './components/workspace-grouped-project-selection/workspace-grouped-project-selection.component';
import { getMonthStringPipe } from './pipe/getMonthString/getMonthString.pipe';
import { LoadingBarModule } from '@ngx-loading-bar/core';
import { ProjectSelectionComponent } from './components/project-selection/project-selection.component';
import { MomentModule } from 'ngx-moment';
import { PGCMenuCenterDirective } from './directives/menu-center/menu-center.directive';
import { UserFilterComponent } from './components/user-filter/user-filter.component';
import { FormatdatetimePipe } from './pipe/formatdatetime/formatdatetime.pipe';
import { TaskStatusPipe } from './pipe/ChangeStatusName/taskStatus.pipe';
import { SearchFilterPipe } from './pipe/searchFilterPipe/search-filter.pipe';
import { replaceHPipe } from './pipe/replaceh/replaceh.pipe';
import { WorkspaceSelectionComponent } from './components/workspace-selection/workspace-selection.component';
import { ElementLoaderComponent } from './components/element-loader/element-loader.component';
import { SpinnerDirective } from './directives/spinner/spinner.directive';
import { hmFormatPipe } from './pipe/hmFormat/hmFormat.pipe';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { CeoSelectComponent } from './components/ceo-select/ceo-select.component';
import { FormatForDisplayTitlePipe } from './pipe/formatForDisplay/format-for-display-title.pipe';
import { RemoveAssignedProjectsDropdownComponent } from './components/remove-assigned-projects-dropdown/remove-assigned-projects-dropdown.component';

@NgModule({
  declarations: [
    ResponsiblePersonComponent,
    FormatdatePipe,
    DecryptPipe,
    StatePipe,
    ConfirmationDialogComponent,
    CommentDialogComponent,
    FileExtensionPipe,
    TeamMemberDialogComponent,
    AutoFocusDirective,
    SpinnerComponent,
    StatusPopupComponent,
    StatePopupComponent,
    HoverColorDirective,
    UserDialogComponent,
    ReplaceDotPipe,
    MatChipsComponent,
    PageNotFoundComponent,
    UnauthorizedAccessComponent,
    ReplaceUnderscorePipe,
    TabKeyDirective,
    ToggleButtonComponent,
    CommonTableComponent,
    TemplatePreviewComponent,
    WorkspaceGroupedProjectSelectionComponent,
    ProjectSelectionComponent,
    getMonthStringPipe,
    PGCMenuCenterDirective,
    UserFilterComponent,
    FormatdatetimePipe,
    TaskStatusPipe,
    SearchFilterPipe,
    replaceHPipe,
    WorkspaceSelectionComponent,
    SpinnerDirective,
    ElementLoaderComponent,
    hmFormatPipe,
    UserDetailsComponent,
    CeoSelectComponent,
    FormatForDisplayTitlePipe,
    RemoveAssignedProjectsDropdownComponent,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  imports: [
    CommonModule,
    UiMaterialControlsModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    PkgCustomDirectivesModule,
    QuillModule,
    MomentModule,
    CKEditorModule,
    LoadingBarModule,
  ],
  exports: [
    FormatdatePipe,
    FileExtensionPipe,
    StatePipe,
    DecryptPipe,
    ResponsiblePersonComponent,
    TeamMemberDialogComponent,
    SpinnerComponent,
    AutoFocusDirective,
    HoverColorDirective,
    StatusPopupComponent,
    StatePopupComponent,
    UserDialogComponent,
    ReplaceDotPipe,
    MatChipsComponent,
    PageNotFoundComponent,
    UnauthorizedAccessComponent,
    ReplaceUnderscorePipe,
    QuillModule,
    TabKeyDirective,
    ToggleButtonComponent,
    CommonTableComponent,
    TemplatePreviewComponent,
    PkgCustomDirectivesModule,
    WorkspaceGroupedProjectSelectionComponent,
    ProjectSelectionComponent,
    getMonthStringPipe,
    LoadingBarModule,
    MomentModule,
    PGCMenuCenterDirective,
    UserFilterComponent,
    TaskStatusPipe,
    FormatdatetimePipe,
    SearchFilterPipe,
    replaceHPipe,
    WorkspaceSelectionComponent,
    SpinnerDirective,
    ElementLoaderComponent,
    hmFormatPipe,
    UserDetailsComponent,
    CeoSelectComponent,
    FormatForDisplayTitlePipe,
    RemoveAssignedProjectsDropdownComponent,
  ],
})
export class SharedModule { }
