import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import {
  CommentObjectModel,
  GetCommentRequestModel,
  MentionUserModel,
  PostCommentRequestModel,
  UpdateCommentRequestModel,
  commentModel,
} from '../../../core/model/comment/comment.model';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { QuillEditorComponent } from 'ngx-quill';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { CommentService } from '../../../core/services/module/comments/comment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Encryption } from '@tms-workspace/encryption';
import { DATE_FORMAT_CONSTANTS, ERROR_MESSAGE_CONSTANTS } from '../../../core/services/common/constants';
import { Router } from '@angular/router';
import { ProjectTeamMember } from '../../../core/model/task/task.model';
import { GlobalService } from '../../../core/services/common/global.service';
import { environment } from './../../../../environments/environment';
import moment from 'moment';

@Component({
  selector: 'main-app-tms-workspace-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss'],
})
export class CommentsComponent implements OnChanges {
  //#region properties
  commentsForm!: FormGroup;
  commentsListToBind: CommentObjectModel[] = [];
  paginatedComments: CommentObjectModel[] = [];
  @Input() loggedInUserId!: number;
  @Input() currentTaskId!: any;
  @Input() isCallComments!: boolean;
  @Input() projectTeamMemberList: ProjectTeamMember[] = [];
  editableCommentFormControl = new FormControl('', Validators.required);
  commentEditorSource = interval(200);
  commentEditorSubscription!: Subscription;
  @ViewChild('editCommentEditor') editCommentEditor!: QuillEditorComponent;
  @ViewChild('addCommentEditor') addCommentEditor!: QuillEditorComponent;
  addCommentEditorSource = interval(100);
  addCommentEditorSubscription!: Subscription;
  getCommentRequestModel: GetCommentRequestModel = new GetCommentRequestModel();
  isShowLoadMoreComments = false;
  subscriptions: Subscription[] = [];
  atValues: { id: number; value: string }[] = [];
  QuillConfiguration = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // toggled buttons
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link'], // link and image, video
      ['clean'], // remove formatting button
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ font: [] }],
      [{ align: [] }],
    ],
    mention: {
      allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
      mentionDenotationChars: ['@', '#'],
      source: (searchTerm: any, renderList: any, mentionChar: any) => {
        let values;
        if (mentionChar === '@') {
          values = this.atValues;
        }
        if (searchTerm.length === 0) {
          renderList(values, searchTerm);
        } else {
          const matches = [];
          if (values && values.length > 0) {
            for (let i = 0; i < values.length; i++) if (~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())) matches.push(values[i]);
            renderList(matches, searchTerm);
          }
        }
      },
    },
  };
  quillConfiguration = this.QuillConfiguration;
  isUpdateCommentSubmitted = false;
  isCommentSubmitted = false;
  temporaryCommentsToBePosted: any = [];
  currentTaskIdSource = interval(100);
  currentTaskIdSubscription!: Subscription;
  @Output() commentsToBePostedEmmiter = new EventEmitter<any>();
  @Output() afterCommentPosted = new EventEmitter<any>();

  baseURL = environment.base_url;
  batchSize = 5;
  currentIndex = 0;
  isCommentPosted = false;
  isCommentDeleted = false;
  isCommentUpdated = false;
  //#endregion

  constructor(
    private dialog: MatDialog,
    private spinnerService: SpinnerService,
    private commentService: CommentService,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    private router: Router,
    private globalService: GlobalService
  ) {
    this.commentsForm = this.initializeCommentsForm();
    this.getCurrentTaskId();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes) {
      if (changes['projectTeamMemberList'] && changes['projectTeamMemberList'].currentValue) {
        this.projectTeamMemberList = changes['projectTeamMemberList'].currentValue || [];
      } else {
        this.projectTeamMemberList = [];
      }
      this.setMentionListForEditor();
    }
  }

  initializeCommentsForm() {
    return this.formBuilder.group({
      comment: ['', Validators.required],
    });
  }

  get _commentForm(): any {
    return this.commentsForm.controls;
  }

  // this method will set mention user list in editor
  setMentionListForEditor() {
    this.atValues = this.globalService.setMentionUsersList(this.projectTeamMemberList);
  }

  getCurrentTaskId() {
    this.currentTaskIdSubscription = this.currentTaskIdSource.subscribe((response) => {
      if (this.isCallComments && this.currentTaskId) {
        this.currentTaskIdSubscription.unsubscribe();
        this.getCommentRequestModel.task_id = this.currentTaskId || '';
        this.getAllCommentsByTaskId();
      }
    });
  }

  onEditComment(commentObject: CommentObjectModel, commentIndex: number) {
    if (this.commentsListToBind && this.commentsListToBind.length > 0) {
      this.commentsListToBind.forEach((commentObject: CommentObjectModel, index: number) => {
        if (commentIndex == index) {
          commentObject.isCommentEditable = true;
        } else {
          commentObject.isCommentEditable = false;
        }
      });
    }
    this.editableCommentFormControl.setValue(commentObject.comments || '');
    this.commentEditorSubscription = this.commentEditorSource.subscribe((response: any) => {
      if (response) {
        if (this.editCommentEditor.quillEditor) {
          this.commentEditorSubscription.unsubscribe();
          if (commentObject.comments?.length) {
            this.editCommentEditor.quillEditor.setSelection(this.editCommentEditor.quillEditor.getLength(), 0);
          }
        }
      }
    });
  }

  onDeleteComment(commentObject: CommentObjectModel, commentIndex: number) {
    if (commentIndex >= 0) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: {
          title: 'Are you sure you want to delete comment ?',
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          // If comment's id is present, make delete API call, If not = it means comment is stored locally in array, need to splice it.
          if (commentObject.id) {
            this.deleteComment(commentObject);
          } else {
            this.commentsListToBind.splice(commentIndex, 1);
          }
        }
      });
    }
  }

  // DELETE API call to delete comment
  deleteComment(commentObject: any) {
    this.spinnerService.showSpinner();
    const commentId = Encryption._doEncrypt(commentObject.id.toString());
    this.subscriptions.push(
      this.commentService.deleteComment(this.currentTaskId, commentId).subscribe({
        next: (response: any) => {
          if (response) {
            if (response.success) {
              // pass true as comment is deleted
              this.getAllCommentsByTaskId(true);
            }
            this.spinnerService.hideSpinner();
          }
        },
        error: (error: any) => {
          console.log('error:', error);
          this.spinnerService.hideSpinner();
        },
      })
    );
  }

  // get comments list by task id
  getAllCommentsByTaskId(isDeleted?: boolean) {
    if (this.getCommentRequestModel.task_id) {
      this.spinnerService.showSpinner();
      this.subscriptions.push(
        this.commentService.getAllCommentsByTask(this.getCommentRequestModel).subscribe({
          next: (response: any) => {
            if (response) {
              if (response.data) {
                const responseData = response.data;
                if (responseData.comments && responseData.comments.length > 0) {
                  if (isDeleted) {
                    this.commentsListToBind = responseData.comments || [];
                  } else {
                    this.commentsListToBind = this.commentsListToBind.concat(responseData.comments || []);
                  }
                  this.commentsListToBind = this.commentsListToBind.reverse();
                  this.prepareCommentedObject(isDeleted);
                } else {
                  this.commentsListToBind = [];
                  this.paginatedComments = [];
                }
              }
            }
          },
          error: (error: any) => {
            this.spinnerService.hideSpinner();
            console.log('error:', error);
          },
          complete: () => {
            this.spinnerService.hideSpinner();
          },
        })
      );
    }
  }

  prepareCommentedObject(isCommentDeleted?: boolean) {
    if (this.commentsListToBind && this.commentsListToBind.length > 0) {
      this.commentsListToBind.forEach((commentObject: CommentObjectModel) => {
        commentObject.name = commentObject.user_name || '';
        commentObject.avatar = commentObject.user_profile || '';
        // commentObject.id = commentObject.user_id;
        commentObject.commentedOn = commentObject.updated_at;
        commentObject.commentedOnTime = commentObject.updated_at ? moment(commentObject.updated_at).format('DD/MM/YYYY HH:mm:ss') : "";
        commentObject.isCommentEdited = commentObject.created_at === commentObject.updated_at ? false : true;
        commentObject.userDataReBind = {
          name: commentObject.user_name || '',
          avatar: commentObject.user_profile || '',
          id: commentObject.user_id,
          commentedOn: commentObject.updated_at,
          isCommentEdited: commentObject.created_at === commentObject.updated_at ? false : true,
          commentedOnTime: commentObject.updated_at,
        };
      });
      if (!this.isCommentPosted) {
        if (isCommentDeleted) {
          const endIndex = this.currentIndex;
          this.paginatedComments = this.commentsListToBind.slice(0, endIndex);
          this.currentIndex = endIndex;
        } else {
          if (this.isCommentUpdated) {
            this.isCommentUpdated = false;
            const endIndex = this.currentIndex;
            this.paginatedComments = this.commentsListToBind.slice(0, endIndex);
            this.currentIndex = endIndex;
          } else {
            const endIndex = this.currentIndex + this.batchSize;
            this.paginatedComments = this.commentsListToBind.slice(this.currentIndex, endIndex);
            this.currentIndex = endIndex;
          }
        }
      } else {
        const endIndex = this.currentIndex;
        this.paginatedComments = this.commentsListToBind.slice(
          0,
          endIndex == 0 ? (this.commentsListToBind.length == 1 ? this.commentsListToBind.length : this.commentsListToBind.length - 1) : endIndex
        );
        this.currentIndex =
          endIndex == 0 ? (this.commentsListToBind.length == 1 ? this.commentsListToBind.length : this.commentsListToBind.length - 1) : endIndex;
        this.isCommentPosted = false;
      }
      if (this.commentsListToBind && this.commentsListToBind.length > 0 && this.commentsListToBind.length > this.paginatedComments.length) {
        this.isShowLoadMoreComments = true;
      } else {
        this.isShowLoadMoreComments = false;
      }
    }
  }

  // makes POST comment API call for particular task
  onPostComment() {
    this.isCommentSubmitted = true;
    if (this.commentsForm.valid) {
      if (this.checkIfCommentEditorHasNoSpace(this.commentsForm.value.comment)) {
        const formValue = this.commentsForm.getRawValue();

        //  formValue.comment = this.globalService.urlify(formValue.comment);
        const mentionedUsersList: MentionUserModel[] = this.commentService.getMentionedUsersList(formValue.comment);
        const commentsList: commentModel[] = [];
        commentsList.push({
          comments: formValue.comment || '',
          mention_users: mentionedUsersList || [],
        });
        const requestBody: PostCommentRequestModel = {
          task_id: this.currentTaskId ? Encryption._doDecrypt(this.currentTaskId) : '',
          commentsList: commentsList,
        };

        //check if task id exists, then  make API call to post comment, otherwise keep it in array temporarily
        if (this.currentTaskId) {
          if (formValue.comment) {
            // pass false to not to navigate to task list page
            this.postComment(requestBody, false);
            this.afterCommentPosted.emit(mentionedUsersList);
          }
        } else {
          // Need to push in comments Array as task is not yet created.
          this.temporaryCommentsToBePosted.push(requestBody.commentsList[0]);
          this.commentsListToBind.push({ ...requestBody.commentsList[0], isCommentEditable: false, user_id: this.loggedInUserId });
          this.commentsForm.reset();
          this.isCommentSubmitted = false;
          this.emitCommentsToBePosted(this.temporaryCommentsToBePosted);
        }
      }
    }
    // else {
    //   this.snackBar.open(ERROR_MESSAGE_CONSTANTS.REQUIRED_AND_INVALID_FORM);
    // }
  }

  // This method will check if editor has only spaces then reset it and return false otherwise return true
  checkIfCommentEditorHasNoSpace(commentValue: string) {
    if (commentValue) {
      const div: any = document.createElement('div');
      div.innerHTML = commentValue.trim();
      if (div.firstChild && div.firstChild.firstChild.data && div.firstChild.firstChild.data.trim().length == 0) {
        this.isCommentSubmitted = false;
        this._commentForm['comment'].reset();
        this.addCommentEditorSubscription = this.addCommentEditorSource.subscribe(() => {
          if (this.addCommentEditor) {
            this.addCommentEditorSubscription.unsubscribe();
            this.addCommentEditor.quillEditor.setSelection(0, 0);
          }
        });
        return false;
      } else {
        return true;
      }
    } else {
      return true;
    }
  }

  // check if user selects mention user, and if project is not selected, show error message
  onEditorContentChange(event: any) {
    if (event) {
      if (event.html == '<p>@</p>') {
        if (this.projectTeamMemberList && this.projectTeamMemberList.length == 0) {
          this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
          this._commentForm['comment'].reset();
        }
      } else if (event.html && this.projectTeamMemberList && this.projectTeamMemberList.length == 0) {
        this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
        this._commentForm['comment'].reset();
      }
    }
  }

  onCancelUpdateComment(commentIndex: number) {
    this.commentsListToBind[commentIndex].isCommentEditable = !this.commentsListToBind[commentIndex].isCommentEditable;
    this.editableCommentFormControl.reset();
  }

  onUpdateComment(commentIndex: number) {
    this.isUpdateCommentSubmitted = true;
    if (this.editableCommentFormControl.valid && this.editableCommentFormControl.value) {
      if (this.checkIfCommentEditorHasNoSpace(this.editableCommentFormControl.value)) {
        const formControlValue = this.editableCommentFormControl.value || '';
        const mentionedUsersList: MentionUserModel[] = this.commentService.getMentionedUsersList(formControlValue);
        const commentsList: commentModel[] = [];
        commentsList.push({
          comments: formControlValue || '',
          mention_users: mentionedUsersList || [],
        });
        const requestBody: UpdateCommentRequestModel = {
          comments: formControlValue,
          mention_users: mentionedUsersList || [],
        };
        // check if task is already created, then make UPDATE Task API request
        if (this.currentTaskId) {
          this.spinnerService.showSpinner();
          const commentId: string = Encryption._doEncrypt(this.commentsListToBind[commentIndex].id?.toString() || '');
          this.subscriptions.push(
            this.commentService.updateComment(requestBody, commentId, this.currentTaskId).subscribe({
              next: (response: any) => {
                if (response) {
                  if (response.success) {
                    this.commentsListToBind[commentIndex].isCommentEditable = false;
                    this.commentsListToBind[commentIndex].updated_at = response.data.updated_at || '';
                    this.editableCommentFormControl.reset();
                    this.commentsListToBind[commentIndex].comments = formControlValue;
                    this.commentsListToBind[commentIndex].isCommentEdited = true;
                    this.isUpdateCommentSubmitted = false;
                    this.isCommentUpdated = true;
                    this.prepareCommentedObject();
                  }
                  this.spinnerService.hideSpinner();
                }
              },
              error: (error: any) => {
                console.log('error:', error);
                this.spinnerService.hideSpinner();
              },
            })
          );
        } else {
          // update in local array
          this.commentsListToBind[commentIndex].comments = formControlValue;
          this.commentsListToBind[commentIndex].mention_users = mentionedUsersList || [];
        }
      }
      this.editableCommentFormControl.reset();
      this.commentsListToBind[commentIndex].isCommentEditable = !this.commentsListToBind[commentIndex].isCommentEditable;
    }
    // else {
    //   this.snackBar.open(ERROR_MESSAGE_CONSTANTS.REQUIRED_AND_INVALID_FORM);
    // }
  }

  // Post Comment API
  postComment(requestBody: PostCommentRequestModel, navigateToTaskList: boolean) {
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.commentService.postComment(requestBody).subscribe({
        next: (response: any) => {
          if (response) {
            if (response.success) {
              this.commentsForm.reset();
              this.isCommentSubmitted = false;
              if (navigateToTaskList) {
                this.router.navigate(['tasks/list']);
              } else if (response.data && response.data.comments && response.data.comments.length > 0) {
                this.commentsListToBind.unshift({ ...response.data.comments[response.data.comments.length - 1], isCommentEditable: false });
                this.isCommentPosted = true;
                this.prepareCommentedObject();
              }
            }
          }
        },
        error: (error: any) => {
          console.log('error:', error);
        },
        complete: () => {
          this.spinnerService.hideSpinner();
        },
      })
    );
  }
  onLoadMoreComments() {
    const endIndex = this.currentIndex + this.batchSize;
    this.paginatedComments = this.paginatedComments.concat(this.commentsListToBind.slice(this.currentIndex, endIndex));
    this.currentIndex = endIndex;
    if (this.commentsListToBind && this.commentsListToBind.length > 0 && this.commentsListToBind.length > this.paginatedComments.length) {
      this.isShowLoadMoreComments = true;
    } else {
      this.isShowLoadMoreComments = false;
    }
  }

  emitCommentsToBePosted(temporaryCommentsToBePosted: any[]) {
    this.commentsToBePostedEmmiter.emit({ commentsToPost: temporaryCommentsToBePosted });
  }
}
