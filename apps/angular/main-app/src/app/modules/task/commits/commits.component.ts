import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import {
  CommitListModel,
  CommitListResponseModel,
  GetCommitListRequestModel,
  PostCommitRequestModel,
  PostCommitResponseModel,
  UpdateCommitRequestModel,
  UpdateCommitResponseModel,
  commitObjectModel,
  deleteCommitResponseModel,
} from '../../../core/model/commit/commit.model';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { QuillEditorComponent } from 'ngx-quill';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { CommitService } from '../../../core/services/module/commit/commit/commit.service';
import { ProjectTeamMember } from '../../../core/model/task/task.model';
import { DATE_FORMAT_CONSTANTS, ERROR_MESSAGE_CONSTANTS } from '../../../core/services/common/constants';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Encryption } from '@tms-workspace/encryption';
import { MentionUserModel } from '../../../core/model/comment/comment.model';
import { CommentService } from '../../../core/services/module/comments/comment.service';
import { GlobalService } from '../../../core/services/common/global.service';
import { environment } from './../../../../environments/environment';
import moment from 'moment';

@Component({
  selector: 'main-app-tms-workspace-commits',
  templateUrl: './commits.component.html',
  styleUrls: ['./commits.component.scss'],
})
export class CommitsComponent implements OnChanges {
  //#region properties
  commitListToBind: any[] = [];
  @Input() loggedInUserId!: number;
  @Output() commitsToBePostedEmmiter = new EventEmitter<any>();
  commitForm!: FormGroup;
  editableCommitFormControl = new FormControl('', Validators.required);
  commitEditorSource = interval(200);
  commitEditorSubscription!: Subscription;
  currentTaskIdSource = interval(100);
  currentTaskIdSubscription!: Subscription;
  @ViewChild('editCommitEditor') editCommitEditor!: QuillEditorComponent;
  @ViewChild('addCommitEditor') addCommitEditor!: QuillEditorComponent;
  subscriptions: Subscription[] = [];
  getCommitListRequestModel: GetCommitListRequestModel = new GetCommitListRequestModel();
  @Input() projectTeamMemberList: ProjectTeamMember[] = [];
  isShowLoadMoreCommits = false;
  isCommitSubmitted = false;
  isupdateCommitSubmitted = false;
  @Input() currentTaskId!: any;
  @Input() isCallCommits!: boolean;
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
  temporaryCommitsToBePosted: any = [];
  baseURL = environment.base_url;
  paginatedCommits: commitObjectModel[] = [];
  batchSize = 5;
  currentIndex = 0;
  isCommitPosted = false;
  isCommitDeleted = false;
  isCommitUpdated = false;
  //#endregion

