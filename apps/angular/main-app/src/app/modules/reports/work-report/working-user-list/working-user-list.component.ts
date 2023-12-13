import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ReportsService } from '../../../../core/services/module/reports/reports.service';
import { Encryption } from '@tms-workspace/encryption';
import { Router } from '@angular/router';
import moment from 'moment';
import { MatDialog } from '@angular/material/dialog';
import { UserDetailsComponent } from '../../../../shared/components/user-details/user-details.component';
import { Subscription } from 'rxjs/internal/Subscription';
import { TASK_PRIORITY_CONSTANTS } from '../../../../core/services/common/constants';

@Component({
  selector: 'main-app-tms-workspace-working-user-list',
  templateUrl: './working-user-list.component.html',
  styleUrls: ['./working-user-list.component.scss'],
})
export class WorkingUserListComponent implements OnInit, OnDestroy {
  //#region For Data member
  public displayedColumns: string[] = [
    'id',
    'user',
    'project',
    'setPriority',
    'taskname',
    'assignedby',
    // 'tl',
    'status',
    'duedate',
    'current',
    'assigned',
    'totaltime',
    'todaytotal',
    'loginat',
    'break',
    'logout',
  ];
  public dataSource = new MatTableDataSource<any>();
  public emptyData = new MatTableDataSource([{ empty: 'row' }]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public workingUsersList: any = [];
  public projectFilterValue: any[] = [];
  public userFilterValue: any[] = [];
  public projectSearchText = '';
  public userSearchText = '';
  public projectFilterOptions: any[] = [];
  public userFilterOptions: any[] = [];
  @Input() loggedInUserId: any;
  @Output() handleUserButtonClicked = new EventEmitter<any>();
  @Output() taskStopButtonClicked = new EventEmitter<void>();
  showSpinner = true;
  public refetchDataFlag = false;
  public userId: any;
  public subscriptions: Subscription[] = [];
  toatlWorkFromHome = 0;
  showOnlyWorkFromHomeUsers = false;
  totalUsersCount = 0;
  priorityList: any[] = [];
  currentTaskIdToEdit = null;

  //#region For Component Structure Methods
  constructor(private reportsService: ReportsService, private router: Router, private dialog: MatDialog) {
    const today = moment().startOf('day'); // Start of today
    this.reportsService.getWorkingUserData().subscribe(
      (response: any) => {
        if (response) {
          this.workingUsersList = response;
          this.workingUsersList.forEach((workingList: any) => {
            const dueDate = moment(workingList.task_due_date);
            workingList.showDueDate = dueDate?.isValid() ? dueDate.format('DD-MM-YYYY') : '';
            workingList.isDueDatePassed = dueDate.isBefore(today);
            workingList.isDueDateToday = dueDate.isSame(today);
            // Calculate if total_time is greater than task_eta
            workingList.isTotalTimeGreaterThanTaskEta = this.isTotalTimeGreaterThanTaskEta(workingList);
            workingList['priorityImg'] = workingList?.task_priority ? workingList?.task_priority.toLowerCase() + '-priority.svg' : 'flag.svg';
          });
          this.dataSource = new MatTableDataSource(this.workingUsersList);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.getFilterOptions();
          this.showSpinner = false;
          this.totalUsersCount = this.workingUsersList?.length || 0;
          this.toatlWorkFromHome = this.workingUsersList.filter((user: any) => user?.login_capture_data?.isWfo === false)?.length || 0;
        }
        this.showSpinner = false;
      },
      (err: any) => {
        this.showSpinner = false;
      }
    );
  }
  ngOnInit(): void {
    this.subscriptions.push(
      this.reportsService.getUserIdWiseDataRefetch().subscribe((response: any) => {
        if (response && response.flag === true && response.componentName === 'workinguser') {
          this.refetchDataFlag = true;
          this.openTaskDetails(response?.userId);
        } else {
          this.refetchDataFlag = false;
        }
      })
    );
    this.setPriorityList();
  }
  ngOnDestroy(): void {
    this.dialog?.closeAll();
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }

  //#endregion

  //#region For Member Functiom

  // This method used for sort particular table column
  sortData(sort: Sort) {
    const data = this.workingUsersList.slice(); // Create a copy of the workingUsersList array

    if (!sort.active || sort.direction === '') {
      // No sorting required if sort.active is empty or sort.direction is not specified
      return;
    }

    data.sort((a: any, b: any) => {
      const isAsc = sort.direction === 'asc';

      switch (sort.active) {
        case 'user':
          return this.compare(a.user_first_name + a.user_last_name, b.user_first_name + b.user_last_name, isAsc);
        case 'project':
          return this.compare(a.project_name, b.project_name, isAsc);
        case 'tl':
          return this.compare(a.team_lead_first_name + a.team_lead_last_name, b.team_lead_first_name + b.team_lead_last_name, isAsc);
        default:
          return 0;
      }
    });

    this.dataSource = new MatTableDataSource<any>(data);
  }

  public compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  // This method used for get filter options
  getFilterOptions(): void {
    this.projectFilterOptions = this.getUniqueProjectOptions();
    this.userFilterOptions = this.getUniqueUserOptions();
  }

  // This method used for get filter projects option
  filterProjectOptions() {
    const searchText = this.projectSearchText.toLowerCase();
    this.projectFilterOptions.forEach((option) => {
      if (searchText) {
        if (option.projectName.toLowerCase().includes(searchText)) {
          option.visible = true;
        } else {
          option.visible = false;
        }
      } else {
        option.visible = true;
      }
    });
  }

  // This method used for get filter users option
  filterUserOptions() {
    const searchText = this.userSearchText.toLowerCase();
    this.userFilterOptions.forEach((option) => {
      if (searchText) {
        if (option.name.toLowerCase().includes(searchText)) {
          option.visible = true;
        } else {
          option.visible = false;
        }
      } else {
        option.visible = true;
      }
    });
  }

  // This method used for apply filter
  applyFilters() {
    this.dataSource.filterPredicate = (data: any) => {
      const projectMatch = this.projectFilterValue.length === 0 || this.projectFilterValue.includes(data.project_name);

      const userFullName = `${data.user_first_name} ${data.user_last_name}`;
      const userMatch = this.userFilterValue.length === 0 || this.userFilterValue.includes(userFullName);

      return projectMatch && userMatch;
    };

    this.dataSource.filter = Math.random().toString(); // Trigger the filter update
  }

  // This method used for get uniq option for projects
  getUniqueProjectOptions(): any[] {
    //  const uniqueOptions = new Set<any>();
    const uniqueOptions: Map<string, any> = new Map<string, any>();
    this.workingUsersList.forEach((data: any) => {
      const projectName = data?.project_name;
      if (!uniqueOptions.has(projectName)) {
        uniqueOptions.set(projectName, { id: data?.user_id, projectName, visible: true });
      }
    });

    return Array.from(uniqueOptions.values());
  }

  // This method used for get uniq option for users
  getUniqueUserOptions(): any[] {
    const uniqueOptions = new Set<any>();
    this.workingUsersList.forEach((data: any) => {
      const fullName = `${data?.user_first_name} ${data?.user_last_name}`;
      uniqueOptions.add({ id: data?.user_id, name: fullName, visible: true });
    });
    return Array.from(uniqueOptions);
  }
  //This method used for set user id and handle button clicked
  public logoutUser(user: any) {
    if (user) {
      this.reportsService.setUserData(user);
      this.handleUserButtonClicked.emit('logout');
    } else {
      // console.log('unable to get userId');
    }
  }

  //This method used for set task id
  public stopTask(userData: any) {
    if (userData) {
      this.reportsService.setUserData(userData);
      this.taskStopButtonClicked.emit();
    } else {
      // console.log('unable to get userId');
    }
  }

  //This method used for set task id
  public breakTime(user: any) {
    if (user) {
      this.reportsService.setUserData(user);
      this.handleUserButtonClicked.emit('breakTime');
    } else {
      // console.log('unable to get userId');
    }
  }

  // This method used for constructing the task detail link with an encrypted task_id
  getTaskDetailLink(taskId: string) {
    if (taskId) {
      taskId = Encryption._doEncrypt(taskId.toString()); // Use your encryption method
      return ['/tasks/view', taskId];
    }
    // Handle the case where taskId is not available or invalid
    return ['/tasks']; // Redirect to a default route or handle it as needed
  }

  //This method used for show task details
  public openTaskDetails(userId: any) {
    const userObj = {
      flag: false,
      componentName: 'workinguser',
      userId: userId,
    };
    try {
      //  this.userId = userId.toString();
      userId = Encryption._doEncrypt(userId.toString());
      this.reportsService.getUserIdWiseTaskDetails(userId).subscribe(
        (response: any) => {
          if (response?.data && response?.data?.length > 0) {
            if (!this.refetchDataFlag) {
              this.dialog.open(UserDetailsComponent, {
                disableClose: true,
              });
            }
            this.reportsService.setUserIdWiseTaskDetails(response.data);
            this.reportsService.setUserIdWiseDataRefetch(userObj);
          } else {
            // console.log('No Task');
            this.reportsService.setUserIdWiseTaskDetails([]);
            this.reportsService.setUserIdWiseDataRefetch(userObj);
          }
        },
        (err: any) => {
          this.reportsService.setUserIdWiseDataRefetch(userObj);
        }
      );
    } catch (err: any) {
      this.reportsService.setUserIdWiseDataRefetch(userObj);
    }
  }

  // This function used for check total time with eta
  isTotalTimeGreaterThanTaskEta(element: any): boolean {
    // Check if total_time and task_eta are available and parse them into minutes
    const totalTime = this.timeToSeconds(element.total_time);
    const taskEtaTime = this.timeToSeconds(element.task_eta);

    // Compare total_time and task_eta
    return totalTime > taskEtaTime;
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

  setPriorityList() {
    if (this.priorityList) {
      Object.values({ ...TASK_PRIORITY_CONSTANTS }).forEach((task: string) => {
        if (task) {
          this.priorityList.push({ id: this.priorityList.length + 1, name: task, priorityImg: task.toLowerCase() + '-priority.svg' });
        }
      });
    }
  }
  //This method used for set urgent priorty
  setTaskPriority(priority: any, user: any) {
    user.priority = priority;
    if (user) {
      this.reportsService.setUserData(user);
      this.handleUserButtonClicked.emit('setPriority');
    } else {
      console.log('unable to get userId');
    }
  }

  clearPriority(user: any, priority: any) {
    user.priority = priority;
    if (user) {
      this.reportsService.setUserData(user);
      this.handleUserButtonClicked.emit('setPriority');
    } else {
      console.log('unable to get userId');
    }
  }

  _OnShowOnlyWFHClick() {
    this.showOnlyWorkFromHomeUsers = true;
    const filteredData = this.workingUsersList.filter((user: any) => user?.login_capture_data?.isWfo === false);
    this.dataSource = new MatTableDataSource(filteredData);
    this.totalUsersCount = filteredData?.length || 0;
  }
  _removeFilterWFHOnly() {
    this.showOnlyWorkFromHomeUsers = false;
    this.dataSource = new MatTableDataSource(this.workingUsersList);
    this.totalUsersCount = this.workingUsersList?.length || 0;
  }
  //#endregion
}
