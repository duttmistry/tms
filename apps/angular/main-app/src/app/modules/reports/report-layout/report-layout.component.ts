import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../../core/services/common/storage.service';
import { LoginService } from '../../../core/services/login/login.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { Encryption } from '@tms-workspace/encryption';
import { PERMISSION_CONSTANTS } from '../../../core/services/common/constants';

@Component({
  selector: 'main-app-tms-workspace-report-layout',
  templateUrl: './report-layout.component.html',
  styleUrls: ['./report-layout.component.scss'],
})
export class ReportLayoutComponent implements OnInit {
  //#region For Data member
  boxData = [
    {
      title: 'Task and Project Insights',
      panelOpen: true,
      reports: [
        {
          title: 'Activity Reports',
          icon: 'assets/images/reports_work_report.svg',
          url: '/reports/work-reports',
          description: `This detailed report offers real-time information on each team member's current activities, asily identify who is actively engaged in tasks, who is on break, who is on leave, who has logged out, and who is available – all at a glance.`,
          moduleName: 'reports.work_reports',
          showItem: false,
        },
        {
          title: 'Project Reports',
          icon: 'assets/images/reports_project_report.svg',
          url: '/reports/project-reports',
          description: `It offers a detailed analysis of the total worked time invested in individual projects.`,
          moduleName: 'reports.project_reports',
          showItem: false,
        },
        {
          title: 'Billing Configuration',
          icon: 'assets/images/reports_current_leaves.svg',
          url: '/reports/billing-configuration',
          description: `This report encompasses key project details, including the project start date, total worked hours, and estimated hours. A comprehensive tool designed to provide essential insights for accurate invoicing and financial planning.`,
          moduleName: 'reports.billing_configuration',
          showItem: false,
        },
      ],
    },
    {
      title: 'Time Management Insights',
      panelOpen: true,
      reports: [
        {
          title: 'Time Tracking Report',
          icon: 'assets/images/workreport.svg',
          url: '/reports/timing-reports',
          description:
            'This report meticulously captures and analyzes crucial aspects of time management, including login times, idle periods, and overall activity levels.Effortlessly monitor login and logout records to assess punctuality and evaluate time utilization.',
          moduleName: 'reports.timing_report',
          showItem: false,
        },
        {
          title: 'Attendance Insights',
          icon: 'assets/images/attendance.svg',
          url: '/reports/attendance',
          description:
            'It provides a detailed overview of the attendance records for each employee throughout the month. Easily track daily attendance, identify trends, and ensure accurate attendance management for better workforce planning.',
          moduleName: 'reports.attendance_report',
          showItem: false,
        },
      ],
    },
    {
      title: 'Leave Management Console',
      panelOpen: true,
      reports: [
        {
          title: 'Opening and Closing Balance Adjustment',
          icon: 'assets/images/leaves1.svg',
          url: '/reports/manual-update-leaves',
          description:
            'The module automates the calculation of leave adjustments, minimizing the risk of manual errors and providing HR teams with reliable data for payroll and compliance purposes.',
          moduleName: 'reports.leave_management',
          showItem: false,
        },

        {
          title: 'Employee Leave Balance Tracker',
          icon: 'assets/images/attendance.svg',
          url: '/reports/leave-master-data',
          description:
            'Easily view the current leave balances of all employees in a comprehensive and organized format. HR personnel can effortlessly update leave balances directly from this report.',
          moduleName: 'reports.leave_master_data',
          showItem: false,
        },
      ],
    },

    // {
    //   title: 'Task Reports',
    //   icon: 'assets/images/workreport.svg',
    //   url: '/reports/task-reports',
    //   description: 'An outline for tasks performed under a project over a timeline.',
    //   moduleName: 'reports.task_reports',
    //   showItem: false,
    // },
  ];
  //#endregion

  //#region For Component Structure Methods
  constructor(
    private router: Router,
    private storageService: StorageService,
    private loginService: LoginService,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission != null) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.boxData.forEach((section) => {
        section.reports.forEach((item: any) => {
          item.showItem = this.permissionService.getModuleActionPermission(permission, item.moduleName, 'view');
        });
      });

      this.boxData = this.boxData.filter((section) => section.reports.some((report: any) => report.showItem));
    } else {
      this.loginService.logout();
    }
  }
  //#endregion

  //#region For Member Functiom

  onClickBox(item: any) {
    if (item?.title == 'Activity Reports') {
      window.open(item?.url, '_blank');
    } else {
      this.router.navigate([item.url]);
    }
  }

  //#endregion
}
