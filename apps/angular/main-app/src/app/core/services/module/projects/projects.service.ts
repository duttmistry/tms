import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';
import { environment } from './../../../../../environments/environment';
import {
  IAddProjectDataModel,
  IProjectListDataModel,
  IProjectResDataModel,
  ISingleProjectResDataModel,
  ProjectKeyRequestBody,
  ProjectKeyResponseModel,
  ProjectReportRequestBody,
} from '../../../model/projects/project.model';
import { bo } from '@fullcalendar/core/internal-common';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  //#region properties
  _base_url = environment.base_url;
  _project_url = environment.project_url;
  _project_status_url = environment.project_status_url;
  _getprojects_url = environment.getprojects_url;
  _project_by_id_url = environment.project_by_id_url;
  _documents_url = environment.documents_url;
  _create_document_url = environment.create_document_url;
  _update_document_url = environment.update_document_url;
  _document_base_url = environment.document_base_url;
  _delete_document_url = environment.delete_document_url;
  _custom_fields_url = environment.custom_fields;
  _update_authorized_users_url = environment.update_authorized_users_url;
  _bilingconfigrationstatus_url = environment.bilingconfigrationstatus_url;
  _get_project_key_url = environment.get_project_key_url;
  _project_worked_hrs_url = environment.project_worked_hrs_url;
  _task_base_url = environment.task_base_url;
  _get_active_project_list_v2 = environment.get_project_dashboard_active_v2;
  //#endregion
  constructor(private httpClient: HttpClient) {}

  addProject(body: FormData) {
    return this.httpClient.post<any>(this._base_url + this._project_url, body);
  }

  updateProject(itemId: string, body: any) {
    return this.httpClient.put<any>(this._base_url + this._project_url, body, {
      headers: {
        id: itemId,
      },
    });
  }

  getAllProjects() {
    const headers = new HttpHeaders().set('isdropdown', 'true');
    return this.httpClient
      .get<any>(this._base_url + this._project_url, {
        headers,
      })
      .pipe(map((response) => response.data));
  }

  // getActiveProjects({ user_id, limit, page }: any) {
  //   return this.httpClient.get(this._base_url + this._project_url + '/active', {
  //     headers: {
  //       limit,
  //       page,
  //       user_id,
  //     },
  //   });
  // }

  getActiveProjects(userId: any) {
    return this.httpClient.get(this._base_url + this._get_active_project_list_v2, {
      headers: {
        user_id: userId ? userId : '',
      },
    });
  }
  getUnlinkedProjects(workspace_id: string) {
    return this.httpClient.get(this._base_url + this._project_url + '/unlink', {
      headers: {
        workspace_id,
      },
    });
  }

  getProjects(page: any, limit: any): Observable<IProjectResDataModel> {
    return this.httpClient
      .get<any>(this._base_url + this._project_url, {
        params: {
          page,
          limit,
        },
      })
      .pipe(map((response) => response.data));
  }

  getProjectById(id: string): Observable<ISingleProjectResDataModel> {
    const headers = new HttpHeaders().set('isdropdown', 'true').set('id', id);
    return this.httpClient
      .get<any>(this._base_url + this._project_url + '/' + this._project_by_id_url, {
        headers: headers,
      })
      .pipe(map((res) => res.data));
  }
  getProjectsData(params: any, body: any) {
    return this.httpClient.post(this._base_url + this._getprojects_url, body, {
      params: {
        limit: params.limit.toString(),
        page: params.page.toString(),
      },
    });
  }

  updateBillingConfigurationStatus(body: any) {
    return this.httpClient.post(this._base_url + this._project_url + '/' + this._bilingconfigrationstatus_url, body);
  }
  // deleteProject(id: string) {
  //   return this.httpClient.delete<any>(this._base_url + this._project_url, {
  //     headers: {
  //       id: id,
  //     },
  //   });
  // }

  addProjectStatus(body: any) {
    return this.httpClient.post<any>(this._base_url + this._project_status_url, body);
  }

  getProjectBillingConfigurationStatus() {
    return this.httpClient.get;
  }

  createDocument(body: any) {
    return this.httpClient.post<any>(this._document_base_url + this._project_url + '/' + this._documents_url + '/' + this._create_document_url, body);
  }

  getDocumentsByProjectId(projectId: string) {
    return this.httpClient.get<any>(this._document_base_url + this._project_url + '/' + this._documents_url, {
      headers: {
        projectId: projectId,
      },
    });
  }

  updateTeamForUploadedDocuments(body: any) {
    return this.httpClient.put<any>(this._document_base_url + this._project_url + '/' + 'uploadeddocuments' + '/' + 'update', body);
  }

  updateProjectByDocumentId(documentId: string, body: any) {
    return this.httpClient.put<any>(this._document_base_url + this._project_url + '/' + this._documents_url + '/' + this._update_document_url, body, {
      headers: {
        documentid: documentId.toString(),
      },
    });
  }

  deleteDocumentByDocumentId(documentId: string) {
    return this.httpClient.delete(this._document_base_url + this._project_url + '/' + this._documents_url + '/' + this._delete_document_url, {
      headers: {
        documentId: documentId,
      },
    });
  }

  getAllCustomFields(params: any) {
    return this.httpClient.get(
      this._base_url +
        this._custom_fields_url +
        '?page=' +
        params.page +
        '&limit=' +
        params.limit +
        '&sortBy=' +
        params.sortBy +
        '&orderBy=' +
        params.orderBy
    );
  }

  createCustomFields(body: any) {
    return this.httpClient.post(this._base_url + this._custom_fields_url, body);
  }

  updateCustomFields(body: any) {
    return this.httpClient.put(this._base_url + this._custom_fields_url, body);
  }

  shareDocumentWithTeamMembers(body: any, documentId: string) {
    return this.httpClient.put(
      this._document_base_url + this._project_url + '/' + this._documents_url + '/' + this._update_authorized_users_url,
      body,
      {
        headers: { documentId: documentId },
      }
    );
  }

  getProjectList(body: any) {
    const reqBody = {
      search: body.search || '',
      status: body.status || [],
      tagIds: body.tags || [],
      workspaceIds: body.workspace || [],
      billable: body.billable == false ? false : body.billable || '',
    };
    const headers = new HttpHeaders().set('isdropdown', 'true');
    const options = {
      headers: headers,
      params: {
        page: body.page,
        limit: body.limit,
        sortBy: body.sortBy || '',
        orderBy: body.orderBy || '',
      },
    };
    // return this.httpClient.post<any>(this._base_url + this._project_url + '/list', reqBody, options);
    return this.httpClient.post<any>(this._base_url + this._project_url + '/list/v2', reqBody, options);
  }

  getBillingProjectList(body: any) {
    const reqBody = {
      search: body.search || '',
      status: body.status || [],
      tagIds: body.tags || [],
      workspaceIds: body.workspace || [],
      billable: body.billable == false ? false : body.billable || '',
    };
    const headers = new HttpHeaders().set('isdropdown', 'true');
    const options = {
      headers: headers,
      params: {
        page: body.page,
        limit: body.limit,
        sortBy: body.sortBy || '',
        orderBy: body.orderBy || '',
      },
    };

    // return this.httpClient.post<any>(this._base_url + this._project_url + '/list', reqBody, options);
    return this.httpClient.post<any>(this._base_url + this._project_url + '/list/billing/v2', reqBody, options);
  }

  getTotalWorkedTime(body: any) {
    // return this.httpClient.post<any>(this._base_url + this._project_url + '/list', reqBody, options);
    return this.httpClient.post<any>(this._base_url + this._project_url + '/list/billing/totalWorkingTime/v2', body);
  }

  checkIfProjectKeyExists(projectKeyRequestBody: ProjectKeyRequestBody) {
    return this.httpClient.post<ProjectKeyResponseModel>(this._base_url + this._project_url + '/' + this._get_project_key_url, projectKeyRequestBody);
  }

  getProjectWorkedHrs(requestBody: ProjectReportRequestBody, limit: number, page: number) {
    return this.httpClient.post<any>(this._task_base_url + this._project_worked_hrs_url, requestBody, {
      headers: {
        limit: limit.toString(),
        page: page.toString(),
      },
    });
  }
}
