import { Component, Input, OnInit } from '@angular/core';
import { DashboardService } from '../../../../core/services/module/dashboard/dashboard.service';
import moment from 'moment';

@Component({
  selector: 'main-app-general-info',
  templateUrl: './general-info.component.html',
  styleUrls: ['./general-info.component.scss'],
})
export class GeneralInfoComponent implements OnInit {
  //#region Data member

  @Input() generalInfoPermissionObject: any; // Get permission object with @Input()
  public leavesDetails: any[] = [];
  public leaveMessages: any = [];

  // Data for each step
  public reminderDetails: any[] = [];
  public reminderMessage: any = [];
  public generalActivityDetails: any[] = [];
  public showSpinner = true;
  //#endregion

  //#region Component Structure Methods
  constructor(private dashboardService: DashboardService) {}
  ngOnInit(): void {
    if (this.generalInfoPermissionObject.hasRemindersPermission) {
      this.getReminderDetails();
    } else if (this.generalInfoPermissionObject.hasleavesPermission) {
      this.getLeaveTeamsDashboard();
    } else {
      // this.getGeneralActivityDetails();
    }
  }

  //#endregion

  //#region For member function

  //#region Tab chnage method
  onTabChange(event: any) {
    const state = event?.tab?.textLabel.replace(/\s+/g, '').toLowerCase();
    if (state === 'reminders') {
      this.getReminderDetails();
    } else if (state === 'leaves') {
      this.getLeaveTeamsDashboard();
    } else if (state === 'generalactivity') {
      // this.getGeneralActivityDetails();
    }
  }
  //#endregion

  //#region for get reminder details
  getReminderDetails() {
    this.showSpinner = true;
    this.dashboardService.getReminderDetails().subscribe(
      (response: any) => {
        if (response) {
          if (response?.data && response?.data?.remindersData && response?.data?.remindersData.length > 0) {
            this.reminderDetails = response.data.remindersData;
            if (this.reminderDetails && this.reminderDetails.length > 0) {
              this.processRemiderData(this.reminderDetails);
            }
          } else {
            this.reminderDetails = [];
          }
          this.showSpinner = false;
        } else {
          this.reminderDetails = [];
          this.showSpinner = false;
        }
      },
      (err: any) => {
        this.showSpinner = false;
      }
    );
  }
  //Preprocess data
  public processRemiderData(reminderDetails: any) {
    this.reminderMessage = [];
    const messages: string[] = [];

    for (const reminder of reminderDetails) {
      switch (reminder.isHoliday) {
        case '0':
          messages.push(this.preProcessSpecialDay(reminder));
          break;
        case '1':
          messages.push(this.preProcessHoliday(reminder));
          break;
        case '2':
          messages.push(this.preProcessBirthday(reminder));
          break;
        case '3':
          messages.push(this.preProcessWorkAnniversary(reminder));
          break;
        default:
          messages.push('');
          break;
      }
    }
    this.reminderMessage = [...messages];
  }

  //This method used for display special day details
  public preProcessSpecialDay(reminder: any): any {
    const fromDate = new Date(reminder?.eventDate);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let message = '';

    if (fromDate.toDateString() === today.toDateString()) {
      message = `${reminder?.title} is today. `;
    } else if (fromDate.toDateString() === tomorrow.toDateString()) {
      message = `${reminder?.title} is tomorrow. `;
    } else {
      message = `${reminder?.title} is on ${moment(fromDate).format('DD/MM/YYYY')}.`;
    }
    const specialDay = `${reminder?.isHoliday}`;
    return {
      reminderMessage: message,
      specialDay: specialDay,
    };
  }

  //This method used for display holiday details
  public preProcessHoliday(reminder: any): any {
    const fromDate = new Date(reminder?.eventDate);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let message = '';

    if (fromDate.toDateString() === today.toDateString()) {
      message = `${reminder?.title} is today. `;
    } else if (fromDate.toDateString() === tomorrow.toDateString()) {
      message = `${reminder?.title} is tomorrow. `;
    } else {
      message = `${reminder?.title} is on ${moment(fromDate).format('DD/MM/YYYY')}.`;
    }
    const specialDay = `${reminder?.isHoliday}`;
    return {
      reminderMessage: message,
      specialDay: specialDay,
    };
  }

  //This method used for display birthday details
  public preProcessBirthday(reminder: any): any {
    const fromDate = new Date(reminder?.eventDate);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let message = '';

    if (fromDate.toDateString() === today.toDateString()) {
      message = `It's ${reminder?.title}'s birthday today. `;
    } else if (fromDate.toDateString() === tomorrow.toDateString()) {
      message = `${reminder?.title}'s birthday is tomorrow. `;
    } else {
      message = `${reminder?.title}'s birthday is on ${moment(fromDate).format('DD/MM/YYYY')}.`;
    }
    const specialDay = `${reminder?.isHoliday}`;
    const designation = `${reminder?.designation}`;
    return {
      reminderMessage: message,
      specialDay: specialDay,
      designation: designation,
    };
  }

