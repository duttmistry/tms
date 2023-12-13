import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { UserService } from '../../../core/services/module/users/users.service';
import { map, startWith } from 'rxjs';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { environment } from 'apps/angular/main-app/src/environments/environment';
import { AttendanceService } from '../../../core/services/module/attendance/attendance.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import * as excelJS from 'exceljs';
import * as fs from 'file-saver';
interface IUsersData {
  id: number;
  name: string;
  avatar: string;
  designation: string;
}

@Component({
  selector: 'main-app-attendances',
  templateUrl: './attendances.component.html',
  styleUrls: ['./attendances.component.scss'],
})
export class AttendancesComponent implements OnInit {
  yearControl = new FormControl(moment().year());
  monthControl = new FormControl(moment().month());

  monthList = moment.months().map((month, index) => {
    return {
      index: index,
      name: month,
    };
  });
  month!: number;
  year!: number;
  yearList: number[] = [];
  tableDayHeader: any = [];

  attendanceReportData: any;

  loggedInUserId: number;
  allUsersList: IUsersData[] = [];
  selectedUsers: IUsersData[] = [];
  userSearchInputCtrl = new FormControl('');
  filteredUsersList$: any;
  @ViewChild('userSearchInput') userSearchInput!: ElementRef<HTMLInputElement>;
  _base_url = environment.base_url;
  showSpinner = true;
  constructor(
    private router: Router,
    private spinnerService: SpinnerService,
    private attendanceService: AttendanceService,
    private userService: UserService
  ) {
    this.loggedInUserId = this.userService.getLoggedInUserId();

    this.setYearList();
    this.setTableDayHeader();
  }
  ngOnInit() {
    this.getUsersList();
    this.getAttendanceReport();
  }
  setTableDayHeader() {
    this.tableDayHeader = [];
    let array = Array.from(Array(31), (x, i) => i + 1);
    array.forEach((day) => {
      let year = this.yearControl.value?.toString();
      let month =
        (((this.monthControl.value as number) + 1)?.toString() as string).length == 1
          ? '0' + ((this.monthControl.value as number) + 1)
          : (this.monthControl.value as number) + 1;
      let d = day.toString().length == 1 ? '0' + day : day;
      let date = new Date(year + '-' + month + '-' + d);
      let w_day = new Date(date).getDay();

      if (w_day !== null && (w_day == 0 || w_day == 6)) {
        this.tableDayHeader.push({
          day: day,
          isWeekOff: true,
        });
      } else {
        this.tableDayHeader.push({
          day: day,
          isWeekOff: false,
        });
      }
    });
  }
  onPrevMonth() {
    let prev_month = moment()
      .year(this.yearControl.value as number)
      .month(this.monthControl.value as number)
      .subtract(1, 'month');
    if (prev_month.year() < 2000) {
      return;
    }
    this.monthControl.setValue(prev_month.month());
    this.yearControl.setValue(prev_month.year());
    this.setTableDayHeader();
    this.getAttendanceReport();
  }

  onNextMonth() {
    let next_month = moment()
      .year(this.yearControl.value as number)
      .month(this.monthControl.value as number)
      .add(1, 'month');
    if (next_month.year() > moment().year()) {
      return;
    }
    this.monthControl.setValue(next_month.month());
    this.yearControl.setValue(next_month.year());
    this.setTableDayHeader();
    this.getAttendanceReport();
  }

  clearAllUsers() {
    this.selectedUsers = [];
  }

