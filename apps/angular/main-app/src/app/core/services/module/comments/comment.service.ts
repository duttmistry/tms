import { Injectable } from '@angular/core';
import { PostCommentRequestModel, MentionUserModel, UpdateCommentRequestModel, GetCommentRequestModel } from '../../../model/comment/comment.model';
import { environment } from './../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  //#region properties
  _task_base_url = environment.task_base_url;
  _task_comment_url = environment.task_comment_url;
  //#endregion
  constructor(private httpClient: HttpClient) {}

  postTaskComment(requestBody: PostCommentRequestModel) {
    return this.httpClient.post(this._task_base_url + this._task_comment_url, requestBody);
  }

  // Post Comment API
  postComment(requestBody: PostCommentRequestModel): Observable<any> {
    return new Observable((observer) => {
      this.postTaskComment(requestBody).subscribe({
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
          console.log('error:', error);
        },
      });
    });
  }

  getAllCommentsByTask(getCommentRequestModel: GetCommentRequestModel) {
    return this.httpClient.get(this._task_base_url + this._task_comment_url, {
      headers: {
        task_id: getCommentRequestModel.task_id,
        orderby: getCommentRequestModel.orderby,
        sortby: getCommentRequestModel.sortby,
      },
    });
  }

  deleteComment(taskId: string, commentId: string) {
    return this.httpClient.delete(this._task_base_url + this._task_comment_url, {
      headers: {
        id: commentId,
        task_id: taskId,
      },
    });
  }

  updateComment(requestBody: UpdateCommentRequestModel, commentId: string, taskId: string) {
    return this.httpClient.put(this._task_base_url + this._task_comment_url, requestBody, {
      headers: {
        id: commentId,
        task_id: taskId,
      },
    });
  }

  // This method returns mentioned users list from ngx-quill editor
  getMentionedUsersList(comment: string) {
    const mentionedUsersList: MentionUserModel[] = [];
    const parentDiv = document.createElement('div');

    parentDiv.innerHTML = comment;
    const mentionSpans = parentDiv.querySelectorAll('.mention');

    if (mentionSpans && mentionSpans.length > 0) {
      mentionSpans.forEach((spanObject: any) => {
        if (spanObject.dataset) {
          const mentionedUserObject: MentionUserModel = {
            id: spanObject.dataset.id,
            user_name: spanObject.dataset.value,
          };
          mentionedUsersList.push(mentionedUserObject);
        }
      });
    }
    return mentionedUsersList || [];
  }
}
