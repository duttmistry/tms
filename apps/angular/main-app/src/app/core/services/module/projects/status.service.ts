import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { StatusRequestModel } from '../../../model/projects/status.model';
import { environment } from './../../../../../environments/environment';
import { Encryption } from '@tms-workspace/encryption';

@Injectable({
  providedIn: 'root',
})
export class StatusService {
  _base_url = environment.base_url;
  _project_url = environment.project_url;
  _status_url = environment.status_url;
  constructor(private httpClient: HttpClient) {}

  createStatus(projectId: string, body: StatusRequestModel) {
    return this.httpClient.post(this._base_url + this._project_url + '/' + this._status_url, body, {
      headers: {
        id: projectId,
      },
    });
  }

  getAllState(projectId: string) {
    return this.httpClient.get(this._base_url + this._project_url + '/state', {
      headers: {
        projectid: projectId,
      },
    });
  }

  getAllStatuses(projectId: string) {
    return this.httpClient.get<any>(this._base_url + this._project_url + '/' + this._status_url, {
      headers: {
        id: projectId,
      },
    });
  }

  deleteStatus(statusId: string) {
    return this.httpClient.delete<any>(this._base_url + this._project_url + '/' + this._status_url, {
      headers: {
        id: statusId,
      },
    });
  }

  updateStateColor(body: any) {
    return this.httpClient.put(this._base_url + this._project_url + '/status' + '/color', body);
  }

  updateStatus(projectId: string, statusId: string, body: StatusRequestModel) {
    return this.httpClient.put<any>(this._base_url + this._project_url + '/' + this._status_url, body, {
      headers: {
        id: statusId,
        project_id: projectId,
      },
    });
  }
}
