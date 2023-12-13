import { Component, OnDestroy, OnInit } from '@angular/core';
import { DashboardService } from '../../../../core/services/module/dashboard/dashboard.service';
import { SpinnerService } from '../../../../core/services/common/spinner.service';
import { Utility } from '../../../../core/utilities/utility';
import {
  STORAGE_CONSTANTS,
  TASK_PRIORITY_CONSTANTS,
  TASK_TIMER_CONSTANTS,
  TASK_TIMER_DEFAULT_VALUE,
} from '../../../../core/services/common/constants';
import { Subscription, interval } from 'rxjs';
import { Encryption } from '@tms-workspace/encryption';
import { StorageService } from '../../../../core/services/common/storage.service';
import { UserService } from '../../../../core/services/module/users/users.service';
import { TaskTimerRequestModel, toggleTaskTimerResponseModel } from '../../../../core/model/task/task.model';
import { TaskService } from '../../../../core/services/module/tasks/task.service';
import moment from 'moment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '@tms-workspace/material-controls';
import { Router } from '@angular/router';

import { Task_Type_Enum, Task_Type_Enum_Color_Codes } from '@tms-workspace/enum-data';
import { CommentDialogComponent } from '../../../../shared/components/comment-popup-dialog/comment-dialog.component';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'main-app-my-team-tasks',
  templateUrl: './my-team-tasks.component.html',
  styleUrls: ['./my-team-tasks.component.scss'],
})
export class MyTeamTasksComponent implements OnInit, OnDestroy {
  //#region Data member

  // Data for each step
  public tasksList: any[] = [];
  public taskState = '';
  public totalTasklength: any;
  public items = Utility.stateList.map((state: any) => {
    return { name: state.title, ...state };
  });

  encUser_id = '';
  decUser_id = '';
  loggedInUserData: any = null;
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
  public projectIds: any = [];
  public taskTimerStartDateTime: any = null;
  public showSpinner = false;
  public defaultCount = 3;
  public isMyTeamtasksHidden = false;
  public is_assigned_by = false  // true if want data which is assigned by user
  //#endregion

