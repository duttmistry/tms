import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DashboardService } from '../../../../core/services/module/dashboard/dashboard.service';
import { SpinnerService } from '../../../../core/services/common/spinner.service';
import { TaskService } from '../../../../core/services/module/tasks/task.service';
import { ProjectsRequestDataModel, TaskTimerRequestModel, toggleTaskTimerResponseModel } from '../../../../core/model/task/task.model';
import { Encryption } from '@tms-workspace/encryption';
import { StorageService } from '../../../../core/services/common/storage.service';
import {
  ACTION_CONSTANTS,
  CREATE_MESSAGES_IN_POPUP,
  DATE_FORMAT_CONSTANTS,
  MODULE_CONSTANTS,
  PERMISSION_CONSTANTS,
  STORAGE_CONSTANTS,
  TASK_PRIORITY_CONSTANTS,
  TASK_REQUEST_KEYS_CONSTANTS,
  TASK_TIMER_CONSTANTS,
  TASK_TIMER_DEFAULT_VALUE,
} from '../../../../core/services/common/constants';
import { Utility } from '../../../../core/utilities/utility';
import { Subscription, interval, timer } from 'rxjs';
import moment from 'moment';
import { UserService } from '../../../../core/services/module/users/users.service';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Router } from '@angular/router';
import { Task_Type_Enum, Task_Type_Enum_Color_Codes } from '@tms-workspace/enum-data';
import { PermissionService } from '../../../../core/services/module/settings/permission/permission.service';
import { FormControl } from '@angular/forms';
import { GlobalService } from '../../../../core/services/common/global.service';
import { SnackbarComponent } from '@tms-workspace/material-controls';
import { error } from 'console';
import { CommentDialogComponent } from '../../../../shared/components/comment-popup-dialog/comment-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'main-app-my-tasks',
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.scss'],
})
export class MyTasksComponent implements OnInit, OnDestroy {
  //#region Data member

  public selectedOptions: any;
  public projectsId: any[] = [];
  public projectTasksList: any[] = [];
  projectSelection: any = [];
  projectSelectionInputList: any = [];

  public selectedWorkspaceOptions: any;
  public workspaceIds: any[] = [];
  workspaceSelection: any = [];
  workspaceSelectionInputList: any = [];

  // Data for each step
  public myAllTasksList: any[] = [];
  public taskState = '';
  public totalTaskCount = 0;
  public projectList: any[] = [];

  encUser_id = '';
  decUser_id = '';
  loggedInUserData: any = null;
  @Input() taskPermissionObject: any;
  public hasMyTeamTaskPermission: any;
  public hasOnlyMyTaskPermission: any;
  public items = Utility.stateList.map((state: any) => {
    return { name: state.title, ...state };
  });
  public timerStartedTaskId: any = null;
  public timerCount = TASK_TIMER_DEFAULT_VALUE;
  public timerSourceSubscription!: Subscription;
  public subscriptions: Subscription[] = [];
  public timerSource = interval(1000);
  public loggedinUserid = null;
  public TASK_TIMER_CONSTANTS_local = TASK_TIMER_CONSTANTS;
  public projectsData: any;
  public userIsIntBreak = false;
  public isNoRecordFound = false;
  public openQuickTaskLabelsSection = false;
  public openedLableId = null;
  public taskTimerStartDateTime: any = null;
  public showSpinner = true;
  isMyTeamtasksHidden = false;

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
  priorityList: any = [];
  taskTypeList = Task_Type_Enum;
  displayEtaCloseIcon = false;
  taskIdToUpdateETA: any = null;
  hoverId = null;
  displayAssigneeCloseIcon = false;
  assigneeSelectionTaskId = null;
  selectedAssignees: any = [];
  taskLabels = new FormControl<any[]>([]);
  createLabelForMessage = CREATE_MESSAGES_IN_POPUP.CREATE_LABEL_FOR;
  isOverlayOpenForTaskLabels = false;
  isLabelsChanged = false;
  editLabels: any = null;
  availableProjectLabels: any = [];
  filteredAvailableLabels: any = [];
  toggle: any = false;
  color: any = '#800101';
  presetColors: string[];
  filteredAssigneeList: any = [];
  prefStorageName = STORAGE_CONSTANTS.DASHBOARD_PREF;
  currentTaskIdToEdit = null;
  doShowCompletedBadge = false;
  lastViewedAt: any = null;
  //#endregion