  //This method used for display birthday details
  public preProcessWorkAnniversary(reminder: any): any {
    const fromDate = new Date(reminder?.eventDate);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let message = '';

    if (fromDate.toDateString() === today.toDateString()) {
      message = `It's ${reminder?.title}'s work anniversary today.`;
    } else if (fromDate.toDateString() === tomorrow.toDateString()) {
      message = `${reminder?.title}'s work anniversary is tomorrow.`;
    } else {
      message = `${reminder?.title}'s work anniversary is on ${moment(fromDate).format('DD/MM/YYYY')}.`;
    }
    const specialDay = `${reminder?.isHoliday}`;
    const designation = `${reminder?.designation}`;
    return {
      reminderMessage: message,
      specialDay: specialDay,
      designation: designation,
    };
  }
  //#endregion

  //#region for get general activity details

  getGeneralActivityDetails() {
    this.dashboardService.getGeneralActivityDetails().subscribe((response: any) => {
      if (response) {
        if (response.data && response.data.length > 0) {
          this.generalActivityDetails = response.data;
        } else {
          this.generalActivityDetails = [];
        }
      } else {
        this.generalActivityDetails = [];
      }
    });
  }

  //#endregion

  //#region for get leaves details
  getLeaveTeamsDashboard() {
    this.showSpinner = true;
    this.dashboardService.getLeaveTeamsDashboard().subscribe((response: any) => {
      if (response) {
        if (response.data && response.data.length > 0) {
          this.leavesDetails = response.data;
          this.processLeaveData(this.leavesDetails);
        } else {
          this.leavesDetails = [];
          this.showSpinner = false;
        }
      } else {
        this.leavesDetails = [];
        this.showSpinner = false;
      }
    });
  }

  //Preprocess data
  processLeaveData(leavesDetails: any[]) {
    this.leaveMessages = [];
    const messages: string[] = [];
    for (const leave of leavesDetails) {
      let status = leave.status; // Get the status before converting to uppercase
      status = status.toUpperCase(); // Convert it to uppercase
      switch (status) {
        case 'PENDING':
          messages.push(this.processPendingLeave(leave));
          break;
        case 'APPROVED':
          messages.push(this.processApprovedLeave(leave));
          break;
        default:
          messages.push(this.processOtherLeaveStatus(leave));
          break;
      }
    }
    this.leaveMessages = [...messages];
    this.showSpinner = false;
  }

  //This method used for display pending leave
  processPendingLeave(leave: any): any {
    const fromDate = new Date(leave.from_date);
    const toDate = new Date(leave.to_date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let message = '';

    if (fromDate.toDateString() === today.toDateString() && fromDate.toDateString() === toDate.toDateString()) {
      message = `${leave.user?.first_name} ${leave.user?.last_name} has requested leave for today (${leave?.leave_from_slot}).`;
    } else if (fromDate.toDateString() === tomorrow.toDateString() && toDate.toDateString() === tomorrow.toDateString()) {
      message = `${leave.user?.first_name + ' ' + leave.user?.last_name} has requested leave for tomorrow (${leave?.leave_from_slot}).`;
    } else if (fromDate.toDateString() === toDate.toDateString()) {
      message = `${leave.user?.first_name} ${leave.user?.last_name} has requested leave for ${moment(fromDate).format('DD/MM/YYYY')} (${
        leave?.leave_from_slot
      }).`;
    } else {
      message = `${leave.user?.first_name + ' ' + leave.user?.last_name} has requested leave from ${moment(fromDate).format('DD/MM/YYYY')} (${
        leave?.leave_from_slot
      }) to ${moment(toDate).format('DD/MM/YYYY')} (${leave?.leave_to_slot}).`;
    }

    const employeeDesignation = `${leave.user?.designation}`;

    return {
      leaveMessage: message,
      designation: employeeDesignation,
    };
  }

  //This method used for display approved leave
  processApprovedLeave(leave: any): any {
    const fromDate = new Date(leave.from_date);
    const toDate = new Date(leave.to_date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let message = '';

    if (fromDate.toDateString() === today.toDateString() && fromDate.toDateString() === toDate.toDateString()) {
      message = `${leave.user?.first_name} ${leave.user?.last_name} is on leave today (${leave?.leave_from_slot}).`;
    } else if (fromDate.toDateString() === tomorrow.toDateString() && toDate.toDateString() === tomorrow.toDateString()) {
      message = `${leave.user?.first_name} ${leave.user?.last_name} will be on leave tomorrow (${leave?.leave_from_slot}).`;
    } else if (fromDate.toDateString() === toDate.toDateString()) {
      message = `${leave.user?.first_name} ${leave.user?.last_name} will be on leave on ${moment(fromDate).format('DD/MM/YYYY')} (${
        leave?.leave_from_slot
      }).`;
    } else {
      message = `${leave.user?.first_name} ${leave.user?.last_name} is on leave from ${moment(fromDate).format('DD/MM/YYYY')} (${
        leave?.leave_from_slot
      }) to ${moment(toDate).format('DD/MM/YYYY')} (${leave?.leave_to_slot}).`;
    }
    const employeeDesignation = `${leave.user?.designation}`;
    return {
      leaveMessage: message,
      designation: employeeDesignation,
    };
  }
  // This method used for display other leave
  processOtherLeaveStatus(leave: any): any {
    // Perform actions for other leave statuses
    // console.log(`Processing leave with ID ${leave.id} and status ${leave.status}`);
  }
  //#endregion

  //#endregion
}