  getAttendanceReport() {
    this.showSpinner = true;
    // let min_month = Math.min(...this.monthControl.value);
    // let max_month = Math.max(...this.monthControl.value);
    this.month = this.monthControl.value as number;
    this.year = this.yearControl.value as number;
    let fromDate = moment()
      .year(this.yearControl.value as number)
      .month(this.month)
      .date(1)
      .startOf('month')
      .format('YYYY-MM-DD');
    let toDate = moment()
      .year(this.yearControl.value as number)
      .month(this.month)
      .date(1)
      .endOf('month')
      .format('YYYY-MM-DD');
    let ids = this.selectedUsers.map((user) => user.id);
    const body = {
      userId: ids.length ? ids : null,
      year: this.yearControl.value,
      month: '',
      fromDate: fromDate,
      toDate: toDate,
    };
    this.spinnerService.showSpinner();
    this.attendanceService.getAttendanceReportData(body).subscribe(
      (res: any) => {
        this.spinnerService.hideSpinner();
        if (res.data && res.data.length == 0) {
          return;
        }

        this.attendanceReportData = res.data;
        // Sort the attendanceReportData array in ascending order based on the 'name' property
        this.attendanceReportData.sort((a: any, b: any) => {
          const nameA = a?.first_name?.toLowerCase();
          const nameB = b?.first_name?.toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
        this.attendanceReportData.forEach((attendanceReport: any, index: number) => {
          let attendance: any = [];
          // this.attendanceReportData[index].attendance = [];
          // selectedMonths.forEach((month: any) => {
          // this.selectedMonth.push(moment(month, 'M').format('MMMM'));
          let arr = attendanceReport.attendance;
          // .filter((day: any) => {
          //   let a_month = +day.month;
          //   console.log(a_month, month);

          //   return a_month == month;
          // });

          if (arr.length < 31) {
            for (let i = 0; i < 31 - arr.length; i++) {
              arr.push({
                date: '2023-06-30',
                day_id: 8,
                day_type: '-',
                month: '06',
                year: '2023',
              });
            }
          }

          // <!-- 1 > H - Holiday
          // *  2 > WO - Week Off
          // *  3 > P - Present
          // *  4 > FH - Half Day (First Half)
          // *  5 > SH - Half Day (Second Half)
          // *  6 > FD - Unplanned Leave
          // *  7 > FD - Leave
          // *  8 > -
          // *  9 > Absence -->
          const workingDaysCount = arr.filter((obj: any) => obj.day_id !== 1 && obj.day_id !== 2).length;
          const holidayWeekoffCount = arr.filter((obj: any) => obj.day_id == 1 || obj.day_id == 2).length;

          const fulldayLeaves = arr.filter((obj: any) => obj.day_id == 6 || obj.day_id == 7).length;

          const halfdayLeaves = arr.filter((obj: any) => obj.day_id == 4 || obj.day_id == 5).length;
          const fulldayAttendance = arr.filter((obj: any) => obj.day_id === 3).length;
          const attendedCount = fulldayAttendance + halfdayLeaves / 2;
          const leavesCount = fulldayLeaves + halfdayLeaves / 2;

          attendance.push({
            attendance: arr,
            isShowDetails: false,
            // month: moment(month, 'M').format('MMMM'),
            attendedCount,
            leavesCount,
            attendancePercentage: Math.floor((attendedCount * 100) / workingDaysCount),
            holidayWeekoffCount,
          });
          // });

          this.attendanceReportData[index].attendance = attendance;
        });

        // this.attendanceReportData[0].attendance.forEach((item: any) => {
        //   console.log(item, item.date.split('-')[2]);

        //   this.tableDayHeader.push(item.date.split('-')[2]);
        // });
        this.showSpinner = false;
      },
      (error) => {
        this.spinnerService.hideSpinner();
        this.showSpinner = false;
      }
    );
  }

  toggleShowDetails(i1: number, i2: number) {
    this.attendanceReportData[i1].attendance[i2].isShowDetails = !this.attendanceReportData[i1].attendance[i2].isShowDetails;
  }

  redirectToAdministration() {
    this.router.navigate(['reports']);
  }

  setYearList() {
    let startYear = 2000;
    for (let year = startYear; year <= moment().year(); year++) {
      this.yearList.push(year);
    }
  }

  getUsersList() {
    this.userService.getAllUsers().subscribe(
      (response: any) => {
        if (response.data && response.data.list && response.data.list.length) {
          this.allUsersList = response.data.list.map((user: any) => ({
            id: user.id,
            name: user.first_name + ' ' + user.last_name,
            avatar: user.employee_image,
            designation: user.designation,
          }));
        }

        this.filteredUsersList$ = this.userSearchInputCtrl.valueChanges.pipe(
          startWith(null),
          map((item: string | null) => {
            return item ? this._filterUsers(item) : this.allUsersList.slice();
          })
        );
      },
      (error) => {
        console.log('error', error);
      }
    );
  }

  checkSelectedItem(item: IUsersData) {
    return this.selectedUsers.find((res: any) => res.id == item.id) ? true : false;
  }

  private _filterUsers(value: any): any {
    if (!value?.id) {
      const filterValue = value?.toLowerCase();

      return this.allUsersList.filter((item: any) => item.name?.toLowerCase().indexOf(filterValue) >= 0);
    }
  }

  selected(value: IUsersData): void {
    const newValue = value;

    if (this.selectedUsers.find((user: any) => user.id == newValue.id)) {
      this.selectedUsers = [...this.selectedUsers.filter((user: any) => user.id !== newValue.id)];
    } else {
      this.selectedUsers.push(newValue);
    }

    this.userSearchInput.nativeElement.value = '';
    this.userSearchInputCtrl.setValue(null);
  }

  openAuto(trigger: MatAutocompleteTrigger) {
    trigger.openPanel();
    this.userSearchInput.nativeElement.focus();
  }

  onClickGenerateReport() {
    this.setTableDayHeader();
    this.getAttendanceReport();
  }

  exportExcel() {
    let header = this.tableDayHeader.map((item: any) => item.day);
    const headers = ['Employee Name', ...header, 'Attended', 'Leaves', 'Holiday/Week off', 'Attendance(%)'];

    const workbook = new excelJS.Workbook(); // Create a new workbook
    const worksheet = workbook.addWorksheet(
      `Attendance Sheet ${
        moment()
          .month(this.monthControl.value as number)
          .format('MMMM') +
        ' ' +
        this.yearControl.value
      }`
    ); // New Worksheet
    worksheet.mergeCells('A1:C1');
    worksheet.mergeCells('D1:H1');
    // const columnWidths = headers.map((header) => ({
    //   width: header.length + 15, // Add some extra space for padding
    // }));
    // worksheet.columns = columnWidths;

    const status = [
      `Attendance Sheet ${
        moment()
          .month(this.monthControl.value as number)
          .format('MMMM') +
        ' ' +
        this.yearControl.value
      }`,
      'Present (P)',
      'Leave L (FH | SH | FD)',
      'Holiday (H)',
      'Week Off (WO)',
      'Absent (A)',
    ];
    const monthStatusRow = worksheet.addRow(status);

    monthStatusRow.eachCell((cell) => {
      cell.font = { bold: true };
    });

    worksheet.addRow([]);
    const headerRow = worksheet.addRow(headers);
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'efefef' },
    };
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' };
    });

    // const data: any = [];
    if (this.attendanceReportData) {
      this.attendanceReportData.forEach((attendanceReport: any, index: any) => {
        attendanceReport.attendance.forEach((attendance: any) => {
          let ar = attendance.attendance.map((day: any) => day.day_type);
          if (ar.length < 31) {
            for (let i = 0; i < 31 - ar.length; i++) {
              ar.push('-');
            }
          }
          const row = worksheet.addRow([
            attendanceReport.first_name + ' ' + attendanceReport.last_name, //A

            ...ar,
            attendance.attendedCount,
            attendance.leavesCount,
            attendance.holidayWeekoffCount,
            attendance.attendancePercentage,
          ]);

          row.eachCell((cell) => {
            if (cell.text == 'H') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'cdecfa' },
              };
            } else if (cell.text == 'WO') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'e5e5e5' },
              };
            } else if (cell.text == 'P') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'DFEFDD' },
              };
            } else if (cell.text == 'FD' || cell.text == 'FH' || cell.text == 'SH') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'ffdede' },
              };
              // console.log('cell', cell.col, attendance.attendance);
              let data = attendance.attendance.find((day: any) => +day.date.split('-')[2] == ((cell.col as any)-1 ));
              // console.log('data', data.leave_subject);
              cell.note = data.leave_subject;
            } else if (cell.text == 'A') {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'ffdcc3' },
              };
            }

            cell.alignment = { horizontal: 'center' };
          });
        });
      });
    }
    // const addedRows = worksheet.addRows(data);
    // <!-- 1 > H - Holiday
    // *  2 > WO - Week Off
    // *  3 > P - Present
    // *  4 > FH - Half Day (First Half)
    // *  5 > SH - Half Day (Second Half)
    // *  6 > FD - Unplanned Leave
    // *  7 > FD - Leave
    // *  8 > -
    // *  9 > Absence -->
    worksheet.addRow([]);
    // const footerRow = worksheet.addRow([
    //   'All Employee',
    //   { formula: `SUM(B${4}:B${worksheet.rowCount})`, result: 0 },
    //   { formula: `SUM(C${4}:C${worksheet.rowCount})`, result: 0 },
    //   { formula: `SUM(D${4}:D${worksheet.rowCount})`, result: 0 },
    //   { formula: `SUM(E${4}:E${worksheet.rowCount})`, result: 0 },
    //   { formula: `SUM(F${4}:F${worksheet.rowCount})`, result: 0 },
    //   { formula: `SUM(G${4}:G${worksheet.rowCount})`, result: 0 },
    //   '-', //Added CL
    //   '-', // Added Pl
    //   { formula: `SUM(J${4}:J${worksheet.rowCount})`, result: 0 },
    //   '-', // Adjusted LWP
    //   { formula: `SUM(L${4}:L${worksheet.rowCount})`, result: 0 },
    //   { formula: `SUM(M${4}:M${worksheet.rowCount})`, result: 0 },
    //   { formula: `SUM(N${4}:N${worksheet.rowCount})`, result: 0 },
    //   '-', // Commnets
    //   { formula: `SUM(P${4}:P${worksheet.rowCount})`, result: 0 },
    // ]);
    // footerRow.getCell(1).font = { bold: true };

    //Generate Excel File with given name
    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(
        blob,
        `attendance_${
          moment()
            .month(this.monthControl.value as number)
            .format('MMMM')
            .toLocaleLowerCase() +
          '_' +
          this.yearControl.value
        }.xlsx`
      );
    });
  }
}