  //#region Component Structure Methods
  constructor(
    private dashboardService: DashboardService,
    private taskService: TaskService,
    private storageService: StorageService,
    private userService: UserService,
    private spinnerService: SpinnerService,
    private _snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loggedInUserData = JSON.parse(Encryption._doDecrypt(this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA) as string));
    this.decUser_id = this.loggedInUserData?.user_id;
    this.loggedinUserid = this.loggedInUserData?.user_id;
    this.encUser_id = Encryption._doEncrypt(this.loggedInUserData.user_id.toString());
    this.subscriptions.push(
      this.dashboardService.getProjectsIds().subscribe((response: any) => {
        if (response && response.length > 0) {
          this.projectIds = response;
        }
        this.getMyTeamMembers();
        this.getMyTeamTasksList(this.taskState);
      })
    );
    this.subscriptions.push(
      this.userService.getBreakTimeStatusProvider().subscribe((value: any) => {
        if (value) {
          this.timerStartedTaskId = null;
          this.timerCount = TASK_TIMER_DEFAULT_VALUE;
          this.timerSourceSubscription?.unsubscribe();
          this.getMyTeamTasksList(this.taskState);
          this.userIsIntBreak = true;
        } else {
          this.userIsIntBreak = false;
        }
      })
    );
    this.subscriptions.push(
      this.dashboardService.getMyTeamTaskFlag().subscribe((response: any) => {
        if (response) {
          this.getMyTeamTasksList(this.taskState);
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
  }
  myTeamMembersList = [];
  getMyTeamMembers() {
    this.taskService.getMyTeamMembers(this.projectIds).subscribe((res: any) => {
      this.myTeamMembersList =
        res.data &&
        res.data.map((user: any) => ({
          id: user.id,
          name: user.first_name + ' ' + user.last_name,
          avatar: user.employee_image,
          designation: user.designation,
        }));
    });
  }
  userIds: any = [];
  filterMyTeamTaskByUser(event: any) {
    this.userIds = event ? event.map((user: any) => user.id) : [];
    this.getMyTeamTasksList(this.taskState);
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
    this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
  }
  //#endregion

  //#region for data member

  //Get my team tasks from the server
  public getMyTeamTasksList(event: any) {
    this.showSpinner = true;
    const state = event?.tab?.textLabel.replace(/\s+/g, '').toLowerCase();
    this.taskState = state || this.taskState || 'inprogress';
    if(this.taskState== 'completed'){
      this.is_assigned_by = true
    }else{
      this.is_assigned_by = false
    }
    //  this.spinnerService.showSpinner();
    this.dashboardService.getMyTeamTasksList(this.taskState, this.projectIds, this.userIds, this.is_assigned_by).subscribe(
      (response: any) => {
        if (response) {
          //   this.spinnerService.hideSpinner();
          if (response.data && response.data.length > 0) {
            //preprocess data
            // this.tasksList = Object.values(response.data?.assignee_tasks || {}).filter((assigneeTask: any) => assigneeTask?.tasks.length > 0);
            this.isNoRecordFound = true;
            this.tasksList = response?.data
              .filter((assigneeData: any) => assigneeData.tasks.length > 0)
              .map((assigneeData: any) => {
                return {
                  assignee_id: assigneeData.assignee_id,
                  firstName: assigneeData.firstName,
                  lastName: assigneeData.lastName,
                  tasks: assigneeData.tasks.map((task: any) => {
                    return {
                      ...task,
                      taskTypeIndicator: this.getTypeBaseColor(task.type),
                      priorityImg: task.priority ? task.priority.toLowerCase() + '-priority.svg' : 'flag.svg',
                    };
                  }),
                };
              });

            this.totalTasklength = this.tasksList.reduce((count, taskList) => count + taskList.tasks.length, 0) || 0;

            this.timerSourceSubscription ? this.timerSourceSubscription.unsubscribe() : '';
            this.timerCount = TASK_TIMER_DEFAULT_VALUE;
            this.timerStartedTaskId = null;

            this.tasksList.forEach((group: any) => {
              group?.tasks?.forEach((task: any) => {
                if (task.total_worked_hours) {
                  const timeParts = task.total_worked_hours.split(':');
                  if (timeParts?.length > 2) {
                    task.total_worked_hours = `${timeParts[0]}h ${timeParts[1]}m`;
                  }
                }
                // task?.working_users?.forEach((user: any) => {
                //   if (user.running_status === TASK_TIMER_CONSTANTS.ONGOING) {
                //     user['userDetails'] = task.team.find((teamMember: any) => teamMember.id === user.user_id);
                //   }
                // });
                task['_other_user_working_status'] = false;
                task['_user_working_status'] = false;
                if (task.working_users) {
                  const otherUserIndex = task?.working_users?.findIndex(
                    (user: any) => user.user_id !== this.loggedinUserid && user.running_status === TASK_TIMER_CONSTANTS.ONGOING
                  );
                  const userIndex = task?.working_users?.findIndex(
                    (user: any) => user.user_id === this.loggedinUserid && user.running_status === TASK_TIMER_CONSTANTS.ONGOING
                  );

                  if (otherUserIndex !== -1) {
                    task['_other_user_working_status'] = true;
                  }
                  if (userIndex !== -1) {
                    task['_user_working_status'] = true;
                    //   const dateOnTaskStarted = task?.working_users[userIndex]?.updated_at;
                    //   this.timerCount = this.getTimerValue(0, 0, moment().diff(dateOnTaskStarted, 'seconds'));

                    let dateOnTaskStarted = task?.working_users[userIndex]?.updated_at;
                    const currentDiff = moment().diff(dateOnTaskStarted, 'seconds');
                    dateOnTaskStarted = currentDiff >= 0 ? dateOnTaskStarted : moment();
                    this.timerCount = this.getTimerValue(0, 0, moment().diff(dateOnTaskStarted, 'seconds'));
                    this.timerStartedTaskId = task.task_id;
                    this.taskTimerStartDateTime = moment(dateOnTaskStarted);
                    this.setTaskTimer();
                  }
                }
              });
            });
            this.showSpinner = false;
          } else {
            this.tasksList = [];
            this.isNoRecordFound = false;
            this.totalTasklength = this.tasksList.reduce((count, taskList) => count + taskList.tasks.length, 0) || 0;
            this.showSpinner = false;
          }
        } else {
          this.tasksList = [];
          this.isNoRecordFound = false;
          this.totalTasklength = this.tasksList.reduce((count, taskList) => count + taskList.tasks.length, 0) || 0;
          this.showSpinner = false;
        }
      },
      (error) => {
        this.spinnerService.hideSpinner();
        this.showSpinner = false;
      }
    );
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

  //This method used to check if there are tasks in a specific state for each assignee
  hasTasksInState(assigneeTask: any, state: string): boolean {
    const stateCheck = state.replace(/\s+/g, '').toLowerCase();
    return assigneeTask.tasks.some((task: any) => task.state === stateCheck);
  }

  //This method used to filter and retrieve tasks based on the specified state
  getTasksInState(assigneeTask: any, state: string): any[] {
    const stateCheck = state.replace(/\s+/g, '').toLowerCase();
    const allTasks = assigneeTask.tasks.filter((task: any) => task.state === stateCheck);
    const sortedTasks: any = [];
    if (allTasks && Array.isArray(allTasks) && allTasks.length > 0) {
      const filtertedData: any = {
        ongoinTasks: [],
        urgentPrior: [],
        highPrior: [],
        normalPrior: [],
        lowPrior: [],
        noPrior: [],
      };
      allTasks.forEach((task: any) => {
        if (task.running_status === 'Ongoing') {
          filtertedData.ongoinTasks.push(task);
        } else {
          switch (task.priority) {
            case TASK_PRIORITY_CONSTANTS.URGENT:
              filtertedData.urgentPrior.push(task);
              break;
            case TASK_PRIORITY_CONSTANTS.HIGH:
              filtertedData.highPrior.push(task);
              break;
            case TASK_PRIORITY_CONSTANTS.NORMAL:
              filtertedData.normalPrior.push(task);
              break;
            case TASK_PRIORITY_CONSTANTS.LOW:
              filtertedData.lowPrior.push(task);
              break;
            default:
              filtertedData.noPrior.push(task);
              break;
          }
        }
      });

      sortedTasks.push(
        ...filtertedData.ongoinTasks,
        ...filtertedData.urgentPrior,
        ...filtertedData.highPrior,
        ...filtertedData.normalPrior,
        ...filtertedData.lowPrior,
        ...filtertedData.noPrior
      );
    }
    return assigneeTask.allViewed ? sortedTasks : sortedTasks.slice(0, this.defaultCount);
  }

  /* This method is used to check if a task exists in a specific state.
  If the task is not present in the state, it returns true; otherwise, it returns false */
  hasTasksInStateForNoRecord(state: string): boolean {
    const stateCheck = state.replace(/\s+/g, '').toLowerCase();
    return this.tasksList.some((assigneeTask) => assigneeTask.tasks.some((task: any) => task.state === stateCheck));
  }

  //#endregion

  //#region for set time
  //Set time
  toogleTimer(taskDetails: any) {
    if (taskDetails.state !== 'completed') {
      const timerRequestBody: TaskTimerRequestModel = {
        task_id: taskDetails.task_id,
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
                      this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.BREAK_TIME_TASK, Encryption._doEncrypt(JSON.stringify(0)));
                      this.getMyTeamTasksList(this.taskState);
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
                    this.timerStartedTaskId = taskDetails.task_id;
                    this.taskTimerStartDateTime = moment();
                    this.setTaskTimer();
                    this.getMyTeamTasksList(this.taskState);
                    this.dashboardService.setMyTaskFlag(true);
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

    // return this.getTimerValue(hoursValue, minutesValue, secondsValue);
    return this.getTimerValue(0, 0, moment().diff(this.taskTimerStartDateTime, 'seconds'));
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
  copyTaskLink(taskId: any) {
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
  //#endregion
}
