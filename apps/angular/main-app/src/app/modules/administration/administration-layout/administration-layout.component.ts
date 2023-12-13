import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../../core/services/common/storage.service';
import { Encryption } from '@tms-workspace/encryption';
import { LoginService } from '../../../core/services/login/login.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { PERMISSION_CONSTANTS } from '../../../core/services/common/constants';

@Component({
  selector: 'main-app-administration-layout',
  templateUrl: './administration-layout.component.html',
  styleUrls: ['./administration-layout.component.scss'],
})
export class AdministrationLayoutComponent {
  // boxData: any = [
  //   // {
  //   //   title: 'Reports',
  //   //   icon: 'assets/images/reports.svg',
  //   //   url: '/administration/reports',
  //   //   description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam consectetur',
  //   // },
  //   // {
  //   //   title: 'Work Reports',
  //   //   icon: 'assets/images/workreport.svg',
  //   //   url: '/administration/work-reports',
  //   //   description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam consectetur',
  //   // },
  //   // {
  //   //   title: 'Leave Management',
  //   //   icon: 'assets/images/leaves1.svg',
  //   //   url: '/administration/manual-update-leaves',
  //   //   description:
  //   //     'Centralize leave records for PL, CL and LWP. Set PL and CL allowances monthly, manual LWP adjustments for precise leave management.',
  //   //   moduleName: 'admin_dashboard.leave_management',
  //   //   showItem: false,
  //   // },
  //   // {
  //   //   title: 'Current Leave Details',
  //   //   icon: 'assets/images/current-leave-details.svg',
  //   //   url: '/administration/current-leave-details',
  //   //   description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam consectetur',
  //   //   moduleName: 'admin_dashboard.current_leave_details',
  //   //   showItem: false,
  //   // },
  //   // {
  //   //   title: 'Billing Configuration',
  //   //   icon: 'assets/images/reports_current_leaves.svg',
  //   //   url: '/administration/billing-configuration',
  //   //   description: 'Manage project statuses, Set and track working hours, Configure billing preferences.',
  //   //   moduleName: 'admin_dashboard.billing_configuration',
  //   //   showItem: false,
  //   // },
  //   // {
  //   //   title: 'Attendance Reports',
  //   //   icon: 'assets/images/attendance.svg',
  //   //   url: '/administration/attendance',
  //   //   description: 'Provides a comprehensive overview of employee attendance data, enabling administrators to monitor attendance patterns.',
  //   //   moduleName: 'admin_dashboard.attendance',
  //   //   showItem: false,
  //   // },
  //   // {
  //   //   title: 'Leave Master Data',
  //   //   icon: 'assets/images/attendance.svg',
  //   //   url: '/administration/leave-master-data',
  //   //   description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam consectetur.',
  //   //   moduleName: 'admin_dashboard.leave-master-data',
  //   //   showItem: false,
  //   // },
  // ];

  // ngOnInit() {
  //   let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
  //   if (permission != null) {
  //     permission = JSON.parse(Encryption._doDecrypt(permission));
  //     this.boxData.forEach((item: any) => (item.showItem = this.permissionService.getModuleActionPermission(permission, item.moduleName, 'view')));
  //     this.boxData = this.boxData.filter((item: any) => item.showItem);
  //   } else {
  //     this.loginService.logout();
  //   }
  // }

  constructor(
    private router: Router,
    private storageService: StorageService,
    private loginService: LoginService,
    private permissionService: PermissionService
  ) {}

  onClickBox(item: any) {
    this.router.navigate([item.url]);
  }
}
