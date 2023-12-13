import { FormControl } from '@angular/forms';
import { TaskService } from './../../../core/services/module/tasks/task.service';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Column } from '../../../core/model/board/column.model';
import { Board } from './../../../core/model/board/board.model';
import { StorageService } from '../../../core/services/common/storage.service';
import {
  SectionObjectModel,
  TaskStateAndStatusModel,
  TaskTimerRequestModel,
  toggleTaskTimerResponseModel,
} from '../../../core/model/task/task.model';
import { Utility } from '../../../core/utilities/utility';
import {
  ACTION_CONSTANTS,
  CREATE_MESSAGES_IN_POPUP,
  DEFAULT_LABEL_COLOR_CONSTANTS,
  MODULE_CONSTANTS,
  PERMISSION_CONSTANTS,
  PROJECT_ID_QUERY_PARAM_CONSTANT,
  STORAGE_CONSTANTS,
  TASK_REQUEST_KEYS_CONSTANTS,
  TASK_TIMER_CONSTANTS,
  TASK_TIMER_DEFAULT_VALUE,
} from '../../../core/services/common/constants';
import { Subscription, interval } from 'rxjs';
import { GlobalService } from '../../../core/services/common/global.service';
import { HttpClient } from '@angular/common/http';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { StatusService } from '../../../core/services/module/projects/status.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { UserService } from '../../../core/services/module/users/users.service';
import { Encryption } from '@tms-workspace/encryption';
import * as moment from 'moment';
import { Task_Type_Enum } from '@tms-workspace/enum-data';

@Component({
  selector: 'main-app-task-board',
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.scss'],
})
export class TaskBoardComponent implements OnInit {
  @ViewChild('countUpRef', { static: false }) countUpRef!: ElementRef;
  workspaceID: any;
  filterData: any;
  isShowNewTask = false;
  taskTitle: FormControl = new FormControl('');
  taskList: any = [];
  subscriptions: Subscription[] = [];
  taskTypeList = Task_Type_Enum;
  currentState: any;
  public projectObjects: any;
  public isOverlayTaskStatus: boolean[] = [];
  public selectedItem: any;
  public items = Utility.stateList.map((state: any) => {
    return { name: state.title, ...state };
  });
  public projectStatusList = [];
  alloAddTask = false;
  selectedGroupByFilter = 'project_id';
  sectionsList: SectionObjectModel[] = [];
  taskToEdit: any = null;
  sectionSelectionControl = new FormControl('');
  newTaskStateAndStatus: TaskStateAndStatusModel = new TaskStateAndStatusModel();
  createSectionForMessage = 'Create Section';
  editLabels: any = null;
  taskLabels = new FormControl<any[]>([]);
  presetColors: string[];
  toggle = false;
  color = '#800101';
  isOverlayOpenForTaskLabels = false;
  createLabelForMessage = CREATE_MESSAGES_IN_POPUP.CREATE_LABEL_FOR;
  availableProjectLabels: any = [];
  loggedinUserid = null;
  TASK_TIMER_CONSTANTS_local = TASK_TIMER_CONSTANTS;
  timerSourceSubscription!: Subscription;
  timerSource = interval(1000);
  timerCount = TASK_TIMER_DEFAULT_VALUE;
  timerStartedTaskId: any = null;
  userIsIntBreak = false;
  constructor(
    private globalService: GlobalService,
    private router: Router,
    private tasksService: TaskService,
    private storageService: StorageService,
    private httpClient: HttpClient,
    private cdr: ChangeDetectorRef,
    private permissionService: PermissionService,
    private statusService: StatusService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private spinnerService: SpinnerService,
    private userService: UserService
  ) {
    this.presetColors = this.globalService.presetColors;
    const workspaceFromStorage = this.storageService.getFromLocalStorage(this.storageService.projectsForTasksKey);
    if (workspaceFromStorage) {
      this.workspaceID = JSON.parse(workspaceFromStorage).id || '';
    }

    this.checkForActionPermission();
  }

  navigateToGivenPath(path: string) {
    const workspaceFromStorage = this.storageService.getFromLocalStorage('workspace');
    let workspaceId;
    if (workspaceFromStorage) {
      workspaceId = JSON.parse(workspaceFromStorage).id || '';
    }
    this.router.navigate([path, workspaceId || '']);
  }

