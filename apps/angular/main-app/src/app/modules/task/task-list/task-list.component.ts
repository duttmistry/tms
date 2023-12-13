import { ActivatedRoute, Router } from '@angular/router';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { TaskService } from '../../../core/services/module/tasks/task.service';
import { FormControl } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { StorageService } from '../../../core/services/common/storage.service';
import { Observable, Subscription, findIndex, interval, map, startWith } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Task_Type_Enum, Task_Type_Enum_Color_Codes } from '@tms-workspace/enum-data';
import { Utility } from '../../../core/utilities/utility';
import { Encryption } from '@tms-workspace/encryption';
import {
  ACTION_CONSTANTS,
  CREATE_MESSAGES_IN_POPUP,
  DATE_FORMAT_CONSTANTS,
  DEFAULT_LABEL_COLOR_CONSTANTS,
  MODULE_CONSTANTS,
  PERMISSION_CONSTANTS,
  PROJECT_ID_QUERY_PARAM_CONSTANT,
  STORAGE_CONSTANTS,
  TASK_GROUP_BY_FILTER_CONSTANTS,
  TASK_PRIORITY_COLOR_CONSTANTS,
  TASK_PRIORITY_CONSTANTS,
  TASK_REQUEST_KEYS_CONSTANTS,
  TASK_TIMER_CONSTANTS,
  TASK_TIMER_DEFAULT_VALUE,
} from '../../../core/services/common/constants';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { StatusService } from '../../../core/services/module/projects/status.service';
import { response } from 'express';
import {
  PostTaskSectionModel,
  SectionObjectModel,
  SectionResponseModel,
  TaskStateAndStatusModel,
  TaskTimerRequestModel,
  toggleTaskTimerResponseModel,
} from '../../../core/model/task/task.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GlobalService } from '../../../core/services/common/global.service';
import { ProjectsService } from '../../../core/services/module/projects/projects.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import * as moment from 'moment';
import { UserService } from '../../../core/services/module/users/users.service';
import { SnackbarComponent } from '@tms-workspace/material-controls';
import { CommentDialogComponent } from '../../../shared/components/comment-popup-dialog/comment-dialog.component';
import { Dialog } from '@angular/cdk/dialog';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'main-app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
})
export class TaskListComponent implements OnInit, AfterViewInit, OnDestroy {
  //#region [ Data members]
  @ViewChild('countUpRef', { static: false }) countUpRef!: ElementRef;
  workspaceID: any;
  filterData: any;
  isShowNewTask = false;
  taskTitle: FormControl = new FormControl('');
  taskList: any = [];
  subscriptions: Subscription[] = [];

  taskTypeList = ['Task', 'Bug', 'Epic'];
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
  PRIORITY = TASK_PRIORITY_CONSTANTS;
  PRIORITYCOLOR: any = TASK_PRIORITY_COLOR_CONSTANTS;
  priorityList: any = [];
  taskIdToUpdateETA: any = null;
  permissionDetails = {
    allowUpdate: true,
    taskType: {
      edit: true,
    },
    substatus: {
      edit: true,
    },
    priority: {
      edit: true,
    },
    section: {
      edit: true,
    },
    labels: {
      edit: true,
    },
    assignee: {
      edit: true,
    },
    dueDate: {
      edit: true,
    },
    eta: {
      edit: true,
    },
  };
  assigneeSelectionTaskId = null;
  isLoadingMainContent = true;
  isLabelsChanged = false;
  filteredAvailableLabels: any = [];
  selectedAssignees: any = [];
  displayAssigneeCloseIcon = false;
  displayEtaCloseIcon = false;
  hoverId = null;
  isSingleProjectSelected = false;
  showSpinner = true;
  noRecordsQuickTaskViewed = false;
  currentTaskIdToEdit = null;
  selectedTasks: any = [];
  includeDiffrentProjects = false;
  isCopyBulkDataOpen = false;
  isBlkEtaOverlayOpen = false;
  cpTaskFields = [
    { text: 'Task ID', checked: true },
    { text: 'Task title', checked: true },
    { text: 'Task assignee', checked: true },
    { text: 'Task sub-status', checked: true },
    { text: 'Due Date', checked: true },
    { text: 'ETA', checked: true },
    { text: 'Time Worked', checked: true },
    { text: 'Task link', checked: true },
    { text: 'Project Name', checked: true },
  ];
  bulkOpValues: any = {};
  taskContstants = TASK_REQUEST_KEYS_CONSTANTS;
  blkLabelSelectionOpen = false;
  blkLabels: any = [];
  filteredBlkLabels: any = [];
  taskStateList = Utility.stateList.map((state: any) => {
    return {
      name: state.title,
      id: state.title.length + 1,
      color: state.color,
      value: state.value,
    };
  });
  isBlkTaskStatusOpen = false;
  blkProjectStausList = [];
  isBlkAssigneePopupOpen = false;
  blkUserList: any = [];
  blkUserFilterList: any = [];
  //#endregion

  //#region [Member Functions]

  //#region [skeleton Methods]
  constructor(
    private globalService: GlobalService,
    private router: Router,
    private tasksService: TaskService,
    private storageService: StorageService,
    private dialog: MatDialog,
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
  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }
  ngOnInit() {
    this.setPriorityList();
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
    this.setFieldPermissions();
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
    this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
  }
  //#endregion

