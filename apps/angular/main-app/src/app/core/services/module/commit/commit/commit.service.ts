import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './../../../../../../environments/environment';
import {
  CommitListResponseModel,
  GetCommitListRequestModel,
  PostCommitRequestModel,
  PostCommitResponseModel,
  UpdateCommitRequestModel,
  UpdateCommitResponseModel,
  deleteCommitResponseModel,
} from '../../../../model/commit/commit.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommitService {
  //#region properties
  _task_base_url = environment.task_base_url;
  _commit_url = environment.commit_url;
  //#endregion
  constructor(private httpClient: HttpClient) {}

  postCommit(requestBody: PostCommitRequestModel) {
    return this.httpClient.post<PostCommitResponseModel>(this._task_base_url + this._commit_url, requestBody);
  }

  postTaskCommit(requestBody: PostCommitRequestModel): Observable<any> {
    return new Observable((observer) => {
      this.postCommit(requestBody).subscribe({
        next: (response: any) => {
          if (response) {
            if (response.success) {
              observer.next(response);
              observer.complete();
            }
          }
        },
        error: (error: any) => {
          observer.error(error);
          observer.complete();
        },
      });
    });
  }

  getCommits(getCommitListRequestModel: GetCommitListRequestModel) {
    return this.httpClient.get<CommitListResponseModel>(this._task_base_url + this._commit_url, {
      headers: {
        task_id: getCommitListRequestModel.task_id,
        page: getCommitListRequestModel.page.toString(),
        limit: getCommitListRequestModel.limit.toString(),
        orderby: getCommitListRequestModel.orderby,
        sortby: getCommitListRequestModel.sortby,
      },
    });
  }

  deleteCommit(commitId: string, taskId: string) {
    return this.httpClient.delete<deleteCommitResponseModel>(this._task_base_url + this._commit_url, {
      headers: {
        id: commitId,
        task_id: taskId,
      },
    });
  }

  updateCommit(requestBody: UpdateCommitRequestModel, commitId: string, taskId: string) {
    return this.httpClient.put<UpdateCommitResponseModel>(this._task_base_url + this._commit_url, requestBody, {
      headers: {
        id: commitId,
        task_id: taskId,
      },
    });
  }
}
