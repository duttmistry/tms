import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TaskService } from '../../../core/services/module/tasks/task.service';
import { Subject, Subscription, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { TasksByProjectRequestModel } from '../../../core/model/task/task.model';
import { FormControl, Validators } from '@angular/forms';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { environment } from 'apps/angular/main-app/src/environments/environment';
import { Utility } from '../../../core/utilities/utility';
import { Encryption } from '@tms-workspace/encryption';

@Component({
  selector: 'main-app-tms-workspace-parent-task-list-modal',
  templateUrl: './parent-task-list-modal.component.html',
  styleUrls: ['./parent-task-list-modal.component.scss'],
})
export class ParentTaskListModalComponent implements OnInit, AfterViewInit, OnDestroy {
  //#region  properties
  @ViewChild('parentTaskListModal') parentTaskListModal!: TemplateRef<any>;
  @Input() projectId!: number;
  @Input() taskId!: string;
  @Input() selectedProject!: any;
  @Output() emitModal: EventEmitter<any> = new EventEmitter();
  subscriptions: Subscription[] = [];
  currentPage = 1;
  limit = 10;
  totalRecords!: number;
  totalPages!: number;
  parentTaskList: any = [];
  isshowLoadMoreTasks = false;
  taskSearchControl = new FormControl('', Validators.compose([Validators.maxLength(512), Validators.required, Validators.minLength(5)]));
  private destroy$: Subject<void> = new Subject<void>();
  private inputSubject: Subject<string> = new Subject<string>();
  public items = Utility.stateList.map((state: any) => {
    return { name: state.title, ...state };
  });

  //#endregion

  constructor(private dialog: MatDialog, private taskService: TaskService, private spinnerService: SpinnerService) {}

  ngOnInit(): void {
    if (this.projectId) {
      this.getParentTasks();
    }

    this.inputSubject.pipe(takeUntil(this.destroy$), debounceTime(800), distinctUntilChanged()).subscribe(() => {
      // if (!searchTerm) {
      //   this.parentTaskList = [];
      // }
      this.currentPage = 1;
      this.getParentTasks();
    });
  }

  ngAfterViewInit(): void {
    this.openModal();
  }

  onKeyPress(event: any) {
    const searchTerm = event.target.value;
    this.inputSubject.next(searchTerm);
  }

  openModal() {
    this.dialog.open(this.parentTaskListModal, {
      disableClose: true,
      panelClass: 'task-dialog-container-class',
      width: '532px',
      height: '436px',
    });
  }

  // This method will call API to get recent tasks from given project id
  getParentTasks() {
    const requestBody: TasksByProjectRequestModel = {
      projects: [this.projectId],
      search: this.taskSearchControl.value || '',
    };

    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.taskService.getProjectWiseTasksList(requestBody, this.currentPage, this.limit).subscribe({
        next: (response: any) => {
          if (response) {
            this.spinnerService.hideSpinner();
            if (response.data) {
              const responseData = response.data || '';
              // if (responseData.totalRecords) {
              this.totalRecords = responseData.totalRecords || 0;
              this.totalPages = responseData.totalPages || 0;
              // }
              if (responseData.list && responseData.list.length > 0) {
                if (this.currentPage == 1) {
                  this.parentTaskList = JSON.parse(JSON.stringify(responseData.list));
                  // this.parentTaskList = [...responseData.list];
                } else {
                  //  this.parentTaskList = this.parentTaskList.concat(responseData.list);
                  this.parentTaskList = [...this.parentTaskList, ...responseData.list];
                }
                // if (searchTerm) {
                //   if (this.totalRecords > this.parentTaskList.length) {
                //     this.parentTaskList = this.parentTaskList.concat(responseData.list);
                //   } else {
                //     this.parentTaskList = responseData.list;
                //   }
                // } else {
                //   this.parentTaskList = this.parentTaskList.concat(responseData.list);
                // }
                // if (this.totalRecords > this.parentTaskList.length) {
                //   console.log('isshowLoadMoreTasks: ', this.isshowLoadMoreTasks);
                //   this.isshowLoadMoreTasks = true;
                // } else {
                //   console.log('isshowLoadMoreTasks: ', this.isshowLoadMoreTasks);
                //   this.isshowLoadMoreTasks = false;
                // }
                if (this.totalPages > this.currentPage) {
                  this.isshowLoadMoreTasks = true;
                } else {
                  this.isshowLoadMoreTasks = false;
                }
                this.parentTaskList = this.parentTaskList.filter((p_task: any) => Encryption._doDecrypt(this.taskId) != p_task.id);
              } else {
                this.parentTaskList = [];
                this.isshowLoadMoreTasks = false;
              }
            }
          }
          this.parentTaskList.forEach((parentTask: any) => {
            const matchingUserData = this.selectedProject.find((project: any) => project?.user_id === parentTask?.assignee);
            // console.log(matchingUserData);
            if (matchingUserData) {
              parentTask.user = matchingUserData.user;
              // Object.assign(parentTask, matchingUserData);
            }
          });
        },
        error: (error) => {
          console.log('error:', error);
        },
      })
    );
  }

  onTaskSelected(taskObject: any) {
    this.emitModal.emit({
      isTaskSelected: true,
      taskObject: taskObject,
    });
  }

  onLoadMoreTasks() {
    this.currentPage += 1;
    this.getParentTasks();
  }

  // close modal when cancelled
  onCancelClick() {
    this.emitModal.emit();
  }

  onCloseModal() {
    this.emitModal.emit({ isModalCancelled: true });
  }

  getTaskColor(task: any) {
    if (task.state) {
      const taskStyle = this.items.find((item: any) => item.value === task.state);
      return taskStyle.color;
    }
    return 'black';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  clearSearch() {
    this.taskSearchControl.reset('');
    this.inputSubject.next('');
  }
}