  //#region [Data Pre Processing]
  getTypeBaseColor(taskType: any) {
    switch (taskType) {
      case Task_Type_Enum.Epic:
        return Task_Type_Enum_Color_Codes.Epic;
      case Task_Type_Enum.Task:
        return Task_Type_Enum_Color_Codes.Task;
      case Task_Type_Enum.Bug:
        return Task_Type_Enum_Color_Codes.Bug;
      default:
        return '';
    }
  }
  setPriorityList() {
    if (this.priorityList) {
      Object.values({ ...this.PRIORITY }).forEach((task: string) => {
        if (task) {
          this.priorityList.push({ id: this.priorityList.length + 1, name: task, priorityImg: task.toLowerCase() + '-priority.svg' });
        }
      });
    }
  }
  getProjectWiseTasks() {
    this.showSpinner = true;
    this.taskToEdit = null;
    this.subscriptions.push(
      this.tasksService.getProjectWiseTasks().subscribe((projectWiseTask) => {
        this.selectedTasks = [];
        this.bulkOpValues = {};
        this.blkLabels = [];
        this.filteredBlkLabels = [];
        this.taskList = projectWiseTask && projectWiseTask.length > 0 ? projectWiseTask : [];
        this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
        this.timerCount = TASK_TIMER_DEFAULT_VALUE;
        this.timerStartedTaskId = null;
        this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : null;
        this.taskList.forEach((group: any) => {
          if (group) {
            group['allSelected'] = false;
          }
          group?.groupTasks?.forEach((task: any) => {
            if (task) {
              task['itemChecked'] = false;
            }
            // if (task.assignee) {
            //   const taskAssignee = task?.team?.find((user: any) => user?.id?.toString() === task?.assignee?.toString());//   task['task_assignee'] = taskAssignee ? taskAssignee : task['task_assignee'];
            // }
            task['taskTypeIndicator'] = this.getTypeBaseColor(task.type);
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
              this.setTaskTimer(dateOnTaskStarted);
            }

            // Pre-Process Due Date
            if (task.due_date) {
              const dueDateObj = moment(task.due_date).format('DD/MM/YYYY');
              const today = moment().format('DD/MM/YYYY');
              const tomorrow = moment().add(1, 'day').format('DD/MM/YYYY');
              const yesterday = moment().subtract(1, 'day').format('DD/MM/YYYY');
              if (dueDateObj === today) {
                task.forMattedDueDate = 'Today'; // If the date is today, display 'Today'
              } else if (dueDateObj === tomorrow) {
                task.forMattedDueDate = 'Tomorrow'; // If the date is tomorrow, display 'Tomorrow'
              } else if (dueDateObj === yesterday) {
                task.forMattedDueDate = 'Yesterday';
                task.alertIndicate = true;
              } else {
                task.forMattedDueDate = dueDateObj; // Otherwise, display the date in 'yyyy-MM-dd' format
                if (moment().isAfter(moment(task.due_date))) {
                  task.alertIndicate = true;
                }
              }
            } else {
              task.forMattedDueDate = '';
            }

            // Pre-Process ETA
            const etaSeconds = this.timeToSeconds(task.eta);
            const totalSeconds = this.timeToSeconds(task.total_worked_hours);
            task.workHrsAlertIndication = etaSeconds < totalSeconds;
          });
        });

        this.isLoadingMainContent = false;
        this.showSpinner = false;
        this.selectedTasks = [];
      })
    );
  }
  getTaskColor(task: any) {
    if (task.state) {
      const taskStyle = this.items.find((item: any) => item.value === task.state);
      return taskStyle.color;
    }
    return 'black';
  }
  loadChangeSectionData(projectId: any, taskId: any) {
    if (projectId) {
      this.subscriptions.push(
        this.tasksService.getTaskSectionsFromProject(Encryption._doEncrypt(projectId.toString())).subscribe({
          next: (response: SectionResponseModel) => {
            if (response) {
              if (response.data && response.data.length > 0) {
                this.sectionsList = response.data;
                this.taskToEdit = taskId;
              } else {
                this.sectionsList = [];
                this.taskToEdit = taskId;
              }
            }
          },
          error: (error: any) => {
            console.log('error:', error);
          },
        })
      );
    }
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
    formData.append(TASK_REQUEST_KEYS_CONSTANTS.PRIORITY, requestBody.priority);
    formData.append(TASK_REQUEST_KEYS_CONSTANTS.ASSIGNEE_USER, JSON.stringify(requestBody.assigneeUser || ''));

    if (fieldToUpdate === 'section') {
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.SECTION, requestBody.section);
    }
    if (fieldToUpdate === 'dueDate') {
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.DUE_DATE, requestBody.dueDate);
    }
    if (fieldToUpdate === 'eta') {
      formData.append(TASK_REQUEST_KEYS_CONSTANTS.ETA, requestBody.eta);
    }
    await this.tasksService.updateTask(formData, Encryption._doEncrypt(requestBody.taskId.toString()), 'true').subscribe({
      next: (response: any) => {
        if (response) {
          if (response.status === 200 && response.success) {
            this.snackBar.openFromComponent(SnackbarComponent, {
              data: { message: response.message || 'Task changes applied successfully.' },
            });

            this.tasksService.setRefetchProjectWiseTask(true);
          }
        }
      },
      error: (error: any) => {
        console.log('error:', error);
      },
    });
    this.currentTaskIdToEdit = null;
  }
  editTaskLables(eventArgs: any) {
    this.tasksService.getTaskLabels(eventArgs.project_id).subscribe(
      (response: any) => {
        this.isLabelsChanged = false;
        if (response && response.data) {
          this.availableProjectLabels = response.data;
          this.taskLabels.patchValue([...(eventArgs.task_labels || [])]);
        } else {
          this.availableProjectLabels = [];
        }
        this.resetFilteredLabels();
        this.editLabels = eventArgs;
        this.currentTaskIdToEdit = eventArgs?.id;
      },
      (err) => {
        console.log(err);
        this.availableProjectLabels = [];
        this.resetFilteredLabels();
      }
    );
  }
  resetFilteredLabels() {
    const selectedLabels = this.taskLabels.value || [];
    if (selectedLabels) {
      this.filteredAvailableLabels = this.availableProjectLabels.filter(
        (label: any) => selectedLabels.findIndex((item: any) => item.title === label.title) === -1
      );
    }
  }
  saveLabels(taskObject: any) {
    if (this.isLabelsChanged) {
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
        priority: taskObject.priority,
        assigneeUser: taskObject?.task_assignee,
      };
      this.updateTask(requestBody).then(() => {
        this.editLabels = null;
      });
    }
  }
  private timeToSeconds(time: string): number {
    time = time ?? '0'; // If time is null, assign '0' as the default value
    const timeParts = time.split(' ');
    let seconds = 0;
    for (const part of timeParts) {
      if (part.endsWith('h')) {
        seconds += parseInt(part, 10) * 3600; // Convert hours to seconds
      } else if (part.endsWith('m')) {
        seconds += parseInt(part, 10) * 60; // Convert minutes to seconds
      }
    }
    return seconds;
  }
  //#endregion

  //#region [Task Timer]
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
  toogleTimer(taskDetails: any) {
    if (taskDetails.state !== 'completed') {
      const timerRequestBody: TaskTimerRequestModel = {
        task_id: taskDetails.id,
      };
      if (taskDetails && taskDetails._user_working_status) {
        const dialogRef = this.dialog.open(CommentDialogComponent, {
          width: '450px',
          data: {
            label: '',
            title: 'Work Description',
            comment_required: false,
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result.confirm) {
            timerRequestBody.comment = result.comment;
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
          }
        });
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
                    this.setTaskTimer((response.data as any).updated_at);
                    this.tasksService.setRefetchProjectWiseTask(true);
                    this.storageService.setIntoLocalStorage(
                      STORAGE_CONSTANTS.BREAK_TIME_TASK,
                      Encryption._doEncrypt(JSON.stringify(this.timerStartedTaskId))
                    );
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
  setTaskTimer(start_time: string) {
    this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
    this.timerSourceSubscription = this.timerSource.subscribe((response: any) => {
      const currentCount = this.incrementTaskTimerCount(start_time);
      this.timerCount = currentCount;
    });
  }
  incrementTaskTimerCount(start_time: string) {
    // const [hours, minutes, seconds] = this.timerCount.split(':');
    // const hoursValue = parseInt(hours);
    // const minutesValue = parseInt(minutes);
    // let secondsValue = parseInt(seconds);
    // secondsValue++;

    return this.getTimerValue(0, 0, moment().diff(start_time, 'seconds'));
  }
  padNumber(number: number) {
    return number.toString().padStart(2, '0');
  }

  //#endregion

  //#region [Permission]
  checkForActionPermission() {
    // get permission for operations
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.alloAddTask = this.permissionService.getModuleActionPermission(permission, MODULE_CONSTANTS.TASKS, ACTION_CONSTANTS.CREATE);
      // console.log('this.alloAddTask:', this.alloAddTask);
    }
  }
  setFieldPermissions() {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      const allowToView = this.permissionService.getModuleActionPermission(permission, 'tasks', ACTION_CONSTANTS.VIEW);
      if (!allowToView) {
        this.router.navigate(['unauthorized-access']);
      }
      const actionEditPermissionData = this.permissionService.getModuleActionPermissionData(
        permission,
        MODULE_CONSTANTS.TASKS,
        ACTION_CONSTANTS.EDIT
      );
      this.permissionDetails.allowUpdate = actionEditPermissionData.update;

      // Assigned To
      const assigneeObject = actionEditPermissionData.fields.find((fieldObject: any) => fieldObject['assign to'] !== undefined);
      this.permissionDetails.assignee.edit = assigneeObject && assigneeObject['assign to'];

      // Due Date
      const dueDateObject = actionEditPermissionData.fields.find((fieldObject: any) => fieldObject['task dueDate'] !== undefined);
      this.permissionDetails.dueDate.edit = dueDateObject && dueDateObject['task dueDate'];

      // ETA
      const etaObject = actionEditPermissionData.fields.find((fieldObject: any) => fieldObject['estimated time'] !== undefined);
      this.permissionDetails.eta.edit = etaObject && etaObject['estimated time'];

      // Labels
      const labelsObject = actionEditPermissionData.fields.find((fieldObject: any) => fieldObject['task labels'] !== undefined);
      this.permissionDetails.labels.edit = labelsObject && labelsObject['task labels'];

      // Priority
      const priorityObject = actionEditPermissionData.fields.find((fieldObject: any) => fieldObject['task priority'] !== undefined);
      this.permissionDetails.priority.edit = priorityObject && priorityObject['task priority'];

      // Section
      const sectionObject = actionEditPermissionData.fields.find((fieldObject: any) => fieldObject['task type'] !== undefined);
      this.permissionDetails.section.edit = true;

      // Task type
      const taskTypeObject = actionEditPermissionData.fields.find((fieldObject: any) => fieldObject['task type'] !== undefined);
      this.permissionDetails.taskType.edit = taskTypeObject && taskTypeObject['task type'];

      // Task state
      const taskStateObject = actionEditPermissionData.fields.find((fieldObject: any) => fieldObject['task status'] !== undefined);
      this.permissionDetails.substatus.edit = taskStateObject && taskStateObject['task status'];
    }
  }

  //#endregion

  //#region [Event Handlers]
  onNewTaskClick(projectObject: any) {
    if (projectObject) {
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
  onAddTask(projectIndex?: number) {
    if (this.taskTitle.value) {
      if (projectIndex != undefined && projectIndex > -1) {
        this.taskList[projectIndex].projectTasks.push({
          taskTitle: this.taskTitle.value,
          taskStatus: '',
        });
        this.taskList[projectIndex].isShowNewTask = false;
        this.taskTitle.reset();
      }
    }
  }
  onCancelTask(projectIndex?: number) {
    if (projectIndex != undefined && projectIndex > -1) {
      this.taskList[projectIndex].isShowNewTask = false;
    } else {
      this.isShowNewTask = false;
    }
  }

  drop(event: CdkDragDrop<string[]>, projectIndex?: number) {
    if (projectIndex != undefined && projectIndex > -1) {
      moveItemInArray(this.taskList[projectIndex].projectTasks, event.previousIndex, event.currentIndex);
    } else {
      moveItemInArray(this.taskList, event.previousIndex, event.currentIndex);
    }
  }
  onStatusChange(event: any, taskObject: any) {
    taskObject.taskStatus.statusColor = event.statusColor;
  }

  onTaskTypeChange(taskTypeObject: any, taskObject: any) {
    const requestBody = {
      taskType: taskTypeObject,
      projectId: taskObject.project_id,
      taskId: taskObject.id,
      title: taskObject.title,
      assignee: taskObject.assignee,
      status: taskObject.status,
      state: taskObject.state,
      documents: taskObject.documents,
      parentTaskId: taskObject.parent_task_id,
      labels: taskObject.task_labels,
      subscribers: taskObject.subscribers,
      priority: taskObject.priority,
      assigneeUser: taskObject?.task_assignee,
    };
    this.updateTask(requestBody);
  }
  // navigate to add task page
  navigateToAddTask() {
    // check if p_id exists in url then pass project id in add task page query parameters
    if (this.router.url && this.router.url.includes(PROJECT_ID_QUERY_PARAM_CONSTANT)) {
      const project_id = this.route.snapshot.queryParams[PROJECT_ID_QUERY_PARAM_CONSTANT];
      if (project_id) {
        this.router.navigate(['tasks', 'add'], {
          queryParams: { p_id: project_id, r_url: 'list' },
        });
      } else {
        this.router.navigate(['tasks', 'add'], {
          queryParams: { r_url: 'list' },
        });
      }
    } else {
      this.router.navigate(['tasks', 'add'], {
        queryParams: { r_url: 'list' },
      });
    }
  }

  async toggleOverlayTaskStatusSelection(taskDetails?: any) {
    if (this.permissionDetails.allowUpdate && this.permissionDetails.substatus.edit) {
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
          this.currentTaskIdToEdit = taskDetails?.id;
        } else {
          this.selectedItem = taskDetails;
          this.isOverlayTaskStatus[taskDetails] = true;
          this.currentTaskIdToEdit = taskDetails?.id;
        }
      });
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
        priority: taskDetails.priority,
        assigneeUser: taskDetails?.task_assignee,
      };
      this.updateTask(requestBody).then(() => {
        this.isOverlayTaskStatus[taskDetails] = false;
      });
    }
  }

  // this event will check if quick task is cancelled or created
  onEmmitTaskStatusEventChanged(event: any, projectObject: any) {
    if (event) {
      // check if task is cancelled
      if (event.isTaskCancelled) {
        if (projectObject) {
          projectObject.isShowNewTask = false;
        } else {
          this.noRecordsQuickTaskViewed = false;
        }
      } else if (event.isTaskCreated) {
        // check if task is created
        if (event.createdTaskDetail) {
          if (projectObject) {
            projectObject.isShowNewTask = false;
          } else {
            this.noRecordsQuickTaskViewed = false;
          }
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
  navigateToGivenPath(path: string) {
    const workspaceId = this.storageService.getFromLocalStorage('workspace');
    this.router.navigate([path, workspaceId || '']);
  }
  navigateToTaskDetail(taskId: string) {
    if (taskId) {
      taskId = Encryption._doEncrypt(taskId.toString());
      this.router.navigate(['/tasks/view', taskId], {
        queryParams: { r_url: 'list' },
      });
    }
  }
  EncryptId(taskId: string) {
    return Encryption._doEncrypt(taskId.toString());
  }
  onChangeSection(eventArgs: any, taskObject: any) {
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
      labels: taskObject.task_labels,
      subscribers: taskObject.subscribers,
      section: taskObject.section,
      priority: taskObject.priority,
      assigneeUser: taskObject?.task_assignee,
    };
    if (eventArgs.id) {
      requestBody.section = eventArgs.id;
      this.updateTask(requestBody, 'section').then((this.taskToEdit = null));
    } else {
      const sectionDetails: PostTaskSectionModel = {
        project_id: requestBody.projectId,
        title: eventArgs,
      };
      this.createAndSaveSection(sectionDetails, requestBody);
    }
  }

  updateDueDate(eventArgs: any, taskObject: any) {
    const dueDate = eventArgs?.value?.format(DATE_FORMAT_CONSTANTS.YYYY_MM_DD);
    if (dueDate) {
      const startDateControlValue = moment(taskObject.start_date).format(DATE_FORMAT_CONSTANTS.YYYY_MM_DD);
      const isStartDateGreaterThanDueDate = moment(startDateControlValue).isAfter(dueDate);
      if (!isStartDateGreaterThanDueDate) {
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
          labels: taskObject.task_labels,
          subscribers: taskObject.subscribers,
          priority: taskObject.priority,
          dueDate: dueDate,
          assigneeUser: taskObject?.task_assignee,
        };
        this.updateTask(requestBody, 'dueDate');
      } else {
        this.snackBar.openFromComponent(SnackbarComponent, {
          data: { message: 'The Due Date cannot be earlier than the Start Date.' },
          duration: 45000,
        });
      }
    }
  }
  removeEtaFromTask(taskObject: any) {
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
      labels: taskObject.task_labels,
      subscribers: taskObject.subscribers,
      priority: taskObject.priority,
      eta: '',
      assigneeUser: taskObject?.task_assignee,
    };
    this.updateTask(requestBody, 'eta');
  }

  toggleETAOverlay(taskObject: any) {
    this.taskIdToUpdateETA = taskObject.id;
    this.currentTaskIdToEdit = taskObject?.id;
  }
  getSelectedETA(event: any, taskObject: any) {
    // check if emmited time includes 'Minutes'

    if (event && event.trim()) {
      const ETAToPass = this.fetchEtaDetails(event);
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
        labels: taskObject.task_labels,
        subscribers: taskObject.subscribers,
        priority: taskObject.priority,
        eta: ETAToPass,
        assigneeUser: taskObject?.task_assignee,
      };
      this.updateTask(requestBody, 'eta');
      this.taskIdToUpdateETA = null;
    }
  }
  fetchEtaDetails(event: any) {
    if (event && event.trim()) {
      let ETAToPass = '';
      if (event.includes('')) {
        const ETAArray = event.split(' ') || [];
        let ETAHours: any = '';
        let ETAMinutes: any = '';
        // check if event includes minutes then calculate minutes to hours
        if (event.includes('M')) {
          if (ETAArray[2] && !isNaN(ETAArray[2])) {
            ETAHours = Math.floor(ETAArray[2] / 60);
            ETAMinutes = ETAArray[2] % 60;
          } else if (ETAArray[0] && !isNaN(ETAArray[0])) {
            ETAHours = Math.floor(ETAArray[0] / 60);
            ETAMinutes = ETAArray[0] % 60;
          }
        }
        if (ETAArray && ETAArray.length > 0) {
          // check if hours exist in array;
          if (ETAArray.join('').includes('H')) {
            if (ETAArray[0] && !isNaN(ETAArray[0])) {
              ETAToPass = `${+ETAArray[0] + ETAHours}h`;
            }
          } else if (ETAHours) {
            ETAToPass = `${ETAHours}h`;
          }
          if (ETAArray.join('').includes('M')) {
            ETAToPass = `${ETAToPass} ${ETAMinutes ? ETAMinutes + 'm' : ''}`;
          }
        }
      }
      return ETAToPass?.trim();
    }
    return '';
  }
  removeSectionFromTask(taskObject: any) {
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
      labels: taskObject.task_labels,
      subscribers: taskObject.subscribers,
      section: null,
      priority: taskObject.priority,
      assigneeUser: taskObject?.task_assignee,
    };
    this.updateTask(requestBody, 'section');
  }
  removeAssigneeFromTask(taskObject: any) {
    const requestBody = {
      taskType: taskObject.type,
      projectId: taskObject.project_id,
      taskId: taskObject.id,
      title: taskObject.title,
      assignee: null,
      status: taskObject.status,
      state: taskObject.state,
      documents: taskObject.documents,
      parentTaskId: taskObject.parent_task_id,
      labels: taskObject.task_labels,
      subscribers: taskObject.subscribers,
      section: null,
      priority: taskObject.priority,
      assigneeUser: null,
    };
    this.updateTask(requestBody);
  }
  onRemoveTaskLabel(eventArgs: any) {
    this.isLabelsChanged = true;
    const items = this.taskLabels.value;
    let updatedItems = items;
    if (eventArgs.id) {
      updatedItems = items?.filter((item: any) => item.id !== eventArgs.id) || [];
    } else {
      updatedItems = items?.filter((item: any) => item.title !== eventArgs.title) || [];
    }
    this.taskLabels.patchValue(updatedItems);
    this.resetFilteredLabels();
  }
  onPriorityChange(taskPriorityObject: any, taskObject: any) {
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
      labels: taskObject.task_labels,
      subscribers: taskObject.subscribers,
      priority: taskPriorityObject.name,
      assigneeUser: taskObject?.task_assignee,
    };
    this.updateTask(requestBody);
  }

  clearPriority(taskObject: any) {
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
      labels: taskObject.task_labels,
      subscribers: taskObject.subscribers,
      priority: null,
      assigneeUser: taskObject?.task_assignee,
    };
    this.updateTask(requestBody);
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

  onTaskLabelSelect(eventArgs: any) {
    const items = this.taskLabels.value || [];
    const labelvalue = (eventArgs.title || eventArgs || '').trim();
    if (items?.length + 1 <= 5) {
      if (labelvalue) {
        const existingLocation = items.findIndex((label: any) => label.title === labelvalue);
        if (existingLocation === -1) {
          items?.push({
            id: eventArgs && eventArgs.id ? eventArgs.id : '',
            title: eventArgs && eventArgs.title ? eventArgs.title : eventArgs,
            project_id: eventArgs && eventArgs.project_id ? eventArgs.project_id : this.editLabels.project_id || '',
            color: eventArgs && eventArgs.color ? eventArgs.color : Utility.getLabelColorDetails(),
          });
          // if (!eventArgs.id) {

          // }
          this.isLabelsChanged = true;
          this.taskLabels.patchValue(items);
          this.resetFilteredLabels();
        }
      }
      this.isOverlayOpenForTaskLabels = false;
    } else {
      this.snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'You cannot add more than 5 labels.' },
        duration: 45000,
      });
    }
  }
  createAndSaveSection(sectionDetails: PostTaskSectionModel, requestBody: any) {
    this.tasksService.postTaskSection(sectionDetails).subscribe(
      (response: any) => {
        if (response && response.data && response.data.id) {
          requestBody.section = response.data.id;
          this.updateTask(requestBody, 'section').then((this.taskToEdit = null));
        } else {
          this.snackBar.openFromComponent(SnackbarComponent, {
            data: { message: response.message },
            duration: 45000,
          });
        }
      },
      (error: any) => {
        console.log('error:', error);
      }
    );
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
      priority: taskObject.priority,
      assigneeUser: eventArgs,
    };
    this.updateTask(requestBody);
    this.assigneeSelectionTaskId = null;
  }
  viewAllTask(groupBy: any, groupId: any) {
    this.tasksService.setViewAllTasks({
      groupType: groupBy,
      groupId: groupId,
    });
  }
  onAssigneeSerchchanges(eventArgs: any, team: any) {
    const searchTerm = eventArgs.target.value.toLowerCase();

    this.selectedAssignees = team?.filter((member: any) => {
      const firstName = member.first_name.toLowerCase();
      const lastName = member.last_name.toLowerCase();

      return firstName.includes(searchTerm) || lastName.includes(searchTerm);
    });

    // this.selectedAssignees = team?.filter(
    //   (member: any) => member.first_name.includes(eventArgs.target.value) || member.last_name.includes(eventArgs.target.value)
    // );
    // console.log(this.selectedAssignees);
  }
  onMouseOverRemoveableItem(eventArgs: any, itemtype: any) {
    this.displayAssigneeCloseIcon = false;
    this.displayEtaCloseIcon = false;
    if (itemtype === 1) {
      this.displayAssigneeCloseIcon = true;
    } else if (itemtype === 2) {
      this.displayEtaCloseIcon = true;
    }
    this.hoverId = eventArgs.id;
  }
  onMouseOutItem() {
    this.hoverId = null;
  }
  copyTaskLink(taskId: any) {
    // console.log(taskId);
    if (taskId) {
      const encTaskId = Encryption._doEncrypt(taskId.toString());
      const linkToCopy = window.location.protocol + '//' + window.location.host + '/tasks/view/' + encodeURIComponent(encTaskId);
      const dummyHTMLElement = document.createElement('input');
      const currentURL = linkToCopy;
      document.body.appendChild(dummyHTMLElement);
      dummyHTMLElement.value = currentURL;
      dummyHTMLElement.select();
      document.execCommand('copy');
      document.body.removeChild(dummyHTMLElement);
      this.snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'Task link copied!' },
      });
    }
  }
  _onMouseOverRow(taskObject: any) {
    taskObject['rowFocused'] = true;
  }
  _onMouseOutRow(taskObject: any) {
    taskObject['rowFocused'] = false;
  }
  //#endregion

  //#region [DEPRECATED]
  // Function to prepare the task object
  public prepareTaskObject(task: any) {
    return {
      taskTitle: task.title,
      taskStatus: {
        statusTitle: task.state,
        statusColor: '#800101',
      },
      taskAsignee: {
        userName: task.assignee,
        userImage: task.userImage,
      },
      taskType: '',
    };
  }

  // Function to prepare the project object
  public prepareProjectObject(project: any, projectTasks: any) {
    return {
      projectTitle: project.project_title,
      projectKey: project.project_key,
      projectTaskCount: project.project_task_count,
      isShowNewTask: false,
      projectId: project.id,
      projectTasks: projectTasks,
    };
  }
  pushTaskObjectInTaskList(index: number, createdTaskResponse: any) {
    this.taskList[index].groupTasks.push(createdTaskResponse);
    this.taskList[index].groupTaskCount += 1;
  }
  //#endregion

  //#region [Bulk Opeartion]
  _onSelectedtaskChange(eventArgs: any, taskObject: any, projectObject: any) {
    if (eventArgs.target.checked && taskObject) {
      if (this.selectedTasks.length < 25) {
        const findTaskIndex = this.selectedTasks.findIndex((_task: any) => taskObject?.id?.toString() === _task?.id?.toString());
        if (findTaskIndex === -1) {
          this.selectedTasks.push(taskObject);
        }
        taskObject['itemChecked'] = true;
      } else {
        this.snackBar.openFromComponent(SnackbarComponent, {
          data: { message: 'Maximum 25 tasks are allowed.' },
          duration: 45000,
        });
      }
    } else {
      if (taskObject) {
        taskObject['itemChecked'] = false;
        const findTaskIndex = this.selectedTasks.findIndex((_task: any) => taskObject?.id?.toString() === _task?.id?.toString());
        if (findTaskIndex !== -1) {
          this.selectedTasks.splice(findTaskIndex, 1);
          if (this.selectedTasks?.length === 0) {
            this.selectedTasks = [];
            this.bulkOpValues = {};
            this.blkLabels = [];
            this.filteredBlkLabels = [];
          }
        }
      }
    }
    if (this.selectedTasks && this.selectedTasks.length > 0) {
      const firstTaskProjectId = this.selectedTasks[0].project_id;
      this.includeDiffrentProjects = this.selectedTasks.some((task: any) => task?.project_id != firstTaskProjectId);
    } else {
      this.includeDiffrentProjects = false;
    }
    if (projectObject) {
      projectObject['allSelected'] = projectObject?.groupTasks?.every((task: any) => task['itemChecked']);
    }

    if (this.includeDiffrentProjects) {
      this.bulkOpValues[this.taskContstants.LABELS] = null;
      this.bulkOpValues[this.taskContstants.STATE] = null;
      this.bulkOpValues[this.taskContstants.STATUS] = null;
      this.bulkOpValues[this.taskContstants.ASIGNEE] = null;
    }
  }
  _deSelectAllItems() {
    this.selectedTasks.forEach((task: any) => {
      task['itemChecked'] = false;
    });
    this.selectedTasks = [];
    this.bulkOpValues = {};
    this.blkLabels = [];
    this.filteredBlkLabels = [];
    this.taskList?.forEach((project: any) => {
      project['allSelected'] = false;
    });
  }

  _onCopySeletedTasks() {
    const inputHtmlCopyContent = document.createElement('textarea');

    let content = '';
    let header = '';
    this.cpTaskFields.forEach((field: any) => {
      if (field.checked) {
        switch (field.text) {
          case 'Task ID':
            header += 'Task ID\t';
            break;
          case 'Task title':
            header += 'Task title\t';
            break;

          case 'Task link':
            header += 'Task link\t';
            break;
          case 'Task assignee':
            header += 'Task assignee\t';
            break;
          case 'Task sub-status':
            header += 'Task sub-status\t';
            break;
          case 'Due Date':
            header += 'Due Date\t';
            break;
          case 'ETA':
            header += 'ETA\t';
            break;
          case 'Time Worked':
            header += 'Time Worked\t';
            break;
          case 'Project Name':
            header += 'Project Name\t';
            break;
        }
      }
    });
    this.selectedTasks.forEach((task: any) => {
      if (header.includes('Task ID')) {
        content += `${task?.task_key_prefix || ''}-${task?.task_unique_key || ''}\t`;
      }
      if (header.includes('Task title')) {
        content += `${task.title || ''}\t`;
      }

      if (header.includes('Task assignee')) {
        if (task?.task_assignee) {
          content += `${task?.task_assignee?.first_name || ''} ${task?.task_assignee?.last_name || ''}\t`;
        } else {
          content += '\t';
        }
      }

      if (header.includes('Task sub-status')) {
        if (task?.task_status) {
          content += `${task?.task_status?.title || ''}\t`;
        } else {
          content += '\t';
        }
      }
      if (header.includes('Due Date')) {
        if (task?.due_date) {
          content += `${moment(task.due_date).format('DD/MM/YYYY')}\t`;
        } else {
          content += '\t';
        }
      }
      if (header.includes('ETA')) {
        content += `${task?.eta || ''}\t`;
      }
      if (header.includes('Time Worked')) {
        content += `${task?.total_worked_hours || '00h 00m'}\t`;
      }
      if (header.includes('Task link')) {
        const encTaskId = Encryption._doEncrypt(task.id.toString());
        const linkToCopy = window.location.protocol + '//' + window.location.host + '/tasks/view/' + encodeURIComponent(encTaskId);
        content += `${linkToCopy || ''}\t`;
      }
      if (header.includes('Project Name')) {
        content += `${task?.project_name || ''}\t`;
      }
      content ? (content += '\n') : '';
    });

    if (header && content) {
      document.body.appendChild(inputHtmlCopyContent);
      inputHtmlCopyContent.value = `${header}\n${content}`;
      inputHtmlCopyContent.select();
      document.execCommand('copy');
      document.body.removeChild(inputHtmlCopyContent);
    }
    return;
  }
  _onMouseOverGroup(projectDetails: any) {
    projectDetails['moueOver'] = true;
  }
  _onMouseOutGroup(projectDetails: any) {
    projectDetails['moueOver'] = false;
  }
  _onFilterBlkTaksLabel() {
    const selectedLabels = this.bulkOpValues[this.taskContstants.LABELS] || [];
    if (selectedLabels) {
      this.filteredBlkLabels = this.blkLabels.filter((label: any) => selectedLabels.findIndex((item: any) => item.title === label.title) === -1);
    }
  }
  _onSelecteAllTaskChange(eventArgs: any, projectObject: any) {
    if (projectObject) {
      if (eventArgs.target.checked) {
        projectObject?.groupTasks?.forEach((task: any) => {
          // task['itemChecked'] = true;
          this._onSelectedtaskChange(eventArgs, task, projectObject);
        });
        projectObject['allSelected'] = projectObject?.groupTasks?.every((task: any) => task['itemChecked']);
      } else {
        projectObject?.groupTasks?.forEach((task: any) => {
          task['itemChecked'] = false;
          this._onSelectedtaskChange(eventArgs, task, projectObject);
        });
        projectObject['allSelected'] = false;
      }
    }
  }
  _onSelectBulkLabelList() {
    if (!this.includeDiffrentProjects) {
      const projectId = this.selectedTasks?.length > 0 && this.selectedTasks[0] && this.selectedTasks[0].project_id;
      this.tasksService.getTaskLabels(projectId).subscribe(
        (response: any) => {
          if (response && response.data) {
            this.blkLabels = response.data;
            this.filteredBlkLabels = response.data;
          } else {
            this.blkLabels = [];
            this.filteredBlkLabels = [];
          }
          this._onFilterBlkTaksLabel();
          this.blkLabelSelectionOpen = true;
        },
        (err) => {
          console.log(err);
          this.blkLabels = [];
          this.blkLabelSelectionOpen = false;
        }
      );
    }
  }
  _onBlkTaskLabelSelect(eventArgs: any) {
    const items = this.bulkOpValues[this.taskContstants.LABELS] || [];
    const labelvalue = (eventArgs.title || eventArgs || '').trim();
    const projectId = this.selectedTasks?.length > 0 && this.selectedTasks[0] && this.selectedTasks[0].project_id;
    if (items?.length + 1 <= 5) {
      if (labelvalue) {
        const existingLocation = items.findIndex((label: any) => label.title === labelvalue);
        if (existingLocation === -1) {
          items?.push({
            id: eventArgs && eventArgs.id ? eventArgs.id : '',
            title: eventArgs && eventArgs.title ? eventArgs.title : eventArgs,
            project_id: eventArgs && eventArgs.project_id ? eventArgs.project_id : projectId || '',
            color: eventArgs && eventArgs.color ? eventArgs.color : Utility.getLabelColorDetails(),
          });
          this.bulkOpValues[this.taskContstants.LABELS] = [...items];
          this._onFilterBlkTaksLabel();
        }
      }
    } else {
      this.snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'You cannot add more than 5 labels.' },
        duration: 45000,
      });
    }
  }
  _blkSelectionStatusChange(eventArgs: any) {
    this.bulkOpValues[this.taskContstants.STATE] = eventArgs;
    this.isBlkTaskStatusOpen = false;
  }
  _onApplyBulkUpdate() {
    if (
      (this.permissionDetails.allowUpdate && this.permissionDetails.priority.edit) ||
      (this.permissionDetails.allowUpdate && this.permissionDetails.taskType.edit) ||
      (this.permissionDetails.allowUpdate && this.permissionDetails.dueDate.edit) ||
      (this.permissionDetails.allowUpdate && this.permissionDetails.eta.edit) ||
      (this.permissionDetails.allowUpdate && this.permissionDetails.assignee.edit) ||
      (this.permissionDetails.allowUpdate && this.permissionDetails.substatus.edit) ||
      (this.permissionDetails.allowUpdate && this.permissionDetails.labels.edit)
    ) {
      const requestBody: any = {};
      if (this.bulkOpValues[TASK_REQUEST_KEYS_CONSTANTS.PRIORITY]?.name) {
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.PRIORITY] = this.bulkOpValues[TASK_REQUEST_KEYS_CONSTANTS.PRIORITY]?.name || null; // Priority
      }
      if (this.bulkOpValues[TASK_REQUEST_KEYS_CONSTANTS.TYPE]) {
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.TYPE] = this.bulkOpValues[TASK_REQUEST_KEYS_CONSTANTS.TYPE]; // Task type
      }
      requestBody[TASK_REQUEST_KEYS_CONSTANTS.DUE_DATE] = this.bulkOpValues[TASK_REQUEST_KEYS_CONSTANTS.DUE_DATE]?.format(
        DATE_FORMAT_CONSTANTS.YYYY_MM_DD
      );
      if (this.bulkOpValues[TASK_REQUEST_KEYS_CONSTANTS.ETA]) {
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.ETA] = this.bulkOpValues[TASK_REQUEST_KEYS_CONSTANTS.ETA]; // eta
      }
      if (this.bulkOpValues[TASK_REQUEST_KEYS_CONSTANTS.LABELS]?.length) {
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.LABELS] = JSON.stringify(this.bulkOpValues[TASK_REQUEST_KEYS_CONSTANTS.LABELS]);
      }
      if (this.bulkOpValues[this.taskContstants.STATE]?.value || this.bulkOpValues[this.taskContstants.STATUS]?.state) {
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.STATE] =
          this.bulkOpValues[this.taskContstants.STATE]?.value || this.bulkOpValues[this.taskContstants.STATUS]?.state;
      }
      if (this.bulkOpValues[this.taskContstants.STATUS]?.id) {
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.STATUS] = this.bulkOpValues[this.taskContstants.STATUS]?.id;
      }
      if (this.bulkOpValues[this.taskContstants.ASIGNEE]?.id) {
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.ASIGNEE] = this.bulkOpValues[this.taskContstants.ASIGNEE]?.id;
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.ASSIGNEE_USER] = JSON.stringify(this.bulkOpValues[this.taskContstants.ASIGNEE] || '');
      }

      requestBody['taskIds'] = this.selectedTasks?.map((task: any) => task?.id);
      if (
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.PRIORITY] ||
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.TYPE] ||
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.DUE_DATE] ||
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.ETA] ||
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.LABELS] ||
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.STATE] ||
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.STATUS] ||
        requestBody[TASK_REQUEST_KEYS_CONSTANTS.ASIGNEE]
      ) {
        this.tasksService.updateMassTasks(requestBody).subscribe(
          (response: any) => {
            if (response) {
              if (response.status === 200 && response.success) {
                this.snackBar.openFromComponent(SnackbarComponent, {
                  data: { message: response.message || 'Task changes applied successfully.' },
                });

                this.tasksService.setRefetchProjectWiseTask(true);
              }
            }
          },
          (error: any) => {
            console.log(error);
            this.snackBar.openFromComponent(SnackbarComponent, {
              data: { message: 'An error occured while updating tasks.' },
              duration: 45000,
            });
          }
        );
      }
    }
  }
  _onRemoveBlkTaskLabel(eventArgs: any) {
    this.isLabelsChanged = true;
    const items = this.bulkOpValues[this.taskContstants.LABELS];
    let updatedItems = items;
    if (eventArgs.id) {
      updatedItems = items?.filter((item: any) => item.id !== eventArgs.id) || [];
    } else {
      updatedItems = items?.filter((item: any) => item.title !== eventArgs.title) || [];
    }
    this.bulkOpValues[this.taskContstants.LABELS] = [...updatedItems];
    this._onFilterBlkTaksLabel();
  }
  async _blkGetStatusForSelectProject(taskDetails?: any) {
    if (!this.includeDiffrentProjects) {
      const projectId = this.selectedTasks?.length > 0 && this.selectedTasks[0] && this.selectedTasks[0].project_id;
      if (projectId) {
        await this.statusService.getAllStatuses(projectId?.toString()).subscribe((response: any) => {
          if (response?.data && response?.data?.length > 0) {
            this.blkProjectStausList = response?.data?.map((_status: any) => {
              return {
                ..._status,
                name: _status.title,
              };
            });
            this.isBlkTaskStatusOpen = true;
          } else {
            this.blkProjectStausList = [];
          }
        });
      }
    }
  }
  _onSelectBlkStatus(eventArgs: any) {
    if (eventArgs) {
      this.bulkOpValues[this.taskContstants.STATE] = eventArgs.state;
      this.bulkOpValues[this.taskContstants.STATUS] = eventArgs;
    }
    this.isBlkTaskStatusOpen = false;
  }
  _onBlkAssigneeSerchchanges(eventArgs: any) {
    const searchTerm = eventArgs.target.value.toLowerCase();

    this.blkUserFilterList = this.blkUserList?.filter((member: any) => {
      const firstName = member.first_name.toLowerCase();
      const lastName = member.last_name.toLowerCase();

      return firstName.includes(searchTerm) || lastName.includes(searchTerm);
    });
  }
  _onBlkTaskAssigneeSelection() {
    if (this.selectedTasks && this.selectedTasks?.length > 0) {
      if (this.includeDiffrentProjects) {
        const projectIds: any = [];
        let team: any = [];
        this.selectedTasks.forEach((task: any) => {
          if (projectIds?.length > 0 && !projectIds.includes(task.project_id)) {
            projectIds.push(task.project_id);
            team = team.filter((user: any) => {
              const indexOfUser = task?.team?.findIndex((_user: any) => user.id === _user.id);
              return indexOfUser !== -1;
            });
          } else if (projectIds?.length === 0) {
            projectIds.push(task.project_id);
            team.push(...task.team);
          }
        });
        if (team && team.length) {
          this.blkUserList = [...team];
          this.blkUserFilterList = [...team];
          this.isBlkAssigneePopupOpen = true;
        }
      } else {
        const team = this.selectedTasks[0]?.team || [];
        if (team) {
          this.blkUserList = [...team];
          this.blkUserFilterList = [...team];
          this.isBlkAssigneePopupOpen = true;
        }
      }
    }
  }
  //#endregion
  //#endregion
}