  //#region Component Structure Methods
  constructor(
    private dashboardService: DashboardService,
    private spinnerService: SpinnerService,
    private taskService: TaskService,
    private storageService: StorageService,
    private userService: UserService,
    private _snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private permissionService: PermissionService,
    private globalService: GlobalService
  ) {
    this.presetColors = this.globalService.presetColors;
  }

  ngOnInit(): void {
    this.doCheckCompletedTasksThere();
    this.setPriorityList();
    this.setFieldPermissions();
    this.loggedInUserData = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string));
    this.decUser_id = this.loggedInUserData?.user_id;
    this.loggedinUserid = this.loggedInUserData?.user_id;
    this.encUser_id = Encryption._doEncrypt(this.loggedInUserData.user_id.toString());
    this.prefStorageName = STORAGE_CONSTANTS.DASHBOARD_PREF + '_' + this.encUser_id;
    this.subscriptions.push(
      this.userService.getBreakTimeStatusProvider().subscribe((value: any) => {
        if (value) {
          this.timerStartedTaskId = null;
          this.timerCount = TASK_TIMER_DEFAULT_VALUE;
          this.timerSourceSubscription?.unsubscribe();
          this.getMyTasksList(this.taskState);
          this.userIsIntBreak = true;
        } else {
          this.userIsIntBreak = false;
        }
      })
    );
    this.subscriptions.push(
      this.dashboardService.getShowMyTeamTask().subscribe((currentVal: any) => {
        if (!currentVal) {
          this.isMyTeamtasksHidden = true;
        } else {
          this.isMyTeamtasksHidden = false;
        }
      })
    );

    // this.getMyTasksList(this.taskState);
    // this.getAllWorkspaceList();
    // this.getProjectsData();
    this.hasOnlyMyTaskPermission = this.taskPermissionObject.hasOnlyMyTaskPermission;
    this.hasMyTeamTaskPermission = this.taskPermissionObject.hasMyTeamTaskPermission;

    this.subscriptions.push(
      this.dashboardService.getMyTaskFlag().subscribe((response: any) => {
        if (response) {
          this.getMyTasksList(this.taskState);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
  doCheckCompletedTasksThere() {
    try {
      if (this.taskState !== 'completed') {
        const timeStamp = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.COMPLETED_TASK_TIMESTAMPP);
        let _timeStampForRequest = '';
        if (timeStamp) {
          const _decTimeStamp = Encryption._doDecrypt(timeStamp);
          _timeStampForRequest = _decTimeStamp;
        } else {
          const currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
          _timeStampForRequest = currentDateTime;
          this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.COMPLETED_TASK_TIMESTAMPP, Encryption._doEncrypt(currentDateTime));
        }
        this.taskService.checkFetchCompletedTaskstatus(_timeStampForRequest).subscribe(
          (response: any) => {
            // console.log(response);
            if (response?.data?.count) {
              this.doShowCompletedBadge = true;
            } else {
              this.doShowCompletedBadge = false;
            }
          },
          (error: any) => {
            this.doShowCompletedBadge = false;
            console.log(error);
          }
        );
      } else {
        const currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.COMPLETED_TASK_TIMESTAMPP, Encryption._doEncrypt(currentDateTime));
      }
    } catch (error) {
      console.log(error);
    }
  }

  //#endregion

  //#region For member function

  //#region for get tasks list
  getTaskBackgroundForCompleted(task: any) {
    if (task?.state === 'completed') {
      let _timeStampForRequest;
      if (this.lastViewedAt) {
        _timeStampForRequest = this.lastViewedAt;
      } else {
        _timeStampForRequest = moment();
      }
      return moment(task.updated_at).diff(_timeStampForRequest, 'second') > 0 ? 'rgba(207, 207, 245, 0.42)' : '#fff';
    } else {
      return '#fff';
    }
    //updated_at
  }
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
  public getMyTasksList(event: any) {
    this.showSpinner = true;
    const state = event?.tab?.textLabel.replace(/\s+/g, '').toLowerCase() || event;
    this.taskState = state || 'inprogress';

    if (state === 'completed') {
      this.doShowCompletedBadge = false;
      let _timeStampForRequest;
      const timeStamp = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.COMPLETED_TASK_TIMESTAMPP);
      if (timeStamp) {
        const _decTimeStamp = Encryption._doDecrypt(timeStamp);
        _timeStampForRequest = moment(_decTimeStamp);
      } else {
        _timeStampForRequest = moment();
      }
      this.lastViewedAt = _timeStampForRequest;
      const currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
      this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.COMPLETED_TASK_TIMESTAMPP, Encryption._doEncrypt(currentDateTime));
    } else {
      this.doCheckCompletedTasksThere();
    }
    this.dashboardService.getAllMyTasksList(this.taskState, this.projectList, this.decUser_id, this.taskPermissionObject).subscribe(
      (response: any) => {
        if (response) {
          if (response.data.list && response.data.list.length > 0) {
            this.isNoRecordFound = true;
            this.myAllTasksList = response.data.list;
            this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
            this.timerCount = TASK_TIMER_DEFAULT_VALUE;
            this.timerStartedTaskId = null;
            this.myAllTasksList?.forEach((task: any) => {
              task['taskTypeIndicator'] = this.getTypeBaseColor(task.type);
              task['priorityImg'] = task.priority ? task.priority.toLowerCase() + '-priority.svg' : 'flag.svg';
              if (task.total_worked_hours) {
                const timeParts = task.total_worked_hours.split(':');
                task.total_worked_hours = `${timeParts[0]}h ${timeParts[1]}m`;
              }
              // let projs = this.workspaceData.map((workspace: any) => {
              //   return workspace.projects;
              // });
              // projs = projs.flat(2);
              //const project = this.projectsData?.find((proj: any) => proj.id === task.project_id);
              // if (project) {
              //   task?.working_users?.forEach((user: any) => {
              //     if (user.running_status === TASK_TIMER_CONSTANTS.ONGOING) {
              //       user['userDetails'] = project?.projectTeam?.find((teamMember: any) => teamMember.user.id === user.user_id)?.user;
              //     }
              //   });
              // }
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
                let dateOnTaskStarted = task?.working_users[userIndex]?.updated_at;
                const currentDiff = moment().diff(dateOnTaskStarted, 'seconds');
                dateOnTaskStarted = currentDiff >= 0 ? dateOnTaskStarted : moment();
                this.timerCount = this.getTimerValue(0, 0, moment().diff(dateOnTaskStarted, 'seconds'));
                this.timerStartedTaskId = task.id;
                this.taskTimerStartDateTime = moment(dateOnTaskStarted);
                this.setTaskTimer();
              }
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
            });
            this.totalTaskCount = response.data.total_task;
            this.showSpinner = false;
          } else {
            this.myAllTasksList = [];
            this.isNoRecordFound = false;
            this.totalTaskCount = response.data.total_task || 0;
            this.showSpinner = false;
          }
        } else {
          this.myAllTasksList = [];
          this.isNoRecordFound = false;
          this.totalTaskCount = response.data.total_task || 0;
          this.showSpinner = false;
        }
      },
      (error) => {
        this.spinnerService.hideSpinner();
        this.showSpinner = false;
      }
    );
  }

  /* This method used to determine whether there are any tasks in the specified state.
   It returns true if there are tasks in the state, and false otherwise */
  hasTasksInState(state: string): boolean {
    return this.myAllTasksList.some((task) => task.state === state);
  }
  //#endregion

  //#region for set time configuration
  //Set time
  toogleTimer(taskDetails: any) {
    if (taskDetails.state !== 'completed') {
      const timerRequestBody: TaskTimerRequestModel = {
        task_id: taskDetails.id,
      };
      if (taskDetails && taskDetails._user_working_status) {
        // this.spinnerService.showSpinner();

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
            this.subscriptions.push(
              this.taskService.stopTaskTimer(timerRequestBody).subscribe({
                next: (response: toggleTaskTimerResponseModel) => {
                  if (response) {
                    //  this.spinnerService.hideSpinner();
                    if (response.success) {
                      this.timerStartedTaskId = null;
                      this.timerCount = TASK_TIMER_DEFAULT_VALUE;
                      this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
                      this.getMyTasksList(this.taskState);
                      this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.BREAK_TIME_TASK, Encryption._doEncrypt(JSON.stringify(0)));
                    } else {
                      this._snackBar.openFromComponent(SnackbarComponent, {
                        data: { message: 'You are not permitted to perform this action.' },
                        duration: 45000,
                      });
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
            this.taskService.startTaskTimer(timerRequestBody).subscribe({
              next: (response: toggleTaskTimerResponseModel) => {
                if (response) {
                  //  this.spinnerService.hideSpinner();
                  if (response.success) {
                    this.timerStartedTaskId = taskDetails.id;
                    this.taskTimerStartDateTime = moment();
                    this.setTaskTimer();
                    this.getMyTasksList(this.taskState);
                    this.dashboardService.setMyTeamTaskFlag(true);
                    this.storageService.setIntoLocalStorage(
                      STORAGE_CONSTANTS.BREAK_TIME_TASK,
                      Encryption._doEncrypt(JSON.stringify(this.timerStartedTaskId))
                    );
                  } else {
                    this._snackBar.openFromComponent(SnackbarComponent, {
                      data: { message: 'You do not have the authorization for this action.' },
                      duration: 45000,
                    });
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

  setTaskTimer() {
    this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
    this.timerSourceSubscription = this.timerSource.subscribe((response: any) => {
      const currentCount = this.incrementTaskTimerCount();
      this.timerCount = currentCount;
    });
  }

  incrementTaskTimerCount() {
    // const [hours, minutes, seconds] = this.timerCount.split(':');
    // const hoursValue = parseInt(hours);
    // const minutesValue = parseInt(minutes);
    // let secondsValue = parseInt(seconds);
    // secondsValue++;

    return this.getTimerValue(0, 0, moment().diff(this.taskTimerStartDateTime, 'seconds'));
    //return this.getTimerValue(hoursValue, minutesValue, secondsValue);
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

  getTaskColor(task: any) {
    if (task.state) {
      const taskStyle = this.items.find((item: any) => item.value === task.state);
      return taskStyle.color;
    }
    return 'black';
  }

  //#endregion

  //#region for get project list and set mat-tree with multi select
  getProjectsData() {
    this.showSpinner = true;
    const requestBody: ProjectsRequestDataModel = {
      status: true,
      custom_fields: false,
      tag: false,
      team: true,
      billing_configuration: false,
      documents: false,
      workspace: true,
    };
    this.taskService.getProjectListv2().subscribe(
      (response: any) => {
        if (response) {
          if (response.data) {
            if (response.data.list) {
              const projectList = response.data.list;
              this.projectSelection = [...response.data.list];
              this.projectSelectionInputList = [...response.data.list];
              this.projectsData = projectList.map((proj: any) => {
                return {
                  id: proj.id,
                  name: proj.name,
                  // projectTeam: proj.projectTeamData.map((teamDetails: any) => {
                  //   return {
                  //     id: teamDetails.id,
                  //     user: teamDetails.user,
                  //   };
                  // }),
                };
              });
              this.getProjectidsWiseTaskList();
            }
          }
        }
        this.showSpinner = false;
      },
      (error) => {
        this.spinnerService.hideSpinner();
        this.showSpinner = false;
      }
    );
    //   this.taskService.getProjectsData(requestBody).subscribe({
    //     next: (response: any) => {
    //       if (response) {
    //         if (response.data) {
    //           if (response.data.list) {
    //             const projectList = response.data.list;
    //             this.projectSelection = [...response.data.list];
    //             this.projectSelectionInputList = [...response.data.list];
    //             this.projectsData = projectList.map((proj: any) => {
    //               return {
    //                 id: proj.id,
    //                 name: proj.name,
    //                 projectTeam: proj.projectTeamData.map((teamDetails: any) => {
    //                   return {
    //                     id: teamDetails.id,
    //                     user: teamDetails.user,
    //                   };
    //                 }),
    //               };
    //             });
    //             this.getProjectidsWiseTaskList();
    //           }
    //         }
    //       }
    //       this.showSpinner = false;
    //     },
    //     error: (error) => {
    //       this.spinnerService.hideSpinner();
    //       this.showSpinner = false;
    //     },
    //   });
  }

  public getProjectidsWiseTaskList() {
    this.projectsId =
      this.projectSelection && this.projectSelection.length > 0
        ? this.projectSelection.map((project: any) => project.id)
        : this.projectSelectionInputList.map((project: any) => project.id);
    this.storageService.setIntoLocalStorage(
      this.prefStorageName,
      Encryption._doEncrypt(
        JSON.stringify({
          projects: this.projectsId.map((id: any) => {
            return { id: id };
          }),
        })
      )
    );

    if (this.projectsId) {
      const reqData = this.projectsId.map(Number);
      // const body = { projects: reqData };
      this.projectList = reqData && reqData.length > 0 ? reqData : [];
      this.dashboardService.setProjectIds(this.projectList);
      this.getMyTasksList(this.taskState);
    }
  }

  public getSelectedProjectList(eventArgs: any) {
    this.projectSelection = eventArgs;
    this.clearFilterAndFetch();
  }

  clearFilterAndFetch() {
    this.getProjectidsWiseTaskList();
  }
  //#endregion

  //#region Get image url and set staus as per figma
  getImageUrl(priority: string): string {
    switch (priority) {
      case 'Normal':
        return 'assets/images/normal-priority.svg';
      case 'Urgent':
        return 'assets/images/urgent-priority.svg';
      case 'Low':
        return 'assets/images/low-priority.svg';
      case 'High':
        return 'assets/images/high-priority.svg';
      default:
        return '';
    }
  }
  // Change name as per figma
  // transformStatus(status: string): string {
  //   switch (status) {
  //     case 'inprogress':
  //       return 'In Progress';
  //     case 'todo':
  //       return 'To Do';
  //     case 'onhold':
  //       return 'On Hold';
  //     case 'completed':
  //       return 'Completed';
  //     default:
  //       return status;
  //   }
  // }

  // Function to compare eta and total_worked_hours and get the style object for ngStyle
  getStyleObject(eta: string, total_worked_hours: string) {
    const totalEta = eta.replace(/\s+/g, '');
    const etaSeconds = this.timeToSeconds(totalEta);
    const totalSeconds = this.timeToSeconds(total_worked_hours);
    const isEtaLessThanTotalWorked = etaSeconds < totalSeconds;

    return {
      color: isEtaLessThanTotalWorked ? 'red' : '',
    };
  }
  // Function to convert time string to seconds
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

  // Function to get the style object for the due date based on whether it is overdue or not
  getStyleForDueDate(dueDate: Date): any {
    if (!dueDate) {
      return {}; // If the date is null, return an empty object for no styles
    }

    const dueDateObj = moment(dueDate).utc().format('MM-DD-YYYY');
    const today = moment().format('MM-DD-YYYY');

    if (dueDateObj < today) {
      return { color: 'red' }; // Return the style object with red font color if overdue
    } else {
      return {}; // Return an empty object for no styles if not overdue
    }
  }

  //This method used for navigate view task page
  navigateToTaskDetail(taskId: string) {
    if (taskId) {
      taskId = Encryption._doEncrypt(taskId.toString());
      this.router.navigate(['/tasks/view', taskId], {
        queryParams: { r_url: 'dashboard' },
      });
    }
  }
  EncryptId(taskId: string) {
    return Encryption._doEncrypt(taskId.toString());
  }

  // getSelectedWorkspaceList(projectArray: any) {
  //   // console.log('get Selected projectArray List', projectArray);
  //   this.projectSelection = this.projectSelectionInputList = projectArray.data ? projectArray.data : [];
  //   this.getProjectidsWiseTaskList();
  //   if (projectArray.data.length === 0 && projectArray.isClearAll == true) {
  //     this.getProjectsData();
  //   }
  // }

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
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'Task link copied!' },
      });
    }
  }
  //#endregion

  //#endregion

  //#region [Task Editability Feature]
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
    await this.taskService.updateTask(formData, Encryption._doEncrypt(requestBody.taskId.toString()), 'true').subscribe({
      next: (response: any) => {
        if (response) {
          if (response.status === 200 && response.success) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: response.message || 'Task changes applied successfully.' },
            });
          }
          this.getMyTasksList(this.taskState);
        }
      },
      error: (error: any) => {
        console.log('error:', error);
      },
    });
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
  setPriorityList() {
    if (this.priorityList) {
      Object.values({ ...TASK_PRIORITY_CONSTANTS }).forEach((task: string) => {
        if (task) {
          this.priorityList.push({ id: this.priorityList.length + 1, name: task, priorityImg: task.toLowerCase() + '-priority.svg' });
        }
      });
    }
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
  onTaskTypeChange(taskTypeObject: any, taskObject: any) {
    const requestBody = {
      taskType: taskTypeObject.value,
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
  updateDueDate(eventArgs: any, taskObject: any) {
    // console.log(eventArgs);
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
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: { message: 'The Due Date cannot be earlier than the Start Date.' },
          duration: 45000,
        });
      }
    }
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
  toggleETAOverlay(taskObject: any) {
    this.taskIdToUpdateETA = taskObject.id;
    this.currentTaskIdToEdit = taskObject?.id;
  }

  removeEtaFromTask(taskObject: any) {
    // s
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
  getSelectedETA(event: any, taskObject: any) {
    // check if emmited time includes 'Minutes'

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
  onAssigneeSerchchanges(eventArgs: any) {
    const searchTerm = eventArgs.target.value.toLowerCase();

    this.filteredAssigneeList = this.selectedAssignees?.filter((member: any) => {
      const firstName = member.first_name.toLowerCase();
      const lastName = member.last_name.toLowerCase();

      return firstName.includes(searchTerm) || lastName.includes(searchTerm);
    });

    // this.selectedAssignees = team?.filter(
    //   (member: any) => member.first_name.includes(eventArgs.target.value) || member.last_name.includes(eventArgs.target.value)
    // );
    // console.log(this.selectedAssignees);
  }
  resetFilteredLabels() {
    const selectedLabels = this.taskLabels.value || [];
    if (selectedLabels) {
      this.filteredAvailableLabels = this.availableProjectLabels.filter(
        (label: any) => selectedLabels.findIndex((item: any) => item.title === label.title) === -1
      );
    }
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
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'You cannot add more than 5 labels.' },
        duration: 45000,
      });
    }
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
  editTaskLables(eventArgs: any) {
    this.taskService.getTaskLabels(eventArgs.project_id).subscribe(
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
  onClickAssignee(task: any) {
    this.selectedAssignees = [];
    this.filteredAssigneeList = [];
    const proj = this.projectsData.find((proj: any) => proj.id === task.project_id);
    if (!proj || !(proj.teamMembers && Array.isArray(proj.teamMembers))) {
      this.taskService.getProjectTeam([task.project_id]).subscribe(
        (response: any) => {
          try {
            if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
              const team = response.data[0]?.projectTeam?.map((member: any) => member?.user);
              this.selectedAssignees = team?.sort((assigne1: any, assignee2: any) => {
                const assignee1Name = assigne1.first_name.toLowerCase() + ' ' + assigne1.last_name.toLowerCase(),
                  assignee2Name = assignee2.first_name.toLowerCase() + ' ' + assignee2.last_name.toLowerCase();

                if (assignee1Name < assignee2Name) {
                  return -1;
                }
                if (assignee1Name > assignee2Name) {
                  return 1;
                }
                return 0;
              });
              this.filteredAssigneeList = [...this.selectedAssignees];
              this.assigneeSelectionTaskId = task.id;
              const proj = this.projectsData.find((proj: any) => proj.id === task.project_id);
              if (proj) {
                proj['teamMembers'] = [...this.selectedAssignees];
              }
            } else {
              this._snackBar.openFromComponent(SnackbarComponent, {
                data: { message: response.message },
                duration: 45000,
              });
            }
          } catch (error: any) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: 'An error occured while loading assignee list.' },
              duration: 45000,
            });
          }
        },
        (error: any) => {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: 'An error occured while loading assignee list.' },
            duration: 45000,
          });
        }
      );
    } else {
      this.selectedAssignees = proj.teamMembers;
      this.filteredAssigneeList = [...this.selectedAssignees];
      this.assigneeSelectionTaskId = task.id;
    }
  }
  getWorkingUsers(task: any) {
    if (!task?.userDetails) {
      this.taskService.getProjectTeam([task.project_id]).subscribe(
        (response: any) => {
          try {
            if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
              const team = response.data[0]?.projectTeam?.map((member: any) => member?.user);
              const workingUsers = task?.working_users
                ?.filter((user: any) => user.running_status === TASK_TIMER_CONSTANTS.ONGOING)
                ?.map((user: any) => user.user_id)
                ?.filter((user_id: any) => user_id !== this.loggedinUserid);
              task['userDetails'] = [...team.filter((user: any) => workingUsers.includes(user.id))];
            } else {
              this._snackBar.openFromComponent(SnackbarComponent, {
                data: { message: response.message },
                duration: 45000,
              });
            }
          } catch (error: any) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: 'An error occured while loading working users list.' },
              duration: 45000,
            });
          }
        },
        (error: any) => {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: 'An error occured while loading working users list.' },
            duration: 45000,
          });
        }
      );
    }
  }
  getSelectedProjects(eventArgs: any) {
    const allProjects = eventArgs[1];
    const selectedProjects = eventArgs[0];

    if (!this.projectsData || !Array.isArray(this.projectsData) || this.projectsData.length === 0) {
      const projectList = allProjects && Array.isArray(allProjects) ? allProjects : [];
      this.projectSelection = selectedProjects && Array.isArray(selectedProjects) && selectedProjects.length > 0 ? selectedProjects : allProjects;
      this.projectSelectionInputList = [...projectList];
      this.projectsData = projectList.map((proj: any) => {
        return {
          id: proj.id,
          name: proj.name,
        };
      });
      this.getProjectidsWiseTaskList();
    } else {
      this.projectSelection = selectedProjects && Array.isArray(selectedProjects) && selectedProjects.length > 0 ? selectedProjects : allProjects;

      this.clearFilterAndFetch();
    }
  }

  //#endregion
}
