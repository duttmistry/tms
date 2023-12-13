import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { map, shareReplay } from 'rxjs/operators';

import { Observable } from 'rxjs';
import { environment } from 'apps/angular/main-app/src/environments/environment';
import { ISingleWorkspaceDataModel, IWorkspaceResponseModel } from '../../../model/workspace/workspace.model';
import { Encryption } from '@tms-workspace/encryption';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  //#region properties
  _base_url = environment.base_url;
  _workspace_url = environment.workspace_url;
  _single_url = environment.single_url;
  //#endregion
  constructor(private httpClient: HttpClient) {}

  getWorkspace(params: any): any {
    return this.httpClient
      .get<IWorkspaceResponseModel>(this._base_url + this._workspace_url + '/v2', {
        params,
      })
      .pipe(map((res: any) => res.data));
  }

  getWorkspaceListForFilter() {
    // return this.httpClient.get<IWorkspaceResponseModel>(this._base_url + this._workspace_url + '/project/filterdropdown');
    return this.httpClient.get<IWorkspaceResponseModel>(this._base_url + 'workspace/project/filterdropdown');
  }

  getAllWorkspaceForDropdown(): any {
    return this.httpClient
      .get<IWorkspaceResponseModel>(this._base_url + this._workspace_url + '/v2', {
        headers: {
          isdropdown: 'true',
        },
      })
      .pipe(map((res: any) => res.data));
  }

  getWorkspaceById(id: string): Observable<ISingleWorkspaceDataModel> {
    return this.httpClient
      .get<any>(this._base_url + this._workspace_url + '/' + this._single_url, {
        headers: {
          id: Encryption._doEncrypt(id),
        },
      })
      .pipe(map((res) => res.data));
  }

  updateWorkspaceStatus(workspace_id: string) {
    return this.httpClient.put(this._base_url + this._workspace_url + '/activeStatus', '', {
      headers: {
        id: workspace_id,
      },
    });
  }

  addWorkspace(body: any) {
    return this.httpClient.post<any>(this._base_url + this._workspace_url, body);
  }

  updateWorkspaceById(id: string, body: any) {
    return this.httpClient.put<any>(this._base_url + this._workspace_url, body, {
      headers: {
        id: Encryption._doEncrypt(id),
      },
    });
  }

  // deleteWorkspaceById(id: string) {
  //   return this.httpClient.delete<any>(this._base_url + this._workspace_url, {
  //     headers: {
  //       id: Encryption._doEncrypt(id),
  //     },
  //   });
  // }

  getWorkspaceProjectCount() {
    return this.httpClient.get(this._base_url + this._workspace_url + '/project' + '/count');
  }

  getWorkspaceForDropdown(params?: any): any {
    return this.httpClient.get<any>(this._base_url + this._workspace_url + '/dropdown', { params: params });
  }
}
