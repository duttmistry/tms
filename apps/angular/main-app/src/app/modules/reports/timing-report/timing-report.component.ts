import { Component, OnInit } from '@angular/core';
import { ReportsService } from '../../../core/services/module/reports/reports.service';
// import { animate, state, style, transition, trigger } from '@angular/animations';
import { UserService } from '../../../core/services/module/users/users.service';
import { SiteSettingService } from '../../../core/services/common/site-setting.service';

import moment from 'moment';
import * as excelJS from 'exceljs';
import * as fs from 'file-saver';
@Component({
  selector: 'tms-workspace-timing-report',
  templateUrl: './timing-report.component.html',
  styleUrls: ['./timing-report.component.scss'],
})
export class TimingReportComponent implements OnInit {
  // moment().weekday(1).isBefore(moment()) ? moment().weekday(1) : moment().subtract(1, 'week').weekday(1),
  //   moment().weekday(1).isBefore(moment()) ? moment().subtract(1, 'days') : moment().subtract(1, 'week').weekday(5),

  headerRow = ['User', 'Date', 'Login Time', 'Logout Time', 'Breaks', 'Idle Time', 'Adjustment', 'Working Time', 'Deviation'];
  maxDate: any = moment().subtract(1, 'days').toDate().toISOString();
  ranges: any = {
    // Today: [moment(), moment()],
    Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'This Week': [moment().weekday(1), moment().weekday(1).isBefore(moment()) ? moment().subtract(1, 'day') : moment().weekday(1)],
    'Last Week': [moment().subtract(1, 'week').startOf('week').weekday(1), moment().weekday(0)],
    'Last 15 Days': [moment().subtract(14, 'days'), moment().subtract(1, 'days')],
    'Last 28 Days': [moment().subtract(27, 'days'), moment().subtract(1, 'days')],
    'Last 30 Days': [moment().subtract(29, 'days'), moment().subtract(1, 'days')],
    'Last 90 Days': [moment().subtract(89, 'days'), moment().subtract(1, 'days')],
  };
  filterOptions: any;
  showSpinner = true;
  allUsersList: any = [];
  allLeadUsersList: any = [];

  selectedUsers: any = [];
  selectedLeadUsers: any = [];
  timingHistoryData: any = [];

  filterByDate: any = {
    startDate: moment().subtract(1, 'week').startOf('week').weekday(1),
    endDate: moment().weekday(0),
  };

  constructor(private reportService: ReportsService, private userService: UserService, private siteSettingsService: SiteSettingService) {}
  ngOnInit(): void {
    this.filterOptions = {
      startDate: moment.isMoment(this.filterByDate.startDate)
        ? this.filterByDate.startDate.format('DD/MM/YYYY')
        : moment(this.filterByDate.startDate.$d).format('DD/MM/YYYY'),
      endDate: moment.isMoment(this.filterByDate.endDate)
        ? this.filterByDate.endDate.format('DD/MM/YYYY')
        : moment(this.filterByDate.endDate.$d).subtract(1, 'day').format('DD/MM/YYYY'),
      userIDs: JSON.stringify(this.selectedUsers),
    };
    this.getAllUsersList();
    this.getAllLeadUsersList();
    this.getModuleWiseSiteSettingsData();
  }

  // ApplyCustomDateFilter(id: number) {
  //   if (id == 1) {
  //     // select today date
  //     this.filterByDate.get('startDate')?.setValue(moment().format('YYYY-MM-DD'));
  //     this.filterByDate.get('endDate')?.setValue(moment().format('YYYY-MM-DD'));
  //   } else if (id == 2) {
  //     this.filterByDate.get('startDate')?.setValue(moment().subtract(1, 'day').format('YYYY-MM-DD'));
  //     this.filterByDate.get('endDate')?.setValue(moment().subtract(1, 'day').format('YYYY-MM-DD'));
  //   } else if (id == 3) {
  //     this.filterByDate.get('startDate')?.setValue(moment().startOf('week').format('YYYY-MM-DD'));
  //     this.filterByDate.get('endDate')?.setValue(moment().endOf('week').format('YYYY-MM-DD'));
  //   } else if (id == 4) {
  //     this.filterByDate.get('startDate')?.setValue(moment().subtract(1, 'week').startOf('week').format('YYYY-MM-DD'));
  //     this.filterByDate.get('endDate')?.setValue(moment().subtract(1, 'week').endOf('week').format('YYYY-MM-DD'));
  //   } else if (id == 5) {
  //     this.filterByDate.get('startDate')?.setValue(moment().subtract(7, 'day').format('YYYY-MM-DD'));
  //     this.filterByDate.get('endDate')?.setValue(moment().format('YYYY-MM-DD'));
  //   } else if (id == 6) {
  //     this.filterByDate.get('startDate')?.setValue(moment().subtract(28, 'day').format('YYYY-MM-DD'));
  //     this.filterByDate.get('endDate')?.setValue(moment().format('YYYY-MM-DD'));
  //   }

