import { Component, OnInit, ViewChild } from '@angular/core';
import { NotificationService } from '../../../core/services/module/notification/notification.service';
import moment from 'moment';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { environment } from 'apps/angular/main-app/src/environments/environment';
import { STORAGE_CONSTANTS } from '../../../core/services/common/constants';
import { MessagingService } from '../../../core/services/firebase/messaging.service';

@Component({
  selector: 'main-app-tms-workspace-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  //#region For Data member

  public TaskNotificatiionData: any;
  public LeaveNotificatiionData: any;
  isNotification: any;
  _base_url = environment.base_url;

  params = {
    Leavepage: 1,
    Leavelimit: 10,
    Taskpage: 1,
    Tasklimit: 10,
  };

  notificationLeavesCount: any;
  notificationTasksCount: any;
  showSpinner = true;

  //#endregion

  //#region For Component Structure Methods
  constructor(private notificationService: NotificationService, private router: Router, private messagingService: MessagingService, private route: ActivatedRoute) {


  }
  ngOnInit(): void {

    this.getNotificationLogs();
    this.removeMessageBadge();

  }
  removeMessageBadge() {
    this.messagingService.set_isNotification(false)
    localStorage.removeItem(STORAGE_CONSTANTS.NOTIFICATION);
  }

  //#endregion
  getNotificationLogs() {
    this.showSpinner = true;
    this.notificationService.getNotificationLogs(this.params).subscribe((res: any) => {
      this.TaskNotificatiionData =
        res.data.notifcationTasks &&
        res.data.notifcationTasks.map((item: any) => ({
          ...item,
          notificationTitleSplitted:
            Array.isArray(this.notificationTitle(item?.notificationTitle)?.split('^^&^%@^^')) &&
              this.notificationTitle(item?.notificationTitle)?.split('^^&^%@^^')?.length > 0
              ? this.notificationTitle(item?.notificationTitle)?.split('^^&^%@^^')
              : item?.notificationTitle,
          time: moment(item.updatedAt).fromNow(),
        }));
      this.notificationTasksCount = res.data.notificationTasksCount;
      this.LeaveNotificatiionData =
        res.data.notifcationLeaves &&
        res.data.notifcationLeaves.map((item: any) => ({
          ...item,
          time: moment(item.updatedAt).fromNow(),
        }));

      this.notificationLeavesCount = res.data.notificationLeavesCount;
      this.showSpinner = false;
    });
  }

  redirectToTaskPage(notification: any) {
    this.router.navigate(['tasks', 'view', Encryption._doEncrypt(notification.task_id.toString())]);
  }

  redirectToNotification(notification: any) {
    this.router.navigate(['leave', 'details', Encryption._doEncrypt(notification.leave_id.toString())]);
  }

  onViewMoreTask() {
    this.params.Taskpage = this.params.Taskpage + 1;

    this.notificationService
      .getNotificationLogs({
        Taskpage: this.params.Taskpage,
        Tasklimit: this.params.Tasklimit,
      })
      .subscribe((res: any) => {
        this.TaskNotificatiionData.push(
          ...res.data.notifcationTasks.map((item: any) => ({
            ...item,
            notificationTitleSplitted:
              Array.isArray(this.notificationTitle(item?.notificationTitle)?.split('^^&^%@^^')) &&
                this.notificationTitle(item?.notificationTitle)?.split('^^&^%@^^')?.length > 0
                ? this.notificationTitle(item?.notificationTitle)?.split('^^&^%@^^')
                : item?.notificationTitle,
            time: moment(item.updatedAt).fromNow(),
          }))
        );
      });
  }

  onViewMoreLeave() {
    this.params.Leavepage = this.params.Leavepage + 1;

    this.notificationService
      .getNotificationLogs({
        Leavepage: this.params.Leavepage,
        Leavelimit: this.params.Leavelimit,
      })
      .subscribe((res: any) => {
        this.LeaveNotificatiionData.push(
          ...res.data.notifcationLeaves.map((item: any) => ({
            ...item,
            time: moment(item.updatedAt).fromNow(),
          }))
        );
      });
  }
  //#region For Member Functiom
  //#endregion

  notificationTitle(title: string) {
    if (title && title?.length > 0) {
      // const splitTitle = title?.split(']');
      const splitTitle = title?.split('^^&^%@^^');
      // const projectTitle = splitTitle[0] + ']';
      // const otherTitle = splitTitle[1]?.split(':');
      // const commonTitle = otherTitle[0] + ':';
      // const taskTitle = otherTitle[1];
      const projectTitle = splitTitle[0];
      const commonTitle = splitTitle[1];
      const taskTitle = splitTitle[2];

      if (projectTitle?.length > 0 && commonTitle?.length > 0 && taskTitle?.length > 0) {
        // return title;
        return projectTitle + '^^&^%@^^' + commonTitle + '^^&^%@^^' + taskTitle;
      } else {
        return title;
      }
    }
    return '';
  }
}
