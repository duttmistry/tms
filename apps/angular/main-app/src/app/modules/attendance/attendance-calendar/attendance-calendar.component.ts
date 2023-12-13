import { Component, AfterViewInit, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DateRange, MatCalendarCellCssClasses } from '@angular/material/datepicker';
import moment, { min } from 'moment';
import { CalendarOptions, EventApi, DateSelectArg, ClassNamesGenerator } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { HolidayService } from '../../../core/services/module/holiday/holiday.service';
import { AttendanceService } from '../../../core/services/module/attendance/attendance.service';
import { UserService } from '../../../core/services/module/users/users.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
  selector: 'attendance-calendar',
  templateUrl: './attendance-calendar.component.html',
  styleUrls: ['./attendance-calendar.component.scss'],
  // encapsulation: ViewEncapsulation.None,
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceCalendarComponent implements OnInit, OnDestroy, AfterViewInit {
  calendarOptions!: CalendarOptions;
  @ViewChild('Calendar')
  Calendar!: FullCalendarComponent;
  eventList: any = [];
  userId!: number;
  holidayList!: any;
  specialDayList: any;
  currentYear = moment().year();
  currentMonth = +moment().format('M');
  currentMonthAndYear: any;
  minDate = new Date('2000-01-01');
  attendedCounts!: number;
  leavesCounts!: number;
  clickCount = 1;
  attendancePercentage!: number;
  sortBy = 'eventDate';
  orderBy = 'asc';
  showAllHoliday = false;
  showAllSpecialDay = false;
  showSpinner = true;
  showSpinnerSpecialDays = true;
  showSpinnerHolidays = true;
  constructor(
    private holidayService: HolidayService,
    private spinnerService: SpinnerService,
    private attendanceService: AttendanceService,
    private userService: UserService
  ) {
    this.userId = this.userService.getLoggedInUserId();
  }
  ngOnDestroy(): void {}

  ngOnInit(): void {
    this.initializeAttendanceCalendar();
  }

  ngAfterViewInit(): void {
    this.getAttendanceData();
    this.getHolidayList(0);
  }

  getAttendanceData() {
    const startDate = this.Calendar.getApi().view.currentStart.toISOString().split('T')[0];
    const endDate = this.Calendar.getApi().view.currentEnd.toISOString().split('T')[0];
    this.showSpinner = true;
    this.spinnerService.showSpinner();
    this.attendanceService
      .getAttendanceReportData({
        userId: [this.userId],
        month: '',
        year: '',
        fromDate: startDate,
        toDate: moment(endDate).subtract(1, 'day').format('YYYY-MM-DD'),
      })

      .subscribe(
        (res: any) => {
          this.spinnerService.hideSpinner();
          this.eventList = res.data[0].attendance.map((item: any) => ({
            ...item,
            showTooltip: false,
          }));
          // <!-- 1 > H - Holiday
          // *  2 > WO - Week Off
          // *  3 > P - Present
          // *  4 > HD-F - Half Day (First Half)
          // *  5 > HD-S - Half Day (Second Half)
          // *  6 > UPL - Unplanned Leave
          // *  7 > L - Leave
          // *  8 > -
          // *  9 > Absence -->

          const workingDays = this.eventList.filter((obj: any) => obj.day_id !== 1 && obj.day_id !== 2).length;

          const fulldayLeaves = this.eventList.filter((obj: any) => obj.day_id == 6 || obj.day_id == 7).length;
          const halfdayLeaves = this.eventList.filter((obj: any) => obj.day_id == 4 || obj.day_id == 5).length;
          const fulldayAttendance = this.eventList.filter((obj: any) => obj.day_id === 3).length;
          this.attendedCounts = fulldayAttendance + halfdayLeaves / 2;

          this.leavesCounts = fulldayLeaves + halfdayLeaves / 2;
          this.attendancePercentage = Math.floor((this.attendedCounts * 100) / workingDays);
          this.initializeAttendanceCalendar();
          this.showSpinner = false;
        },
        (error) => {
          this.spinnerService.hideSpinner();
          this.showSpinner = false;
        }
      );
  }

  // getHolidayList(arg: any) {
  //   switch (arg) {
  //     case 1:
  //       this.showAllHoliday = !this.showAllHoliday;
  //       break;
  //     case 2:
  //       this.showAllSpecialDay = !this.showAllSpecialDay;
  //       break;

  //     default:
  //       this.showAllHoliday = false;
  //       this.showAllSpecialDay = false;
  //   }
  //   const startDate = this.Calendar.getApi().view.currentStart.toISOString().split('T')[0];
  //   const endDate = this.Calendar.getApi().view.currentEnd.toISOString().split('T')[0];

  //   const params = {
  //     sortBy: this.sortBy,
  //     orderBy: this.orderBy,
  //     year: moment(startDate).year(),
  //     month: arg == 0 ? +moment(startDate).format('M') : '',
  //   };
  //   this.holidayService.getAllHoliday(params).subscribe((response: any) => {
  //     if (response && response.length == 0) {
  //       this.holidayList = [];
  //       this.specialDayList = [];
  //     } else {
  //       if (arg == 0 || this.showAllHoliday) {
  //         this.holidayList = response?.list
  //           .filter((elm: any) => parseInt(elm.isHoliday) === 1)
  //           .map((holiday: any) => ({
  //             holidayName: holiday.title,
  //             isHoliday: parseInt(holiday.isHoliday),
  //             holidayDate: moment(holiday.eventDate).format('DD/MM/YYYY'),
  //             day: moment(holiday.eventDate).format('dddd'),
  //             month: moment(holiday.eventDate).format('MMMM'),
  //           }));
  //         console.log('holidayList', this.holidayList);
  //       }
  //       if (arg == 0 || this.showAllSpecialDay) {
  //         this.specialDayList = response?.list
  //           .filter((elm: any) => parseInt(elm.isHoliday) !== 1)
  //           .map((m: any) => ({
  //             holidayName: m.title,
  //             isHoliday: parseInt(m.isHoliday),
  //             holidayDate: moment(m.eventDate).format('DD/MM/YYYY'),
  //             day: moment(m.eventDate).format('dddd'),
  //             month: moment(m.eventDate).format('MMMM'),
  //           }));
  //       }
  //     }
  //   });
  // }

  getHolidayList(holidayType: any) {
    // debugger
    switch (holidayType) {
      case 1:
        this.showAllHoliday = true;
        this.holidayList = [];
        this.showSpinnerHolidays = true;
        // this.showAllHoliday = !this.showAllHoliday;
        // holidayType = !this.showAllHoliday ? 0 : 1;
        break;
      case 2:
        this.showAllSpecialDay = true;
        this.specialDayList = [];
        this.showSpinnerSpecialDays = true;
        // this.showAllSpecialDay = !this.showAllSpecialDay;
        // holidayType = !this.showAllSpecialDay ? 0 : 2;
        break;
      case 3:
        this.showAllHoliday = false;
        this.holidayList = [];
        this.showSpinnerHolidays = true;
        break;
      case 4:
        this.specialDayList = [];
        this.showAllSpecialDay = false;
        this.showSpinnerSpecialDays = true;
        break;

      default:
        this.specialDayList = [];
        this.holidayList = [];
        this.showSpinnerSpecialDays = true;
        this.showSpinnerHolidays = true;
    }
    const startDate = this.Calendar.getApi().view.currentStart.toISOString().split('T')[0];
    const endDate = this.Calendar.getApi().view.currentEnd.toISOString().split('T')[0];

    let requestBody: any = {};
    if (holidayType === 3 || holidayType === 4) {
      requestBody = {
        sortBy: this.sortBy,
        orderBy: this.orderBy,
        year: this.currentYear,
        month:
          holidayType == 3 && this.showAllHoliday == false
            ? +moment(this.currentMonthAndYear).format('M')
            : holidayType == 4 && this.showAllSpecialDay == false
            ? +moment(this.currentMonthAndYear).format('M')
            : '',
      };
    } else {
      requestBody = {
        sortBy: this.sortBy,
        orderBy: this.orderBy,
        year: this.currentYear,
        month: holidayType == 0 ? +moment(this.currentMonthAndYear).format('M') : '',
      };
    }
    this.holidayService.getAllHoliday(requestBody).subscribe(
      (response: any) => {
        if (!response || !response.list) {
          this.holidayList = [];
          this.specialDayList = [];
          this.showSpinnerHolidays = false;
          this.showSpinnerSpecialDays = false;
          return;
        }

        // const eventArray = response.list.map((m: any) => ({
        //   start: m.eventDate ? moment(m.eventDate).format('YYYY-MM-DD') : '',
        //   end: '',
        //   title: m.title || '',
        //   groupId: '',
        //   url: '',
        //   isHoliday: m.isHoliday,
        //   sameStartDateCount :''
        // }));
        // this.events = response.list;
        const eventArray = response.list.reduce((accumulator: any, currentEvent: any) => {
          const existingEvent = accumulator.find((event: any) => event.start === currentEvent.eventDate);

          if (existingEvent) {
            existingEvent.sameStartDateCount++;
          } else {
            accumulator.push({
              start: moment(currentEvent.eventDate).format('YYYY-MM-DD'),
              end: '',
              title: currentEvent.title || '',
              groupId: '',
              url: '',
              isHoliday: currentEvent.isHoliday,
              sameStartDateCount: 1,
            });
          }

          return accumulator;
        }, []);
        // console.log('this.events: ', this.events);
        if ((holidayType === 1 && this.showAllHoliday == true) || (holidayType === 3 && this.showAllHoliday == false)) {
          this.showSpinnerHolidays = false;
          this.holidayList = this.filterAndMapHolidays(response.list, 1);
        }
        if ((holidayType === 4 && this.showAllSpecialDay == false) || (holidayType === 2 && this.showAllSpecialDay == true)) {
          this.showSpinnerSpecialDays = false;
          this.specialDayList = this.filterAndMapHolidays(response.list, 2);
        }

        if (holidayType === 0 && this.showAllHoliday == false) {
          this.showSpinnerHolidays = false;
          this.holidayList = this.filterAndMapHolidays(response.list, 1);
        }

        if (holidayType === 0 && this.showAllSpecialDay == false) {
          this.showSpinnerSpecialDays = false;
          this.specialDayList = this.filterAndMapHolidays(response.list, 2);
        }
      },
      (error: any) => {
        this.showSpinnerHolidays = false;
        this.showSpinnerSpecialDays = false;
        this.spinnerService.hideSpinner();
      }
    );
  }
  filterAndMapHolidays(list: any[], holidayType: any): any[] {
    return list
      .filter((elm: any) => (holidayType == 1 ? parseInt(elm.isHoliday) === 1 : parseInt(elm.isHoliday) !== 1))
      .map((holiday: any) => ({
        holidayName: holiday.title,
        isHoliday: parseInt(holiday.isHoliday),
        holidayDate: holiday.eventDate ? this.momentFormatDate(holiday.eventDate, 'DD/MM/YYYY') : '',
        day: this.momentFormatDate(holiday.eventDate, 'dddd').slice(0, 3),
        month: this.momentFormatDate(holiday.eventDate, 'MMMM'),
      }));
  }

  momentFormatDate(date: any, formatString: any) {
    return moment(date).format(formatString);
  }
  initializeAttendanceCalendar() {
    // console.log('initializeAttendanceCalendar');

    this.calendarOptions = {
      initialView: 'dayGridMonth',
      plugins: [dayGridPlugin, interactionPlugin],
      initialDate: new Date(), // start display month from the date
      weekends: true, // false to show only weekdays
      firstDay: 1,
      timeZone: 'UTC',
      showNonCurrentDates: true,
      fixedWeekCount: false,
      contentHeight: 'auto', // Set a fixed height for the calendar
      headerToolbar: {
        left: 'prev',
        center: 'title',
        right: 'next todayButton',
      },
      // NOTE :-  Restrict to the current year plus one year
      validRange: {
        start: this.minDate,
        end: '',
      },
      events: [],

      // eventContent: this.renderEventContent,
      // datesSet: (event: any) => {
      //   console.log('date set function', event);

      //   this.getAttendanceData(event.startStr.split('T')[0], event.endStr.split('T')[0]);
      // },
      customButtons: {
        todayButton: {
          text: 'Today',
          click: () => {
            // Handle the custom button click event
            this.Calendar.getApi().today();
            this.currentMonthAndYear = moment(new Date()).format('YYYY-MM');
            this.currentYear = moment(this.currentMonthAndYear).year();
            this.getAttendanceData();
            this.showAllHoliday = false;
            this.showAllSpecialDay = false;
            this.getHolidayList(0);
          },
        },
        next: {
          click: (data: any) => {
            // console.log('next', data);
            this.Calendar.getApi().next();
            this.currentMonthAndYear = this.Calendar.getApi().view.currentStart.toISOString().split('T')[0];
            this.currentYear = moment(this.currentMonthAndYear).year();
            this.showAllHoliday = false;
            this.showAllSpecialDay = false;
            this.getAttendanceData();
            this.getHolidayList(0);
          },
        },

        prev: {
          click: (data: any) => {
            // console.log('next', data);
            this.Calendar.getApi().prev();
            this.currentMonthAndYear = this.Calendar.getApi().view.currentStart.toISOString().split('T')[0];
            this.currentYear = moment(this.currentMonthAndYear).year();
            this.showAllHoliday = false;
            this.showAllSpecialDay = false;
            this.getAttendanceData();
            this.getHolidayList(0);
          },
        },
      },
      dateClick: this.dayClick.bind(this),
      // selectable: true,
      // select: this.handleDateSelect.bind(this),
      dayCellContent: this.modifyDayCellContent.bind(this),
      dayCellClassNames: this.modifyDayCellClassNames.bind(this),

      // dayCellDidMount: this.modifyDayCellDidMount.bind(this),
    };
  }
  getMonthAndYear(isYear?: any) {
    if (isYear) {
      return '(' + moment(this.currentMonthAndYear).format('YYYY') + ')' || '(' + moment(this.currentMonth).format('YYYY') + ')';
    }
    return '(' + moment(this.currentMonthAndYear).format('MMMM YYYY') + ')' || '(' + moment(this.currentMonth).format('MMMM YYYY') + ')';
  }
  /**
   * render custom element on event binding
   * added title attribute on hover show event title
   * @param eventInfo
   * @param createElement
   * @returns
   */
  // renderEventContent(eventInfo: any, createElement: any): any {
  //   if (eventInfo.event._def.extendedProps) {
  //     const isHoliday = eventInfo.event._def.title;
  //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //     return (createElement = {
  //       html: `
  //       <div class=${isHoliday ? 'event-day' : ''} title="${eventInfo.event._def.title}">
  //         <p class="event-title">${eventInfo.event._def.title}</p>
  //       </div>
  //       `,
  //     });
  //   }
  // }

  // handleDateSelect(arg: DateSelectArg) {
  //   const { start, end } = arg;
  //   this.selectedDateRange.start = start;
  //   this.selectedDateRange.end = end;
  // }

  /**
   *
   * heigh light range of to and from date
   */
  // modifyDayCellDidMount(arg?: any) {
  //   const date = arg.date;
  //   console.log('did mount', arg);
  // new Tooltip(arg.el, {
  //   title: arg.event.extendedProps.description,
  //   placement: 'top',
  //   trigger: 'hover',
  //   container: 'body',
  // });
  // if (this.selectedDateRange.start && this.selectedDateRange.end && date >= this.selectedDateRange.start && date < this.selectedDateRange.end) {
  //   const cellEl = arg.el;
  //   cellEl.classList.add('selected-range');
  // }
  // }

  dayClick(arg: any) {
    const event = this.eventList.find((event: any) => (arg.date as Date).toISOString().split('T')[0] === event.date);
    if (this.clickCount == 1) {
      document.querySelector('body')?.addEventListener('click', function (event: any) {
        if (arg.dayEl.firstChild !== event.target) {
          document.getElementById('tooltip-custom')?.remove();
        }
      });
    }
    this.clickCount++;
    if (event && event.day_type == 'P') {
      event.showTooltip = true;
      arg.dayEl.firstChild.insertAdjacentHTML(
        'afterend',
        `<div id='tooltip-custom' class="custom-tooltip">
       <p><span>Login:</span>${event.time.loginTime}</p>
       <p><span>Logout:</span>${event.time.logoutTime}</p>
       <p><span>Break:</span> ${event.time.breakTime}</p>
       <p><span>Total Time:</span>${event.time.totalTime}</p>
        </div>`
      );

      arg.dayEl.addEventListener('click', function (event: any) {
        // console.log('click event', arg.dayEl.firstChild, event.target);
        if (arg.dayEl.firstChild !== event.target) {
          // console.log('clicked outside the div');
          document.getElementById('tooltip-custom')?.remove();
        }
      });
    } else if (event && (event.day_type == 'FH' || event.day_type == 'SH')) {
      event.showTooltip = true;
      arg.dayEl.firstChild.insertAdjacentHTML(
        'afterend',
        `<div id='tooltip-custom' class="custom-tooltip">
      <p><span>Login:</span>${event.time.loginTime}</p>
      <p><span>Logout:</span>${event.time.logoutTime}</p>
      <p><span>Break:</span> ${event.time.breakTime}</p>
      <p><span>Total Time:</span>${event.time.totalTime}</p>
      <p><span>Leave Type:</span>${event.day_type == 'FH' ? 'First Half' : 'Second Half'}</p>
      <p><span>Leave Subject:</span>${event.leave_subject}</p>

       </div>`
      );
    } else if (event && event.day_type == 'FD') {
      event.showTooltip = true;
      arg.dayEl.firstChild.insertAdjacentHTML(
        'afterend',
        `<div id='tooltip-custom' class="custom-tooltip">

      <p><span>Leave Subject:</span>${event.leave_subject}</p>

       </div>`
      );
    }
    // <p><span>Login:</span>${event.time.loginTime}</p>
    //   <p><span>Logout:</span>${event.time.logoutTime}</p>
    //   <p><span>Break:</span> ${event.time.breakTime}</p>
    //   <p><span>Total Time:</span>${event.time.totalTime}</p>
    //else if (event &&) {
    //   if (event.showTooltip) {
    //     event.showTooltip = false;
    //     arg.dayEl.lastChild.remove();
    //   } else {
    //     event.showTooltip = true;
    //     arg.dayEl.firstChild.insertAdjacentHTML(
    //       'afterend',
    //       `<div class="custom-tooltip">
    //     <p><span>Leave Subject:</span>${event.leave_subject}</p>
    //     </div>
    //     `
    //     );
    //   }
    // }
    else if (event && event.day_id == 1) {
      event.showTooltip = true;
      arg.dayEl.firstChild.insertAdjacentHTML(
        'afterend',
        `<div id='tooltip-custom' class="custom-tooltip">
      <p><span>${event.holiday_title}</span></p>

       </div>`
      );
    }
  }
  modifyDayCellClassNames(arg: any) {
    const event = this.eventList.find((event: any) => (arg.date as Date).toISOString().split('T')[0] === event.date);

    if (event) {
      if (event.day_type == 'SH' || event.day_type == 'FH' || event.day_type == 'FD') {
        return moment(event.date).isBefore(moment(), 'day') ? ['bg-leave-day' ] : ['bg-leave-day'];
      } else if (event.day_type == 'H') {
        return moment(event.date).isBefore(moment(), 'day') ? ['bg-holiday'] : ['bg-holiday'];
      } else if (event.day_type == 'WO') {
        return moment(event.date).isBefore(moment(), 'day') ? ['bg-weekend'] : ['bg-weekend'];
      } else if (event.day_type == 'P') {
        return moment(event.date).isBefore(moment(), 'day') ? ['bg-present'] : ['bg-present'];
      } else if (event.day_type == 'A') {
        return moment(event.date).isBefore(moment(), 'day') ? ['bg-absent'] : ['bg-absent'];
      } else {
        return moment(event.date).isBefore(moment(), 'day') ? [] : [];
      }
    } else {
      return [];
    }
  }

  // <!-- 1 > H - Holiday
  // *  2 > WO - Week Off
  // *  3 > P - Present
  // *  4 > HD-F - Half Day (First Half)
  // *  5 > HD-S - Half Day (Second Half)
  // *  6 > UPL - Unplanned Leave
  // *  7 > L - Leave
  // *  8 > -
  // *  9 > Absence -->
  modifyDayCellContent(arg: any) {
    return {
      html: `<div>${arg.dayNumberText}</div>`,
    };
  }

  /**
   * bind event data on full calendar
   */
  // bindEvents() {
  //   const eventData = this.holidayList.map((m: any) => ({
  //     title: m.holidayTitle || '',
  //     start: m.holidayDate || '',
  //     end: '',
  //     allDay: true,
  //     className: 'is-event-day',
  //   }));
  //   if (this.holidayCalendar) {
  //     // this.holidayCalendar.getApi().addEvent([]);
  //     eventData.forEach((event: any) => {
  //       this.holidayCalendar.getApi().addEvent(event);
  //     });
  //   }
  // }
}
