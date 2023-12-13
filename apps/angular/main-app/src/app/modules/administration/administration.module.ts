import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdministrationRoutingModule } from './administration-routing.module';

import { AdministrationLayoutComponent } from './administration-layout/administration-layout.component';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomMatPaginator } from '../../core/services/common/customMatPaginator';
import { ProjectsChartComponent } from './/projects-chart/projects-chart.component';
import { AgChartsAngularModule } from 'ag-charts-angular';
import { ActivityChartComponent } from './activity-chart/activity-chart.component';

@NgModule({
  declarations: [AdministrationLayoutComponent, ProjectsChartComponent, ActivityChartComponent],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: CustomMatPaginator,
    },
  ],
  imports: [
    CommonModule,
    SharedModule,
    AdministrationRoutingModule,
    UiMaterialControlsModule,
    FormsModule,
    ReactiveFormsModule,
    AgChartsAngularModule,
  ],
})
export class AdministrationModule {}
