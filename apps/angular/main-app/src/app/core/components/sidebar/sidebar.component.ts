import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Encryption } from '@tms-workspace/encryption';
import { StorageService } from '../../services/common/storage.service';
import { LoginService } from '../../services/login/login.service';
import { PermissionService } from '../../services/module/settings/permission/permission.service';
import packageInfo from 'package.json';
import { PERMISSION_CONSTANTS, STORAGE_CONSTANTS } from '../../services/common/constants';
import { MessagingService } from '../../services/firebase/messaging.service';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  isSidenavOpened = true;
  isNotification = false;
  NotificationData: any;
  // allowToggle = true;\
  appVersion: string = packageInfo.version || '1.8.2';
  isExpandedPenal = true;
  sidebarSection = {
    sideBarFirstSection: [
      {
        label: 'Dashboard',
        value: 'dashboard',
        route: 'dashboard',
        imageSource: 'assets/images/dashboard.svg',
        imageAltText: 'Dashboard',
      },
      {
        label: 'Notifications',
        value: 'notifications',
        route: 'notifications',
        imageSource: 'assets/images/notification.svg',
        imageAltText: 'Notifications',
      },
      {
        label: 'Preferences',
        value: 'preferences',
        route: 'preferences',
        imageSource: 'assets/images/candle.svg',
        imageAltText: 'Preferences',
      },
    ],
    sideBarSecondSection: [
      {
        label: 'Workspaces',
        route: 'workspace',
        value: 'workspace',
        imageSource: 'assets/images/briefcase.svg',
        imageAltText: 'Workspaces',
      },
      {
        label: 'Projects',
        route: 'project',
        value: 'project',
        imageSource: 'assets/images/project.svg',
        imageAltText: 'Projects',
      },
      {
        label: 'Tasks',
        route: 'tasks',
        value: 'tasks',
        imageSource: 'assets/images/task.svg',
        imageAltText: 'Tasks',
      },
      // {
      //   label: 'Contacts',
      //   route: '3',
      //   value: 'contacts',
      //   imageSource: 'assets/images/contact.svg',
      //   imageAltText: 'Contacts',
      // },
      // {
      //   label: 'Calendar',
      //   route: '3',
      //   value: 'calendar',
      //   imageSource: 'assets/images/calendar.svg',
      //   imageAltText: 'Calendar',
      // },
    ],
    sideBarThirdSection: [
      {
        label: 'Leaves',
        route: 'leave',
        value: 'leaves',
        imageSource: 'assets/images/leaves.svg',
        imageAltText: 'Leaves',
      },
      {
        label: 'Calendar',
        route: 'holiday',
        value: 'holiday',
        imageSource: 'assets/images/devices.svg',
        imageAltText: 'Holiday',
      },
      {
        label: 'Attendance',
        route: 'attendance',
        value: 'attendance',
        imageSource: 'assets/images/reports.svg',
        imageAltText: 'Attendance',
      },
    ],
    sideBarFourthSection: [
      {
        label: 'Admin Dashboard',
        route: 'administration',
        value: 'admin_dashboard',
        imageSource: 'assets/images/dashboard1.svg',
        imageAltText: 'Admin Dashboard',
      },
      {
        label: 'Reports',
        route: 'reports',
        value: 'reports',
        imageSource: 'assets/images/report.svg',
        imageAltText: 'Report',
      },
      {
        label: 'User Permissions',
        value: 'permissions',
        route: 'permissions',
        imageSource: 'assets/images/permission.svg',
        imageAltText: 'Permissions',
      },
      {
        label: 'Site Settings',
        value: 'site_settings',
        route: 'site-settings',
        imageSource: 'assets/images/setting.svg',
        imageAltText: 'Site Settings',
      },

      {
        label: 'Messaging Templates',
        route: 'templates',
        value: 'templates',
        imageSource: 'assets/images/message1.svg',
        imageAltText: 'Messaging Templates',
      },
    ],
    sideBarFifthSection: [
      {
        label: 'Help',
        route: 'help',
        value: 'help',
        imageSource: 'assets/images/help-icon.svg',
        imageAltText: 'Help',
      },
    ],
  };

  constructor(
    private storageService: StorageService,
    private permissionService: PermissionService,
    private loginService: LoginService,
    private messagingService: MessagingService
  ) {
    // this.checkResponsive();
    this.checkPermission();
    messagingService.get_isNotification.subscribe((res: any) => {
      this.isNotification = res;
    });
    const data: any = storageService.getFromLocalStorage(STORAGE_CONSTANTS.NOTIFICATION);
    // console.log('data: ', data);
    if (data) {
      this.NotificationData = JSON.parse(Encryption._doDecrypt(data));
      // console.log('this.NotificationData: ', this.NotificationData);
      if (this.NotificationData.length > 0) {
        messagingService.set_isNotification(true);
      } else {
        messagingService.set_isNotification(false);
      }
    } else {
      messagingService.set_isNotification(false);
    }
  }
  ngOnInit(): void {
    if (!localStorage.getItem(STORAGE_CONSTANTS.IS_SIDEBAR_OPENED)) {
      localStorage.setItem(STORAGE_CONSTANTS.IS_SIDEBAR_OPENED, JSON.stringify(this.isSidenavOpened));
    }
    if (localStorage.getItem(STORAGE_CONSTANTS.IS_SIDEBAR_OPENED)) {
      this.isSidenavOpened = JSON.parse(localStorage.getItem(STORAGE_CONSTANTS.IS_SIDEBAR_OPENED) || '');
    }
    // this.sidebarSection = Object.values(this.sidebarSection);
  }

  toggleSidenav() {
    this.isSidenavOpened = !this.isSidenavOpened;
    localStorage.setItem(STORAGE_CONSTANTS.IS_SIDEBAR_OPENED, JSON.stringify(this.isSidenavOpened));
  }

  // @HostListener('window:resize', ['$event'])
  // checkResponsive() {
  //   if (window.innerWidth > 768 && window.innerWidth < 990) {
  //     this.allowToggle = false;
  //     this.isSidenavOpened = false;
  //   } else if (window.innerWidth <= 768 && window.innerWidth > 0) {
  //     this.allowToggle = false;
  //     this.isSidenavOpened = false;
  //   } else {
  //     this.allowToggle = true;
  //     this.isSidenavOpened = true;
  //   }
  // }

  checkPermission() {
    // console.log(this.permissionService.getModuleActionPermissionData('workspace', 'create'));
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.sidebarSection.sideBarFirstSection = this.sidebarSection.sideBarFirstSection.filter((module: any) => {
        return this.permissionService.getModulePermission(permission, module.value);
      });

      this.sidebarSection.sideBarSecondSection = this.sidebarSection.sideBarSecondSection.filter((module: any) => {
        return this.permissionService.getModulePermission(permission, module.value);
      });

      this.sidebarSection.sideBarThirdSection = this.sidebarSection.sideBarThirdSection.filter((module: any) => {
        return this.permissionService.getModulePermission(permission, module.value);
      });

      this.sidebarSection.sideBarFourthSection = this.sidebarSection.sideBarFourthSection.filter((module: any) => {
        return this.permissionService.getModulePermission(permission, module.value);
      });

      this.sidebarSection.sideBarFifthSection = this.sidebarSection.sideBarFifthSection.filter((module: any) => {
        return this.permissionService.getModulePermission(permission, module.value);
      });
    } else {
      const isUserLoggedIn = this.loginService.isUserLoggedIn();
      if (isUserLoggedIn) {
        this.loginService.logout();
      }
    }
  }
}
