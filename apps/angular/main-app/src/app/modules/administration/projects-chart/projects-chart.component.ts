import { Component, OnInit } from '@angular/core';
import { AgCartesianSeriesTooltipRendererParams } from 'ag-charts-community';
import { ProjectsChartService } from '../../../core/services/module/administration/projectsChart.service';

@Component({
  selector: 'main-app-tms-workspace-projects-chart',
  templateUrl: './projects-chart.component.html',
  styleUrls: ['./projects-chart.component.scss'],
})
export class ProjectsChartComponent implements OnInit {
  //#region Data member
  public options: any;
  public limit = 10;
  public projectsChartData: any;
  public pageSizeOptions: number[] = [10, 15, 20];

  //#endregion

  //#region Component Structure Methods
  constructor(private projectsChartService: ProjectsChartService) {}

  ngOnInit(): void {
    this.getProjectsChartData();
  }

  //#endregion

  //#region For Member Functiom

  // This method used for get projects chart data
  public getProjectsChartData() {
    this.projectsChartService.getProjectsChartData(this.limit).subscribe((response: any) => {
      if (response) {
        if (response.data && response.data.length > 0) {
          this.projectsChartData = this.preprocessChartData(response.data);
          this.chartsConfiguration();
        } else {
          this.projectsChartData = [];
        }
      } else {
        this.projectsChartData = [];
      }
    });
  }

  //Preprocess the chat data
  private preprocessChartData(data: any[]): any[] {
    return data.map((item) => {
      const processedItem: any = {};
      for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
          const newKey = key.replace(/_/g, ' '); // Replace underscores with spaces
          processedItem[newKey] = item[key];
        }
      }
      return processedItem;
    });
  }

  // This methis used for change page limit
  public selectedPageSizeChange() {
    this.getProjectsChartData();
  }

  // This methos used for chart configuration
  public chartsConfiguration() {
    this.options = {
      data: this.projectsChartData,
      // title: {
      //   text: 'project tasks chart',
      // },
      series: [
        {
          type: 'column',
          xKey: 'name',
          yKey: 'To Do',
          stacked: true,
          fill: '#999999',
          //  showInLegend: false,
          formatter: (params: any) => {
            return {
              fill: params.yKey === 'To Do' ? (params.highlighted ? '' : '#999999') : params.fill,
            };
          },
          tooltip: { renderer: this.rendererTooltip },
        },
        {
          type: 'column',
          xKey: 'name',
          yKey: 'In Progress',
          stacked: true,
          fill: '#4285f4',
          formatter: (params: any) => {
            return {
              fill: params.yKey === 'In Progress' ? (params.highlighted ? '' : '#4285f4') : params.fill,
            };
          },
          tooltip: { renderer: this.rendererTooltip },
        },
        {
          type: 'column',
          xKey: 'name',
          yKey: 'On Hold',
          stacked: true,
          fill: '#fbbc04',
          formatter: (params: any) => {
            return {
              fill: params.yKey === 'On Hold' ? (params.highlighted ? '' : '#fbbc04') : params.fill,
            };
          },
          tooltip: { renderer: this.rendererTooltip },
        },
      ],
      //  legend: { spacing: 2 },
      axes: [
        {
          type: 'category',
          position: 'bottom',
          label: {
            rotation: 30,
          },
        },
        {
          type: 'number',
          position: 'left',
          label: {},
          tick: {
            interval: 10,
          },
        },
      ],
      theme: {
        overrides: {
          column: {
            series: {
              strokeWidth: 0,
              highlightStyle: {
                series: {
                  strokeWidth: 0,
                  dimOpacity: 1,
                },
              },
            },
          },
        },
      },
    };
    // const options = { ...this.options };
    // options.axes[0].label.rotation = 45;
    // this.options = options;
  }

  // This method used for rendering the tooltip
  private rendererTooltip(params: AgCartesianSeriesTooltipRendererParams) {
    return {
      title: params.yKey,
      content: params.xValue + ':' + ' ' + params.yValue.toFixed(0),
    };
  }

  //#endregion
}
