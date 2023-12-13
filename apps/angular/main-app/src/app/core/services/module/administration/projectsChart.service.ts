import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectsChartService {
  _base_url = environment.base_url;
  _get_projects_chart_data = environment.get_projects_chart_data;
  _get_activity_chart_data = environment.get_activity_chart_data;

  constructor(private httpClient: HttpClient) {}

  getProjectsChartData(limit: any) {
    return this.httpClient.get(this._base_url + this._get_projects_chart_data, {
      params: {
        limit: limit ? limit : 10,
      },
    });
  }

  getActivityChartData() {
    return this.httpClient.get(this._base_url + this._get_activity_chart_data);
  }
}
