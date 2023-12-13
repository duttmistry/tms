import { Component, OnInit } from '@angular/core';
import { Utility } from '../../../../core/utilities/utility';
import { DashboardService } from '../../../../core/services/module/dashboard/dashboard.service';
import { error } from 'console';

@Component({
  selector: 'main-app-projects-info',
  templateUrl: './projects-info.component.html',
  styleUrls: ['./projects-info.component.scss'],
})
export class ProjectsInfoComponent implements OnInit {
  //#region Data member
  public projectsData: any;
  public showSpinner = true;
  public totalProjectCount!: number;
  //#endregion

  //#region Component Structure Methods
  constructor(private dashboardService: DashboardService) {}
  ngOnInit(): void {
    this.projectList();
  }

  //#endregion

  //#region For Member Functiom

  //#region for get project list
  public projectList() {
    this.showSpinner = true;
    this.dashboardService.getProjectList().subscribe(
      (response: any) => {
        if (response) {
          if (response.data && response?.data?.list?.length > 0) {
            this.totalProjectCount = response?.data?.totalRecords ? response?.data?.totalRecords : 0;
            this.projectsData = response.data.list.map((proj: any) => ({
              ...proj,
              color: Utility.getLabelColorDetails().color,
            }));
            this.calculatePercentages();
          } else {
            this.projectsData = [];
          }
          this.showSpinner = false;
        } else {
          this.projectsData = [];
          this.showSpinner = false;
        }
      },
      (error: any) => {
        this.showSpinner = false;
      }
    );
  }

  //This method used for calculation percentage
  calculatePercentages(): void {
    for (const project of this.projectsData) {
      const completedTask = project.project_complete_task_count ? project.project_complete_task_count : 0;
      const pandingTask = project.project_pending_task_count ? project.project_pending_task_count : 0;

      if (pandingTask === 0 && completedTask === 0) {
        project.percentage = 0;
      } else {
        project.percentage = this.calculatePercentage(pandingTask, completedTask);
      }
    }
  }
  calculatePercentage(pandingTask: number, completedTask: number): number {
    return +(((completedTask - pandingTask) / completedTask) * 100).toFixed(2);
  }
  //#endregion

  //#endregion
}