  checkForActionPermission() {
    // get permission for operations
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.alloAddTask = this.permissionService.getModuleActionPermission(permission, MODULE_CONSTANTS.TASKS, ACTION_CONSTANTS.CREATE);
    }
  }
  ngOnInit() {
    const loggedInUserData = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string));
    this.loggedinUserid = loggedInUserData?.user_id;
    this.subscriptions.push(
      this.userService.getBreakTimeStatusProvider().subscribe((value: any) => {
        if (value) {
          this.timerStartedTaskId = null;
          this.timerCount = TASK_TIMER_DEFAULT_VALUE;
          this.timerSourceSubscription?.unsubscribe();
          this.userIsIntBreak = true;
          setTimeout(() => {
            this.tasksService.setRefetchProjectWiseTask(true);
          }, 1000);
        } else {
          this.userIsIntBreak = false;
        }
      })
    );
    this.getProjectWiseTasks();
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
    this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
  }
  getProjectWiseTasks() {
    this.taskToEdit = null;
    this.subscriptions.push(
      this.tasksService.getProjectWiseTasks().subscribe((projectWiseTask) => {
        this.taskList = projectWiseTask && projectWiseTask.length > 0 ? projectWiseTask : [];
        this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
        this.timerCount = TASK_TIMER_DEFAULT_VALUE;
        this.timerStartedTaskId = null;
        this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : null;
        this.taskList.forEach((group: any) => {
          group?.groupTasks?.forEach((task: any) => {
            if (task.total_worked_hours) {
              const timeParts = task.total_worked_hours.split(':');
              if (timeParts?.length > 2) {
                task.total_worked_hours = `${timeParts[0]}h ${timeParts[1]}m`;
              }
            }
            task?.working_users?.forEach((user: any) => {
              if (user.running_status === TASK_TIMER_CONSTANTS.ONGOING) {
                user['userDetails'] = task.team.find((teamMember: any) => teamMember.id === user.user_id);
              }
            });
            const otherUserIndex = task?.working_users?.findIndex(
              (user: any) => user.user_id !== this.loggedinUserid && user.running_status === TASK_TIMER_CONSTANTS.ONGOING
            );
            const userIndex = task?.working_users?.findIndex(
              (user: any) => user.user_id === this.loggedinUserid && user.running_status === TASK_TIMER_CONSTANTS.ONGOING
            );
            task['_other_user_working_status'] = false;
            task['_user_working_status'] = false;
            if (otherUserIndex !== -1) {
              task['_other_user_working_status'] = true;
            }
            if (userIndex !== -1) {
              task['_user_working_status'] = true;
              const dateOnTaskStarted = task?.working_users[userIndex]?.updated_at;
              this.timerCount = this.getTimerValue(0, 0, moment().diff(dateOnTaskStarted, 'seconds'));
              this.timerStartedTaskId = task.id;
              this.setTaskTimer();
            }
          });
        });
      })
    );
  }
  getTimerValue(hrs: number, mins: number, secs: number) {
    if (secs >= 60) {
      mins += secs / 60;
      secs = secs % 60;
    }
    if (mins >= 60) {
      hrs += mins / 60;
      mins = mins % 60;
    }
    const formattedHours = this.padNumber(parseInt(hrs.toString()));
    const formattedMinutes = this.padNumber(parseInt(mins.toString()));
    const formattedSeconds = this.padNumber(parseInt(secs.toString()));
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
  padNumber(number: number) {
    return number.toString().padStart(2, '0');
  }
  setTaskTimer() {
    this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
    this.timerSourceSubscription = this.timerSource.subscribe((response: any) => {
      const currentCount = this.incrementTaskTimerCount();
      this.timerCount = currentCount;
    });
  }
  incrementTaskTimerCount() {
    const [hours, minutes, seconds] = this.timerCount.split(':');
    const hoursValue = parseInt(hours);
    const minutesValue = parseInt(minutes);
    let secondsValue = parseInt(seconds);
    secondsValue++;

    return this.getTimerValue(hoursValue, minutesValue, secondsValue);
  }
  getTaskColor(task: any) {
    if (task.state) {
      const taskStyle = this.items.find((item: any) => item.value === task.state);
      return taskStyle.color;
    }
    return 'black';
  }
  getSelectedResponsiblePerson(eventArgs: any, taskObject: any) {
    const requestBody = {
      taskType: taskObject.type,
      projectId: taskObject.project_id,
      taskId: taskObject.id,
      title: taskObject.title,
      assignee: eventArgs.id,
      status: taskObject.status,
      state: taskObject.state,
      documents: taskObject.documents,
      parentTaskId: taskObject.parent_task_id,
      labels: taskObject.task_labels,
      subscribers: taskObject.subscribers,
      section: taskObject.section,
    };
    this.updateTask(requestBody);
  }
  async updateTask(requestBody: any, fieldToUpdate: any = null) {
    const formData = new FormData();
    formData.append(TASK_REQUEST_KEYS_CONSTANTS.PROJECT_ID, requestBody.projectId.toString() || null);
    formData.append(TASK_REQUEST_KEYS_CONSTANTS.TYPE, requestBody.taskType || '');
    formData.append(TASK_REQUEST_KEYS_CONSTANTS.TITLE, requestBody.title || '');
    formData.append(TASK_REQUEST_KEYS_CONSTANTS.ASIGNEE, requestBody.assignee);
    formData.append(TASK_REQUEST_KEYS_CONSTANTS.STATUS, requestBody.status);
    formData.append(TASK_REQUEST_KEYS_CONSTANTS.STATE, requestBody.state.toString().toLowerCase().replaceAll(' ', ''));
    formData.append(TASK_REQUEST_KEYS_CONSTANTS.DOCUMENTS, JSON.stringify(requestBody.documents ? requestBody.documents : []));
    formData.append(TASK_REQUEST_KEYS_CONSTANTS.DELETED_DOCUMENTS, JSON.stringify([]));
    formData.append(TASK_REQUEST_KEYS_CONSTANTS.PARENT_TASK_ID, requestBody.parentTaskId || null);
    formData.append(TASK_REQUEST_KEYS_CONSTANTS.LABELS, JSON.stringify(requestBody.labels ? requestBody.labels : []));
    formData.append(TASK_REQUEST_KEYS_CONSTANTS.SUBSCRIBERS, JSON.stringify(requestBody.subscribers ? requestBody.subscribers : []));
    if (fieldToUpdate === 'section') {
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.SECTION, requestBody.section);
    }
    await this.tasksService.updateTask(formData, Encryption._doEncrypt(requestBody.taskId.toString()), 'true').subscribe({
      next: (response: any) => {
        if (response) {
          if (response.status === 200 && response.success) {
            this.snackBar.open(response.message || 'Task changes applied successfully.');
            this.tasksService.setRefetchProjectWiseTask(true);
          }
        }
      },
      error: (error: any) => {
        console.log('error:', error);
      },
    });
  }

  editTaskLables(eventArgs: any) {
    this.editLabels = eventArgs;
    this.tasksService.getTaskLabels(eventArgs.project_id).subscribe(
      (response: any) => {
        if (response && response.data) {
          this.availableProjectLabels = response.data;
          this.taskLabels.patchValue([...(eventArgs.task_labels || [])]);
        } else {
          this.availableProjectLabels = [];
        }
      },
      (err) => {
        console.log(err);
        this.availableProjectLabels = [];
      }
    );
  }
  onRemoveTaskLabel(eventArgs: any) {
    const items = this.taskLabels.value;
    const updatedItems = items?.filter((item: any) => item.id !== eventArgs.id) || [];
    this.taskLabels.patchValue(updatedItems);
  }
  onLabelColorChange(evnetArgs: any) {
    const items = this.taskLabels.value || [];
    if (items.length > 0) {
      items[items.length - 1].color = evnetArgs;
    }
    this.taskLabels.patchValue(items);
    this.toggleLabelColorPicker();
  }
  toggleLabelColorPicker() {
    this.toggle = !this.toggle;
  }
  saveLabels(taskObject: any) {
    const requestBody = {
      taskType: taskObject.type,
      projectId: taskObject.project_id,
      taskId: taskObject.id,
      title: taskObject.title,
      assignee: taskObject.assignee,
      status: taskObject.status,
      state: taskObject.state,
      documents: taskObject.documents,
      parentTaskId: taskObject.parent_task_id,
      labels: this.taskLabels.value || [],
      subscribers: taskObject.subscribers,
      section: taskObject.section,
    };
    this.updateTask(requestBody).then(() => {
      this.editLabels = null;
    });
  }
  onTaskLabelSelect(eventArgs: any) {
    const items = this.taskLabels.value || [];
    items?.push({
      id: eventArgs && eventArgs.id ? eventArgs.id : '',
      title: eventArgs && eventArgs.title ? eventArgs.title : eventArgs,
      project_id: eventArgs && eventArgs.project_id ? eventArgs.project_id : this.editLabels.project_id || '',
      color: eventArgs && eventArgs.color ? eventArgs.color : DEFAULT_LABEL_COLOR_CONSTANTS.color,
    });
    if (!eventArgs.id) {
      this.toggleLabelColorPicker();
    }
    this.taskLabels.patchValue(items);

    this.isOverlayOpenForTaskLabels = false;
  }
  toogleTimer(taskDetails: any) {
    if (taskDetails.state !== 'completed') {
      const timerRequestBody: TaskTimerRequestModel = {
        task_id: taskDetails.id,
      };
      if (taskDetails && taskDetails._user_working_status) {
        this.spinnerService.showSpinner();
        this.subscriptions.push(
          this.tasksService.stopTaskTimer(timerRequestBody).subscribe({
            next: (response: toggleTaskTimerResponseModel) => {
              if (response) {
                this.spinnerService.hideSpinner();
                if (response.success) {
                  this.timerStartedTaskId = null;
                  this.timerCount = TASK_TIMER_DEFAULT_VALUE;
                  this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
                  this.tasksService.setRefetchProjectWiseTask(true);
                  this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.BREAK_TIME_TASK, Encryption._doEncrypt(JSON.stringify(0)));
                }
              }
            },
            error: (error: any) => {
              console.log('error:', error);
              this.spinnerService.hideSpinner();
            },
          })
        );
      } else {
        // if (taskDetails.running_status === TASK_TIMER_CONSTANTS.ONGOING) {
        //   this.snackBar.open('You can not perform this action, because this task is not assigned to you');
        // } else {
        if (!this.userIsIntBreak) {
          this.timerCount = TASK_TIMER_DEFAULT_VALUE;
          this.subscriptions.push(
            this.tasksService.startTaskTimer(timerRequestBody).subscribe({
              next: (response: toggleTaskTimerResponseModel) => {
                if (response) {
                  this.spinnerService.hideSpinner();
                  if (response.success) {
                    this.timerStartedTaskId = taskDetails.id;
                    this.setTaskTimer();
                    this.tasksService.setRefetchProjectWiseTask(true);
                    this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.BREAK_TIME_TASK, Encryption._doEncrypt(JSON.stringify(this.timerStartedTaskId)));
                  }
                }
              },
              error: (error: any) => {
                console.log('error:', error);
                this.spinnerService.hideSpinner();
              },
            })
          );
          //}
        }
      }
    }
  }

  getSelectedTaskStatus(status: any, taskDetails?: any) {
    if (taskDetails) {
      // this.currentState = status.name;
      // ;
      const requestBody = {
        taskType: taskDetails.type,
        projectId: taskDetails.project_id,
        taskId: taskDetails.id,
        title: taskDetails.title,
        assignee: taskDetails?.assignee?.toString() || null,
        status: status.id,
        state: status.state,
        documents: taskDetails.documents,
        parentTaskId: taskDetails.parent_task_id,
        labels: taskDetails.task_labels,
        subscribers: taskDetails.subscribers,
      };
      this.updateTask(requestBody).then(() => {
        this.isOverlayTaskStatus[taskDetails] = false;
      });
    }
  }

  async toggleOverlayTaskStatusSelection(taskDetails?: any) {
    await this.statusService.getAllStatuses(taskDetails.project_id.toString()).subscribe((response: any) => {
      if (response?.data && response?.data?.length > 0) {
        this.projectStatusList = response?.data?.map((_status: any) => {
          return {
            ..._status,
            name: _status.title,
          };
        });
      } else {
        this.projectStatusList = [];
      }
      if (this.selectedItem === taskDetails) {
        this.isOverlayTaskStatus[taskDetails] = !this.isOverlayTaskStatus[taskDetails];
      } else {
        this.selectedItem = taskDetails;
        this.isOverlayTaskStatus[taskDetails] = true;
      }
    });
  }
  onNewTaskClick(projectObject: any) {
    if (projectObject.groupId) {
      this.taskList.forEach((taskObject: any) => {
        // toggle show new task component
        if (taskObject.groupId === projectObject.groupId) {
          if (projectObject.options) {
            this.newTaskStateAndStatus.taskState = projectObject.options.taskState ? projectObject.options.taskState : '';
            this.newTaskStateAndStatus.taskStatudId = projectObject.options.taskStatudId ? projectObject.options.taskStatudId : '';
          }
          taskObject.isShowNewTask = true;
        } else {
          taskObject.isShowNewTask = false;
        }
      });
    }
  }
  viewAllTask(groupBy: any, groupId: any) {
    this.tasksService.setViewAllTasks({
      groupType: groupBy,
      groupId: groupId,
    });
  }

  onEmmitTaskStatusEventChanged(event: any, projectObject: any) {
    if (event) {
      // check if task is cancelled
      if (event.isTaskCancelled) {
        projectObject.isShowNewTask = false;
      } else if (event.isTaskCreated) {
        // check if task is created
        if (event.createdTaskDetail) {
          projectObject.isShowNewTask = false;
          this.tasksService.setRefetchProjectWiseTask(true);

          // ----------------------------------------------------------------
          // DO NOT REMOVE BELOW COMMENTED CODE
          //----------------------------------------------------------------

          // find project and it's tasklist, if found then push task response in tasklist
          // if (projectObject.groupType) {
          //   // check if selectedGroupByFilter = project_id
          //   if (projectObject.groupType.toLocaleLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.PROJECT.toLocaleLowerCase()) {
          //     if (event.createdTaskDetail.project_id) {
          //       const findProjectIndex = this.taskList.findIndex((taskObject: any) => taskObject.groupId == event.createdTaskDetail.project_id);
          //       if (findProjectIndex > -1) {
          //         this.pushTaskObjectInTaskList(findProjectIndex, event.createdTaskDetail);
          //       }
          //     }
          //   }
          //   // check if selectedGroupByFilter = state
          //   else if (projectObject.groupType.toLocaleLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.STATE.toLowerCase()) {
          //     //find state from tasklist (will be available in projectTitle field)
          //     const findStateIndex = this.taskList.findIndex(
          //       (taskObject: any) => taskObject.groupId.toLocaleLowerCase() == event.createdTaskDetail.state.toLocaleLowerCase()
          //     );
          //     if (findStateIndex > -1) {
          //       this.pushTaskObjectInTaskList(findStateIndex, event.createdTaskDetail);
          //     }
          //   }
          //   // check if selectedGroupByFilter = assignee
          //   else if (projectObject.groupType.toLocaleLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.ASSIGNEE.toLowerCase()) {
          //     // find assigned to user by userId from tasklist
          //     const findIndexForAssignee = this.taskList.findIndex((taskObject: any) => taskObject.groupId == event.createdTaskDetail.assignee);
          //     if (findIndexForAssignee > -1) {
          //       this.pushTaskObjectInTaskList(findIndexForAssignee, event.createdTaskDetail);
          //     }
          //   }
          //   // check if selectedGroupByFilter = status
          //   else if (projectObject.groupType.toLocaleLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.STATUS.toLowerCase()) {
          //     if (event.createdTaskDetail.status) {
          //       const findStatusIndex = this.taskList.findIndex((taskObject: any) => taskObject.groupId == event.createdTaskDetail.status);
          //       if (findStatusIndex > -1) {
          //         this.pushTaskObjectInTaskList(findStatusIndex, event.createdTaskDetail);
          //       }
          //     }
          //   }
          //   // check if selectedGroupByFilter = section
          //   else if (projectObject.groupType.toLowerCase() == TASK_GROUP_BY_FILTER_CONSTANTS.SECTION.toLowerCase()) {
          //     if (event.createdTaskDetail.section) {
          //       const taskSectionIndex = this.taskList.findIndex((taskObject: any) => taskObject.groupId == event.createdTaskDetail.section);
          //       if (taskSectionIndex > -1) {
          //         this.pushTaskObjectInTaskList(taskSectionIndex, event.createdTaskDetail);
          //       }
          //     }
          //   }
          //   projectObject.isShowNewTask = false;
          // }

          // ----------------------------------------------------------------
          // DO NOT REMOVE ABOVE COMMENTED CODE
          //----------------------------------------------------------------
        }
      }
    }
  }

  navigateToTaskDetail(taskId: string) {
    if (taskId) {
      taskId = Encryption._doEncrypt(taskId.toString());
      this.router.navigate(['/tasks/update', taskId], {
        queryParams: { r_url: 'board' },
      });
    }
  }
  navigateToAddTask() {
    // check if p_id exists in url then pass project id in add task page query parameters
    if (this.router.url && this.router.url.includes(PROJECT_ID_QUERY_PARAM_CONSTANT)) {
      const project_id = this.route.snapshot.queryParams[PROJECT_ID_QUERY_PARAM_CONSTANT];
      if (project_id) {
        this.router.navigate(['tasks', 'add'], {
          queryParams: { p_id: project_id, r_url: 'board' },
        });
      } else {
        this.router.navigate(['tasks', 'add'], {
          queryParams: { r_url: 'board' },
        });
      }
    } else {
      this.router.navigate(['tasks', 'add'], {
        queryParams: { r_url: 'board' },
      });
    }
  }
}
