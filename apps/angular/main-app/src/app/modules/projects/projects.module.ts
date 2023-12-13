import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ProjectsComponent } from './projects/projects.component';
import { AddProjectsComponent } from './add-projects/add-projects.component';
import { RouterModule } from '@angular/router';
import { ProjectRoutingModule } from './projects-routing.module';
import { ProjectSettingComponent } from './project-setting/project-setting.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { SharedModule } from '../../shared/shared.module';
import { PkgProjectDocumentsModule } from '@tms-workspace/project-documents';
import { DynamicDirective } from './project-setting/dynamic/dynamic.directive';
import { StatusComponent } from './project-setting/status/status.component';
import { CustomFieldsComponent } from './project-setting/custom-fields/custom-fields.component';
import { AddProjectContainerComponent } from './add-project-container/add-project-container.component';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DefaultMatCalendarRangeStrategy, MAT_DATE_RANGE_SELECTION_STRATEGY } from '@angular/material/datepicker';
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
    ProjectsComponent,
    AddProjectsComponent,
    ProjectSettingComponent,
    AddProjectContainerComponent,
    DynamicDirective,
    StatusComponent,
    CustomFieldsComponent,
  ],
  imports: [
    CommonModule,
    UiMaterialControlsModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule,
    ProjectRoutingModule,
    ColorPickerModule,
    PkgProjectDocumentsModule,
  ],

  exports: [ProjectsComponent],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
      useClass: DefaultMatCalendarRangeStrategy,
    },
  ],
})
export class ProjectsModule {}
