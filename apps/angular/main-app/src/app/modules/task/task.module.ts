import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TaskRoutingModule } from './task-routing.module';
import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskHeaderComponent } from './task-header/task-header.component';
import { TaskListComponent } from './task-list/task-list.component';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { TaskBoardComponent } from './task-board/task-board.component';
import { TaskDocumentsComponent } from './task-documents/task-documents.component';
import { TaskLayoutComponent } from './task-layout/task-layout.component';
import { SharedModule } from '../../shared/shared.module';
import { TaskAddComponent } from './task-add/task-add.component';
import { PkgPopupModule } from '@tms-workspace/popup';
import { ColorPickerModule } from 'ngx-color-picker';
import { PkgCustomDirectivesModule } from '@tms-workspace/custom-directives';
import { TaskListTableComponent } from './task-list-table/task-list-table.component';
import { TableCellTagsComponent } from './task-list-table/table-cell-tags/table-cell-tags.component';
import { TableCellStatusComponent } from './task-list-table/table-cell-status/table-cell-status.component';
import { ChangeLogComponent } from './change-log/change-log.component';
import { QuickAddTaskComponent } from './quick-add-task/quick-add-task.component';
import { CommentsComponent } from './comments/comments.component';
import { CommitsComponent } from './commits/commits.component';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DefaultMatCalendarRangeStrategy, MAT_DATE_RANGE_SELECTION_STRATEGY } from '@angular/material/datepicker';
import { ViewUpdateTaskComponent } from './view-update-task/view-update-task.component';
import { ParentTaskListModalComponent } from './parent-task-list-modal/parent-task-list-modal.component';
import { WorkHistoryCommentPopupComponent } from './work-history-comment-popup/work-history-comment-popup.component';
import { CKEditorModule } from 'ckeditor4-angular';
import {MatBadgeModule} from '@angular/material/badge';
const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'MM/DD/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
@NgModule({
  declarations: [
    TaskAddComponent,
    TaskHeaderComponent,
    TaskListComponent,
    TaskBoardComponent,
    TaskDocumentsComponent,
    TaskLayoutComponent,
    TaskListTableComponent,
    TableCellTagsComponent,
    TableCellStatusComponent,
    ChangeLogComponent,
    QuickAddTaskComponent,
    CommentsComponent,
    CommitsComponent,
    ViewUpdateTaskComponent,
    ParentTaskListModalComponent,
    WorkHistoryCommentPopupComponent,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  imports: [
    CommonModule,
    TaskRoutingModule,
    UiMaterialControlsModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    PkgPopupModule,
    ColorPickerModule,
    PkgCustomDirectivesModule,
    CKEditorModule,
    MatBadgeModule
  ],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
      useClass: DefaultMatCalendarRangeStrategy,
    },
  ],
})
export class TaskModule { }