  //   this.onFilterByDate();
  // }

  showMore(user: any) {
    user.showMoreDetails = Boolean(!user.showMoreDetails);
  }
  getAllUsersList() {
    this.userService.getUserDropdown().subscribe(
      (response: any) => {
        if (response.data && response.data.length) {
          this.allUsersList = response.data.map((user: any) => ({
            id: user.id,
            name: user.first_name + ' ' + user.last_name,
            avatar: user.employee_image,
            designation: user.designation,
          }));
        }
      },
      (error) => {
        console.log('error', error);
      }
    );
  }
  getAllLeadUsersList() {
    this.userService.getAllLeadUsers().subscribe(
      (response: any) => {
        if (response.data && response.data.length) {
          this.allLeadUsersList = response.data.map((lead: any) => ({
            id: lead.id,
            name: lead.team_lead_names,
            reportTo: lead.report_to ? lead.report_to.map((id: any) => id) : [],
            // designation: user.designation,
          }));
        }
      },
      (error) => {
        console.log('error', error);
      }
    );
  }
  onFilterByDate(event?: any) {
    console.log('onFilterByDate', this.filterByDate.startDate, this.filterByDate.endDate);

    if (event instanceof PointerEvent) {
      event.stopPropagation();
    }

    if (this.filterByDate.startDate && this.filterByDate.endDate) {
      this.filterOptions = {
        ...this.filterOptions,
        startDate: moment.isMoment(this.filterByDate.startDate)
          ? this.filterByDate.startDate.format('DD/MM/YYYY')
          : moment(this.filterByDate.startDate.$d).format('DD/MM/YYYY'),
        endDate: moment.isMoment(this.filterByDate.endDate)
          ? this.filterByDate.endDate.format('DD/MM/YYYY')
          : moment(this.filterByDate.endDate.$d).subtract(1, 'day').format('DD/MM/YYYY'),
      };
      this.getTimmingReport();
    }
  }
  getSelectedUsersFromFilter(event: any) {
    this.selectedUsers = event ? event.map((user: any) => user.id) : [];
    let userIds = [...this.selectedUsers, ...this.selectedLeadUsers];
    userIds = [...new Set(userIds)];
    this.filterOptions = {
      ...this.filterOptions,
      userIDs: JSON.stringify(userIds),
    };

    this.getTimmingReport();
  }

