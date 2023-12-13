import { Component, OnInit } from '@angular/core';
import { ProjectsChartService } from '../../../core/services/module/administration/projectsChart.service';

@Component({
  selector: 'main-app-tms-workspace-activity-chart',
  templateUrl: './activity-chart.component.html',
  styleUrls: ['./activity-chart.component.scss'],
})
export class ActivityChartComponent implements OnInit {
  //#region Data member
  options: any;
  public numFormatter = new Intl.NumberFormat('en-US');
  // Map types to colors
  private typeColorMap: { [key: string]: string } = {
    LoggedIn: '#50b432',
    'Not-LoggedIn': '#ed561b',
    'On Leave': '#dddf00',
  };
  public activityChartData: any;
  //#endregion

  //#region Component Structure Methods
  constructor(private projectsChartService: ProjectsChartService) {
    this.chartsConfiguration();
  }

  ngOnInit(): void {
    this.getActivityChartData();
  }

  //#endregion

  //#region For Member Functiom

  // This method used for get projects chart data
  public getActivityChartData() {
    this.projectsChartService.getActivityChartData().subscribe((response: any) => {
      if (response) {
        if (response.data && response.data.length > 0) {
          this.activityChartData = response.data;
          this.chartsConfiguration();
        } else {
          this.activityChartData = [];
        }
      } else {
        this.activityChartData = [];
      }
    });
  }

  // This methos used for chart configuration
  public chartsConfiguration() {
    this.options = {
      autoSize: true,
      data: this.activityChartData,
      series: [
        {
          type: 'pie',
          calloutLabelKey: 'name',
          fillOpacity: 0.9,
          strokeWidth: 0.5,
          angleKey: 'count',
          legendItemKey: 'name',
          calloutLabel: {
            enabled: true,
            formatter: ({ datum }: any) => {
              return `${datum['name']}: ${this.numFormatter.format(datum['count'])}`;
            },
          },
          fills: this.activityChartData?.map((item: any) => this.typeColorMap[item.name]),
          highlightStyle: {
            item: {
              fillOpacity: 0,
              stroke: '#535455',
              strokeWidth: 1,
            },
          },
          tooltip: {
            renderer: ({ datum, calloutLabelKey }: any) => {
              return {
                title: datum['name'],
                content: `${datum[calloutLabelKey]}: ${this.numFormatter.format(datum['count'])}`,
              };
            },
          },
        },
      ],
    };
  }
  //#endregion
}
