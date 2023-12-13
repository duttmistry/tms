import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Encryption } from '@tms-workspace/encryption';
import moment from 'moment';
import { ReportsService } from '../../../core/services/module/reports/reports.service';
import { Subscription } from 'rxjs';
import { TASK_PRIORITY_CONSTANTS } from '../../../core/services/common/constants';

@Component({
  selector: 'main-app-tms-workspace-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  public displayedColumns: string[] = [
    'srNo',
    'project',
    'setPriority',
    'taskname',
    'assignedby',
    'tl',
    'duedate',
    'estimated',
    'lastworked',
    'totaltime',
  ];
  public reporterUserName!: string;
  public subscriptions: Subscription[] = [];
  priorityList: any[] = [];
  currentTaskIdToEdit = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<UserDetailsComponent>,
    private reportsService: ReportsService
  ) {}
  ngOnInit(): void {
    this.subscriptions.push(
      this.reportsService.getUserIdWiseTaskData().subscribe((data: any) => {
        if (data) {
          const today = moment().startOf('day'); // Start of today
          data.forEach((taskList: any) => {
            const dueDate = moment(taskList.due_date);
            taskList.showDueDate = dueDate?.isValid() ? dueDate.format('DD-MM-YYYY') : '';
            taskList.isDueDatePassed = dueDate.isBefore(today);
            taskList.isDueDateToday = dueDate.isSame(today);

            // Calculate if total_time is greater than task_eta
            taskList.isTotalTimeGreaterThanTaskEta = this.isTotalTimeGreaterThanTaskEta(taskList);
            taskList['priorityImg'] = taskList?.priority ? taskList?.priority.toLowerCase() + '-priority.svg' : 'flag.svg';
          });
          this.reporterUserName = `${data[0].assigneeUser.first_name} ${data[0].assigneeUser.last_name}`;
          this.data = data;
        }
      })
    );
    this.setPriorityList();
  }
  ngOnDestroy(): void {
    this.dialogRef?.close();
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }

  public closeDialog() {
    this.dialogRef?.close();
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }

  // This function used for check total time with eta
  isTotalTimeGreaterThanTaskEta(element: any): boolean {
    const totalTime = this.timeToSeconds(element?.total_worked_hours);
    const taskEtaTime = this.timeToSeconds(element?.eta);

    // Compare total_time and task_eta
    return totalTime > taskEtaTime;
  }

  // Function to convert time string to seconds
  private timeToSeconds(time: string): number {
    time = time?.trim() ?? '0';
    // Check if the time string contains 'h' and 'm' to determine the format
    if (time.includes('h') && time.includes('m')) {
      // Format: "0h 20m"
      const parts = time.split(' ');
      if (parts.length === 4) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[2], 10);
        return hours * 3600 + minutes * 60;
      }
    } else if (time.includes(':')) {
      // Format: "20:10:15" or "00:12:15"
      const timeParts = time.split(':');
      if (timeParts.length === 3) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const seconds = parseInt(timeParts[2], 10);
        return hours * 3600 + minutes * 60 + seconds;
      }
    } else if (time.includes('h')) {
      // Format: "2h"
      const hours = parseInt(time, 10);
      return hours * 3600;
    }
    return 0; // Default value
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

  //This method used for set task priority

  setTaskPriority(taskId: any, priority: any) {
    console.log(taskId, priority);
    taskId = Encryption._doEncrypt(taskId.toString());
    if (taskId && taskId !== '' && priority && priority?.name && priority?.name !== '') {
      this.reportsService.setTaskPriority(taskId, priority?.name).subscribe({
        next: (response: any) => {
          if (response) {
            if (response.success) {
              this.reportsService.setUserFlag(true);
            }
          }
        },
        error: (error: any) => {
          console.log('error:', error);
        },
      });
    }
  }

  public clearPriority(taskId: any, priority: any) {
    console.log(taskId, priority);
    taskId = Encryption._doEncrypt(taskId.toString());
    if (taskId && taskId !== '') {
      this.reportsService.setTaskPriority(taskId, priority ? priority : JSON.stringify(priority)).subscribe({
        next: (response: any) => {
          if (response) {
            if (response.success) {
              this.reportsService.setUserFlag(true);
            }
          }
        },
        error: (error: any) => {
          console.log('error:', error);
        },
      });
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
}