  getSelectedLeadUsersFromFilter(event: any) {
    this.selectedLeadUsers = [];
    event
      ? event.forEach((user: any) => {
          this.selectedLeadUsers.push(...user.reportTo);
        })
      : [];

    let userIds = [...this.selectedUsers, ...this.selectedLeadUsers];
    userIds = [...new Set(userIds)];

    this.filterOptions = {
      ...this.filterOptions,
      userIDs: JSON.stringify(userIds),
    };

    this.getTimmingReport();
  }
  exportExcel() {
    const headers = ['Employee Name', 'Date', 'Login Time', 'Logout Time', 'Breaks', 'Idle Time', 'Adjustment', 'Working Time', 'Deviation'];

    const workbook = new excelJS.Workbook(); // Create a new workbook
    let date =
      (moment.isMoment(this.filterByDate.startDate)
        ? this.filterByDate.startDate.format('DD-MM-YYYY')
        : moment(this.filterByDate.startDate.$d).format('DD-MM-YYYY')) +
      'To' +
      (moment.isMoment(this.filterByDate.endDate)
        ? this.filterByDate.endDate.format('DD-MM-YYYY')
        : moment(this.filterByDate.endDate.$d).subtract(1, 'day').format('DD-MM-YYYY'));

    const worksheet = workbook.addWorksheet(`Timing Report ${date}`); // New Worksheet

    worksheet.mergeCells('A1:C1');
    worksheet.mergeCells('D1:H1');

    worksheet.addRow([]);
    const columnWidths = headers.map((header) => ({
      width: header.length + 7, // Add some extra space for padding
    }));
    worksheet.columns = columnWidths;
    const headerRow = worksheet.addRow(headers);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      // cell.alignment = { horizontal: 'center' };
    });
    worksheet.addRow([]);
    if (this.timingHistoryData) {
      this.timingHistoryData.forEach((user: any, index: any) => {
        let userAvgData = [
          user.first_name + ' ' + user.last_name,
          user.dateFromTo || '-',
          user.averageLoginTime || '-',
          user.averageLogoutTime || '-',
          user.averageBreakTimeCount,
          user.avgIdealTime || '-',
          user.avgAdjustmentHHMM || '-',
          user.avgWorkedTime || '-',
          user.avgDeviationHHMM || '-',
        ];
        // data.push(userAvgData);

        const userRow = worksheet.addRow(userAvgData);
        userRow.eachCell((cell, colNum) => {
          if (colNum == 3 && user.isLatelogin) {
            cell.font = {
              color: { argb: 'ea6060' },
              bold: true,
            };
          }
          if (colNum == 9 && user.avgDeviationHHMM && user.avgDeviationHHMM.includes('+')) {
            cell.font = { color: { argb: '5ead56' }, bold: true };
          }
          if (colNum == 7 && user.avgAdjustmentHHMM && user.avgAdjustmentHHMM.includes('+')) {
            cell.font = { color: { argb: '5ead56' }, bold: true };
          } else if (colNum == 7 && user.avgAdjustmentHHMM && user.avgAdjustmentHHMM.includes('-')) {
            cell.font = { color: { argb: 'ea6060' }, bold: true };
          } else {
            cell.font = {
              bold: true,
            };
          }
        });
        user.actions.forEach((day: any) => {
          let dayAvgData = [
            user.first_name + ' ' + user.last_name,
            day.dateFromTo || '-',
            day.loginTimeAMPM || '-',
            day.logoutTimeAMPM || '-',
            day.breakTimeCount,
            day.idealTimeHHMM || '-',
            day.adjustment || '-',
            day.workingTimeHHMM || '-',
            day.deviationHHMM || '-',
          ];
          const row = worksheet.addRow(dayAvgData);

          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'f0f8ff' },
          };

          row.eachCell((cell, colNum) => {
            if (colNum == 3 && day.isLatelogin) {
              cell.font = { color: { argb: 'ea6060' } };
            }
            if (colNum == 9 && day.deviationHHMM.includes('+')) {
              cell.font = { color: { argb: '5ead56' } };
            }
            if (colNum == 7 && day.adjustment && day.adjustment.includes('+')) {
              cell.font = { color: { argb: '5ead56' } };
            } else if (colNum == 7 && day.adjustment && day.adjustment.includes('-')) {
              cell.font = { color: { argb: 'ea6060' } };
            }
          });
        });
      });
    }

    worksheet.addRow([]);

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(
        blob,
        `Timing Report ${
          (moment.isMoment(this.filterByDate.startDate)
            ? this.filterByDate.startDate.format('DD/MM/YYYY')
            : moment(this.filterByDate.startDate.$d).format('DD/MM/YYYY')) +
          '-' +
          (moment.isMoment(this.filterByDate.endDate)
            ? this.filterByDate.endDate.format('DD/MM/YYYY')
            : moment(this.filterByDate.endDate.$d).subtract(1, 'day').format('DD/MM/YYYY'))
        }.xlsx`
      );
    });
  }
  lateArrivalThreshold: any;
  getModuleWiseSiteSettingsData() {
    this.showSpinner = true;

    this.siteSettingsService.getModuleWiseSiteSettingsData('timing_configuration').subscribe(
      (res: any) => {
        this.showSpinner = false;

        if (res.data) {
          let data = res.data.find((item: any) => item.identifier == 'late_arrival_hours');
          this.lateArrivalThreshold = data?.value || '10:30';
          this.getTimmingReport();
        }
      },
      (error) => {
        this.showSpinner = false;
      }
    );
  }

  getTimmingReport() {
    this.showSpinner = true;
    this.reportService.getTimingReport(this.filterOptions).subscribe(
      (response: any) => {
        if (response) {
          if (response.data && response.data.length > 0) {
            const groupedData: any = response?.data;

            groupedData.forEach((user: any) => {
              user.actions.forEach((day: any) => {
                day.dateFromTo = moment(day.date).format('DD/MM/YYYY');
                day.idealTimeHHMM = this.formatToHHMM(day.totalBreakTime);

                day.workingTimeHHMM = this.formatToHHMM(day.totalTimeSpent);
                day.adjustment = this.formatToHHMMAdjustment(day.adjustment);

                day.loginTimeAMPM = day.actions.find((action: any) => action.action == 'LOGIN')?.start_time;
                let hours = +moment(day.loginTimeAMPM, ['h:mm A']).format('HH');
                let minutes = +moment(day.loginTimeAMPM, ['h:mm A']).format('mm');
                if (day.loginTimeAMPM) {
                  day.isLatelogin = moment()
                    .add({ hours: hours, minutes: minutes })
                    .isAfter(moment().add({ hours: +this.lateArrivalThreshold.split(':')[0], minutes: +this.lateArrivalThreshold.split(':')[1] }));
                } else {
                  user.isLatelogin = false;
                }
                day.logoutTimeAMPM = day.actions.findLast((action: any) => action.action == 'LOGOUT')?.start_time;

                day.deviationHHMM = this.formatToHHMM(day.deviation);
              });

              user.dateFromTo =
                user.actions && user.actions.length > 0
                  ? moment(user.actions[0].date).format('DD/MM/YYYY') + '-' + moment(user.actions[user.actions.length - 1].date).format('DD/MM/YYYY')
                  : '-';
              user.avgIdealTime = this.formatToHHMM(user.averageBreakTimeSpent);

              user.avgWorkedTime = this.formatToHHMM(user.averageTimeSpent);

              if (user.averageLoginTime) {
                let hours = +moment(user.averageLoginTime, ['h:mm A']).format('HH');
                let minutes = +moment(user.averageLoginTime, ['h:mm A']).format('mm');
                user.isLatelogin = moment()
                  .add({ hours: hours, minutes: minutes })
                  .isAfter(moment().add({ hours: +this.lateArrivalThreshold.split(':')[0], minutes: +this.lateArrivalThreshold.split(':')[1] }));
              } else {
                user.isLatelogin = false;
              }
              user.avgAdjustmentHHMM = this.formatToHHMMAdjustment(user.averageAdjustMent);
              user.avgDeviationHHMM = this.formatToHHMM(user.averageDeviation);
            });

            this.timingHistoryData = groupedData;

            //console.log('timingHistoryData', this.timingHistoryData);

            //  Calculate the total worked time, ideal time, and expected time for each day
            // groupedData.forEach((user: any) => {
            //   user.actions.forEach((day: any) => {
            //     // Initialize totalWorkedTime, idealTime, and expectedTime for the day
            //     day.workingTime = 0;
            //     day.idealTime = 0;
            //     day.expectedTime = 8 * 60 + 30; // 8 hours and 30 minutes in minutes
            //     let loginEntry = day.actions.find((action: any) => action.action == 'LOGIN');
            //     day.loginTime = loginEntry?.action_start_date;
            //     day.loginTimeAM = moment(loginEntry?.action_start_date).format('hh:mm A');
            //     let logoutEntry = day.actions.findLast((action: any) => action.action == 'LOGOUT');
            //     day.logoutTime = logoutEntry?.action_start_date;
            //     day.logoutTimeAM = moment(logoutEntry?.action_start_date).format('hh:mm A');

            //     day.breaks = day.actions.filter((action: any) => action.action == 'BREAK_TIME').length;

            //     // Iterate through actions for the day
            //     day.actions.forEach((action: any) => {
            //       // Check if the action type is one you want to track (LOGIN, LOGOUT, BACK FROM BREAK, BREAK_TIME)
            //       if (['LOGIN', 'LOGOUT', 'BACK FROM BREAK'].includes(action.action)) {
            //         // Add the time spent on these actions to the totalWorkedTime for the day
            //         day.workingTime += action.timeSpent;
            //       } else if (action.action === 'BREAK_TIME') {
            //         // Add the time spent on "BREAK_TIME" to the idealTime for the day
            //         day.idealTime += action.timeSpent;
            //       }
            //     });

            //     day.idealTimeHHMM = Math.floor(day.idealTime / 60) + ':' + (day.idealTime % 60);
            //     day.workingTimeHHMM = Math.floor(day.workingTime / 60) + ':' + (day.workingTime % 60);
            //   });
            //   // Calculate User average Login time

            //   user.avgLoginTime = 0;
            //   user.avgLogoutTime = 0;
            //   user.avgBreaks = 0;
            //   // Calculate user-wise total worked time, ideal time, and set expected time
            //   user.totalWorkedTime = 0;
            //   user.totalIdealTime = 0;
            //   // user.expectedTime = user.actions.length * (8 * 60 + 30); // Total expected time for all days

            //   user.actions.forEach((day: any) => {
            //     user.totalWorkedTime += day.workingTime;
            //     user.totalIdealTime += day.idealTime;
            //     let loginTime = moment(day.loginTime, 'HH:mm');
            //     user.avgLoginTime += loginTime.hour() * 60 + loginTime.minute();
            //     let logoutTime = moment(day.logoutTime, 'HH:mm');
            //     user.logoutTime += logoutTime.hour() * 60 + logoutTime.minute();

            //     user.avgBreaks += day.breaks || 0;
            //   });
            //   // calculate date from - to
            //   user.dateFromTo =
            //     moment(user.actions[0].date).format('DD MMM YY') + '-' + moment(user.actions[user.actions.length - 1].date).format('DD MMM YY');

            //   //Calculate average Breaks

            //   user.avgBreaks = Math.round(user.avgBreaks / user.actions.length);

            //   // Calculate average worked time by dividing total worked time by the number of days
            //   let avgWorkedTime = Math.round(user.totalWorkedTime / user.actions.length);
            //   user.avgWorkedTime = Math.floor(avgWorkedTime / 60) + ':' + (avgWorkedTime % 60);

            //   // Calculate average ideal time by dividing total ideal time by the number of days
            //   let avgIdealTime = Math.round(user.totalIdealTime / user.actions.length);
            //   user.avgIdealTime = Math.floor(avgIdealTime / 60) + ':' + (avgIdealTime % 60);

            //   //Calculate average login time
            //   let avgLoginTime = user.avgLoginTime / user.actions.length;
            //   let hours = Math.floor(avgLoginTime / 60);
            //   let minutes = avgLoginTime % 60;
            //   user.avgLoginTime = moment({ hours, minutes }).format('hh:mm A');

            //   //Calculate average logout time
            //   let avgLogoutTime = user.avgLogoutTime / user.actions.length;
            //   let hours1 = Math.floor(avgLogoutTime / 60);
            //   let minutes1 = avgLogoutTime % 60;
            //   user.avgLogoutTime = moment({ hours: hours1, minutes: minutes1 }).format('hh:mm A');
            // });
          } else {
            this.timingHistoryData = [];
          }
        } else {
          this.timingHistoryData = [];
        }

        this.showSpinner = false;
      },
      (error: any) => {
        this.showSpinner = false;
        this.timingHistoryData = [];
      }
    );
  }

  formatToHHMM(minites: number) {
    if (minites >= 0) {
      let hour = Math.floor(minites / 60);
      let minite = minites % 60;
      return (hour < 10 ? '0' + hour : hour) + ':' + (minite < 10 ? '0' + minite : minite);
    } else {
      minites = Math.abs(minites);
      let hour = Math.floor(minites / 60);
      let minite = minites % 60;
      return '+' + ((hour < 10 ? '0' + hour : hour) + ':' + (minite < 10 ? '0' + minite : minite));
    }
  }

  formatToHHMMAdjustment(minites: number) {
    if (minites > 0) {
      let hour = Math.floor(minites / 60);
      let minite = minites % 60;
      return '+' + ((hour < 10 ? '0' + hour : hour) + ':' + (minite < 10 ? '0' + minite : minite));
    } else if (minites < 0) {
      minites = Math.abs(minites);
      let hour = Math.floor(minites / 60);
      let minite = minites % 60;
      return '-' + ((hour < 10 ? '0' + hour : hour) + ':' + (minite < 10 ? '0' + minite : minite));
    } else {
      let hour = Math.floor(minites / 60);
      let minite = minites % 60;
      return (hour < 10 ? '0' + hour : hour) + ':' + (minite < 10 ? '0' + minite : minite);
    }
  }
}