  constructor(
    private dialog: MatDialog,
    private spinnerService: SpinnerService,
    private commitService: CommitService,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    private commentService: CommentService,
    private globalService: GlobalService
  ) {
    this.getCurrentTaskId();
    this.commitForm = this.initializeCommitForm();
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

  initializeCommitForm() {
    return this.formBuilder.group({
      commit: ['', Validators.required],
    });
  }

  get _commitForm(): any {
    return this.commitForm.controls;
  }

  // this method will set mention user list in editor
  setMentionListForEditor() {
    this.atValues = this.globalService.setMentionUsersList(this.projectTeamMemberList);
  }

  getCurrentTaskId() {
    this.currentTaskIdSubscription = this.currentTaskIdSource.subscribe((response) => {
      if (this.isCallCommits && this.currentTaskId) {
        this.currentTaskIdSubscription.unsubscribe();
        this.getCommitListRequestModel.task_id = this.currentTaskId || '';
        this.getTaskCommits();
      }
    });
  }

  onEditCommit(commitObject: any, commitIndex: number) {
    if (this.commitListToBind && this.commitListToBind.length > 0) {
      this.commitListToBind.forEach((commitObject: any, index: number) => {
        if (commitIndex == index) {
          commitObject.isCommitEditable = true;
        } else {
          commitObject.isCommitEditable = false;
        }
      });
      this.editableCommitFormControl.setValue(commitObject.commits || '');
      this.commitEditorSubscription = this.commitEditorSource.subscribe((response: any) => {
        if (response) {
          if (this.editCommitEditor.quillEditor) {
            this.commitEditorSubscription.unsubscribe();
            if (commitObject.commits?.length) {
              this.editCommitEditor.quillEditor.setSelection(this.editCommitEditor.quillEditor.getLength(), 0);
            }
          }
        }
      });
    }
  }

  onDeleteCommit(commitObject: commitObjectModel, commitIndex: number) {
    if (commitIndex >= 0) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: {
          title: 'Are you sure you want to delete commit?',
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          if (commitObject.id) {
            this.deletecommit(commitObject);
          }
        }
      });
    }
  }

  deletecommit(commitObject: commitObjectModel) {
    this.spinnerService.showSpinner();
    if (commitObject.id) {
      const commitId = Encryption._doEncrypt(commitObject.id.toString());
      this.subscriptions.push(
        this.commitService.deleteCommit(commitId, this.currentTaskId).subscribe({
          next: (response: deleteCommitResponseModel) => {
            if (response) {
              if (response.status) {
                // pass true as comment is deleted
                this.getTaskCommits(true);
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
  }

  // this method will get all posted commits for the selected task
  getTaskCommits(isCommitDeleted?: boolean) {
    if (this.getCommitListRequestModel.task_id) {
      this.spinnerService.showSpinner();
      this.subscriptions.push(
        this.commitService.getCommits(this.getCommitListRequestModel).subscribe({
          next: (response: CommitListResponseModel) => {
            if (response) {
              if (response.data) {
                const responseData = response.data;
                if (responseData.commits && responseData.commits.length > 0) {
                  if (isCommitDeleted) {
                    this.commitListToBind = responseData.commits || [];
                  } else {
                    this.commitListToBind = this.commitListToBind.concat(responseData.commits) || [];
                  }
                  this.commitListToBind = this.commitListToBind.reverse();
                  this.prepareCommitsObject(isCommitDeleted);
                } else {
                  this.commitListToBind = [];
                  this.paginatedCommits = [];
                }
              }
              this.spinnerService.hideSpinner();
            }
          },
          error: (error: any) => {
            console.log('error:', error);
            this.spinnerService.hideSpinner();
          },
          complete: () => {
            this.spinnerService.hideSpinner();
          },
        })
      );
    }
  }

  // check if user selects mention user, and if project is not selected, show error message
  onEditorContentChange(event: any) {
    if (event) {
      if (event.html == '<p>@</p>') {
        if (this.projectTeamMemberList && this.projectTeamMemberList.length == 0) {
          this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
          this._commitForm['commit'].reset();
        }
      } else if (event.html && this.projectTeamMemberList && this.projectTeamMemberList.length == 0) {
        this.snackBar.open(ERROR_MESSAGE_CONSTANTS.SELECT_PROJECT_FIRST);
        this._commitForm['commit'].reset();
      }
    }
  }

  onPostCommit() {
    this.isCommitSubmitted = true;
    if (this.commitForm.valid) {
      if (this.checkIfCommitEditorHasNoSpace(this.commitForm.value.commit)) {
        const formValue = this.commitForm.getRawValue();

        // formValue.commit = this.globalService.urlify(formValue.commit);
        const mentionedUsersList: MentionUserModel[] = this.commentService.getMentionedUsersList(formValue.commit);
        const commitList: CommitListModel[] = [];
        commitList.push({
          commits: formValue.commit || '',
          mention_users: mentionedUsersList || [],
        });
        const requestBody: PostCommitRequestModel = {
          task_id: this.currentTaskId ? Encryption._doDecrypt(this.currentTaskId) : '',
          commitList: commitList || [],
        };
        // check if task id exists
        if (this.currentTaskId) {
          this.spinnerService.showSpinner();
          this.subscriptions.push(
            this.commitService.postTaskCommit(requestBody).subscribe({
              next: (response: any) => {
                if (response) {
                  if (response.success) {
                    if (response.data && response.data.commits && response.data.commits.length > 0) {
                      this.commitListToBind.unshift({ ...response.data.commits[response.data.commits.length - 1], iscommiteditable: false });
                      this.isCommitPosted = true;
                      this.prepareCommitsObject();
                    }
                    this.isCommitSubmitted = false;
                  }
                  this.spinnerService.hideSpinner();
                  this._commitForm['commit'].reset();
                }
              },
              error: (error: any) => {
                console.log('error:', error);
                this.spinnerService.hideSpinner();
              },
              complete: () => {
                this.spinnerService.hideSpinner();
              },
            })
          );
        } else {
          // Need to push in commits Array as task is not yet created.
          this.temporaryCommitsToBePosted.push(requestBody.commitList[0]);
          this.commitListToBind.push({ ...requestBody.commitList[0], isCommitEditable: false, user_id: this.loggedInUserId });
          this.commitForm.reset();
          this.isCommitSubmitted = false;
          this.emitCommitsToBePosted(this.temporaryCommitsToBePosted);
        }
      }
    }
    // else {
    //   this.snackBar.open(ERROR_MESSAGE_CONSTANTS.REQUIRED_AND_INVALID_FORM);
    // }
  }

  // This method will check if editor has only spaces then reset it and return false otherwise return true
  checkIfCommitEditorHasNoSpace(commitValue: string) {
    if (commitValue) {
      const div: any = document.createElement('div');
      div.innerHTML = commitValue.trim();
      if (div.firstChild && div.firstChild.firstChild && div.firstChild.firstChild.data && div.firstChild.firstChild.data.trim()?.length == 0) {
        this.isCommitSubmitted = false;
        this._commitForm['commit'].reset();
        this.addCommitEditor.quillEditor.setSelection(0, 0);
        return false;
      } else {
        return true;
      }
    } else {
      return true;
    }
  }

  onUpdateCommit(commitIndex: number) {
    this.isupdateCommitSubmitted = true;
    if (this.editableCommitFormControl.valid && this.editableCommitFormControl.value) {
      if (this.checkIfCommitEditorHasNoSpace(this.editableCommitFormControl.value)) {
        const formControlValue = this.editableCommitFormControl.value || '';
        const mentionedUsersList: MentionUserModel[] = this.commentService.getMentionedUsersList(formControlValue);
        const commitsList: CommitListModel[] = [];
        commitsList.push({
          commits: formControlValue || '',
          mention_users: mentionedUsersList || [],
        });

        const requestBody: UpdateCommitRequestModel = {
          task_id: Encryption._doDecrypt(this.currentTaskId),
          commits: formControlValue,
          mention_users: mentionedUsersList || [],
        };

        if (this.currentTaskId) {
          const commentId: string = Encryption._doEncrypt(this.commitListToBind[commitIndex].id?.toString() || '');
          this.spinnerService.showSpinner();
          this.subscriptions.push(
            this.commitService.updateCommit(requestBody, commentId, this.currentTaskId).subscribe({
              next: (response: UpdateCommitResponseModel) => {
                if (response) {
                  if (response.status && response.success) {
                    if (response.data) {
                      this.commitListToBind[commitIndex] = response.data || '';
                      this.commitListToBind[commitIndex].updated_at = response.data.updated_at || '';
                      this.isupdateCommitSubmitted = false;
                      this.editableCommitFormControl.reset();
                      this.isCommitUpdated = true;
                      this.prepareCommitsObject();
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
      } else {
        this.onCancelUpdateCommit(commitIndex);
      }
    }
    // else {
    //   this.snackBar.open(ERROR_MESSAGE_CONSTANTS.REQUIRED_AND_INVALID_FORM);
    // }
  }

  onCancelUpdateCommit(commitIndex: number) {
    this.commitListToBind[commitIndex].isCommitEditable = !this.commitListToBind[commitIndex].isCommitEditable;
    this.editableCommitFormControl.reset();
  }

  emitCommitsToBePosted(temporaryCommentsToBePosted: any[]) {
    this.commitsToBePostedEmmiter.emit({ commitsToPost: temporaryCommentsToBePosted });
  }

  onLoadMoreCommits() {
    const endIndex = this.currentIndex + this.batchSize;
    this.paginatedCommits = this.paginatedCommits.concat(this.commitListToBind.slice(this.currentIndex, endIndex));
    this.currentIndex = endIndex;
    if (this.commitListToBind && this.commitListToBind.length > 0 && this.commitListToBind.length > this.paginatedCommits.length) {
      this.isShowLoadMoreCommits = true;
    } else {
      this.isShowLoadMoreCommits = false;
    }
  }

  prepareCommitsObject(iscommitDeleted?: boolean) {
    if (this.commitListToBind && this.commitListToBind.length > 0) {
      this.commitListToBind.forEach((commitObject: commitObjectModel) => {
        commitObject.name = commitObject.user_name || '';
        commitObject.avatar = commitObject.user_profile || '';
        // commitObject.id = commitObject.user_id;
        commitObject.commentedOn = commitObject.updated_at;
        commitObject.commentedOnTime = commitObject.updated_at ? moment(commitObject.updated_at).format('DD/MM/YYYY HH:mm:ss') : "";
        commitObject.createdAt === commitObject.updated_at ? false : true;
        commitObject.isCommitEdited = commitObject.createdAt === commitObject.updated_at ? false : true;
      });

      if (!this.isCommitPosted) {
        if (iscommitDeleted) {
          const endIndex = this.currentIndex;
          this.paginatedCommits = this.commitListToBind.slice(0, endIndex);
          this.currentIndex = endIndex;
        } else {
          if (this.isCommitUpdated) {
            this.isCommitUpdated = false;
            const endIndex = this.currentIndex;
            this.paginatedCommits = this.commitListToBind.slice(0, endIndex);
            this.currentIndex = endIndex;
          } else {
            const endIndex = this.currentIndex + this.batchSize;
            this.paginatedCommits = this.commitListToBind.slice(this.currentIndex, endIndex);
            this.currentIndex = endIndex;
          }
        }
      } else {
        const endIndex = this.currentIndex;
        this.paginatedCommits = this.commitListToBind.slice(
          0,
          endIndex == 0 ? (this.commitListToBind.length == 1 ? this.commitListToBind.length : this.commitListToBind.length - 1) : endIndex
        );
        this.currentIndex =
          endIndex == 0 ? (this.commitListToBind.length == 1 ? this.commitListToBind.length : this.commitListToBind.length - 1) : endIndex;
        this.isCommitPosted = false;
      }
      if (this.commitListToBind && this.commitListToBind.length > 0 && this.commitListToBind.length > this.paginatedCommits.length) {
        this.isShowLoadMoreCommits = true;
      } else {
        this.isShowLoadMoreCommits = false;
      }
    }
  }
}
