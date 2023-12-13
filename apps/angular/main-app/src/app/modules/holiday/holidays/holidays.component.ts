import dayGridPlugin from '@fullcalendar/daygrid';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, ViewChild, AfterViewInit, OnInit, EventEmitter, OnChanges, Renderer2, ElementRef } from '@angular/core';
import { HolidayService } from '../../../core/services/module/holiday/holiday.service';
import * as moment from 'moment';
import { Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { FormControl } from '@angular/forms';
import { CalendarOptions, DatesSetArg } from '@fullcalendar/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import interactionPlugin from '@fullcalendar/interaction';

export interface IHolidayData {
  from_date: string;
  id: number;
  short_description: string;
  title: string;
  to_date: string;
}
@Component({
  selector: 'main-app-holidays',
  templateUrl: './holidays.component.html',
  styleUrls: ['./holidays.component.scss'],
})
export class HolidaysComponent implements OnInit, AfterViewInit, OnChanges {
  holidayList: any;
  subscriptions: Subscription[] = [];
  currentPage: any = 1;
  limit: any = 5;
  totalPage: any;
  totalRecords: any;
  currentYear = moment().year();
  currentMonth = +moment().format('M');
  sortBy = 'eventDate';
  orderBy = 'asc';

  displayedColumns: string[] = ['month', 'holidayDate', 'holidayName', 'day'];
  dataSource = new MatTableDataSource<any>();
  emptyData = new MatTableDataSource([{ empty: 'row' }]);

  @ViewChild(MatSort) sort!: MatSort;
  searchControl = new FormControl();
  dayTypeControl = new FormControl();
  searchText: any;
  dayType: any = [
    {
      id: 0,
      title: 'Specialday',
    },
    {
      id: 1,
      title: 'Holiday',
    },
    {
      id: 2,
      title: 'Birthday',
    },
    {
      id: 3,
      title: 'Work Anniversary',
    },
  ];

  // calendar
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent; // the #calendar in the template
  calendarOptions!: CalendarOptions;
  holidayCalendarEvents: any[] = [];
  currentDate = moment(new Date()).format('YYYY-MM-DD');
  specialDayList: any;
  /**
   * 0 special day
   * 1 holiday
   * 2 birthday
   * 3 anniversary
   */
  events: any[] = [];
  eventsOnSameDate: any;
  showAllSpecialDay = false;
  showAllHoliday = false;
  isFutureDate = false;
  isPastDate = false;
  isCurrentDate = false;
  futureMonthErrorMessage: any;
  pastMonthErrorMessage: any;
  currentMonthErrorMessage: any;
  monthChangedDate: any;
  isClickedAllSpecialDay = false;
  isClickedAllHoliday = false;
  isVisibleTooltip = false;
  showSpinnerSpecialDays = true;
  showSpinnerHolidays = true;
  constructor(
    private holidayService: HolidayService,
    private _liveAnnouncer: LiveAnnouncer,
    private router: Router,
    public dialog: MatDialog,
    private spinnerService: SpinnerService,
    private _snackBar: MatSnackBar,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}
  async ngOnInit() {
    window.scroll(0, 0);
    this.initializeCalendarOptions();
  }

  ngAfterViewInit() {
    this.getHolidayList(0);
    this.calendarComponent.getApi().scrollToTime(this.currentDate);
    setTimeout(() => {
      // this.calendarComponent.getApi().setOption('aspectRatio', 1.3);
      // this.calendarOptions.multiMonthMinWidth = 350;
    }, 3000);
    this.calendarOptions.eventClick = this.handleEventClick.bind(this);
  }

  ngOnChanges() {
    this.calendarComponent.getApi().setOption('aspectRatio', 1.5);
  }

  getHolidayList(holidayType: any) {
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
      case 5:
        this.showAllHoliday = false;
        this.showAllSpecialDay = false;
        this.showSpinnerSpecialDays = true;
        this.showSpinnerHolidays = true;
        break;

      default:
        this.specialDayList = [];
        this.holidayList = [];
        this.showAllHoliday = false;
        this.showAllSpecialDay = false;
        this.showSpinnerSpecialDays = true;
        this.showSpinnerHolidays = true;
    }
    let requestBody: any = {};
    if (holidayType === 3 || holidayType === 4) {
      requestBody = {
        sortBy: this.sortBy,
        orderBy: this.orderBy,
        year: this.currentYear,
        month:
          holidayType == 3 && this.showAllHoliday == false
            ? +this.currentMonth
            : holidayType == 4 && this.showAllSpecialDay == false
            ? +this.currentMonth
            : '',
      };
    } else {
      requestBody = {
        sortBy: this.sortBy,
        orderBy: this.orderBy,
        year: this.currentYear,
        month: holidayType == 0 ? +this.currentMonth : '',
      };
    }
    this.holidayService.getAllHoliday(requestBody).subscribe(
      (response: any) => {
        if (!response || !response.list) {
          this.holidayList = [];
          this.specialDayList = [];
          this.showSpinnerSpecialDays = false;
          this.showSpinnerHolidays = false;
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
        this.events = response.list;
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
        if (holidayType === 0) {
          this.bindEvents(eventArray);
          this.showSpinnerHolidays = false;
          this.showSpinnerSpecialDays = false;
        }
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
        if (holidayType === 5 && this.showAllSpecialDay == false && this.showAllHoliday == false) {
          this.specialDayList = this.filterAndMapHolidays(response.list, 2);
          this.holidayList = this.filterAndMapHolidays(response.list, 1);
          this.showSpinnerHolidays = false;
          this.showSpinnerSpecialDays = false;
        }
        // this.limit = response.limit;
        // this.totalPage = response.totalPage;
        // this.totalRecords = response.totalRecords;
        // this.currentPage = response.currentPage;
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

  initializeCalendarOptions() {
    this.calendarOptions = {
      plugins: [dayGridPlugin, interactionPlugin],
      // initialDate: new Date().toISOString(),
      initialView: 'dayGridMonth',
      firstDay: 1,
      aspectRatio: 1.6,
      weekends: true, // false to show only weekdays
      timeZone: 'UTC',
      headerToolbar: {
        left: 'prev',
        center: 'title',
        right: 'next todayButton',
      },
      contentHeight: 'auto',
      views: {
        dayGridMonth: {
          type: 'dayGridMonth',
          // duration: { months: 3 },
          editable: true,
          fixedWeekCount: false,
          showNonCurrentDates: true,
          // multiMonthMinWidth: 350, // min width month view
          multiMonthTitleFormat: { month: 'long', year: 'numeric' },
          eventResizableFromStart: true, // Whether the user can resize an event from its starting edge.
          // eventResourceEditable: true,
          slotEventOverlap: false,
          eventOverlap: false,
          // eventOverlap: function (stillEvent, movingEvent: any) {
          //   return stillEvent.allDay && movingEvent.allDay;
          // },
        },
      },
      eventContent: this.renderEventContent.bind(this), // custom html on event data
      events: this.events,
      //year change event
      datesSet: async (event: any) => {
        // const _startYear = moment(event.view.currentStart).year();
        this.showAllSpecialDay = false;
        this.showAllHoliday = false;
        const _startMonth = +moment(event.view.currentStart).format('M');
        if (_startMonth !== +this.currentMonth) {
          await this.calendarComponent.getApi().removeAllEvents();
          this.currentMonth = _startMonth;
          this.currentYear = moment(event.view.currentStart).year();
          this.monthChangedDate = this.currentYear + '-' + this.currentMonth + '-' + this.currentDate.split('-')[2];
          this.calendarOptions.events = [];
          if (moment(this.monthChangedDate).isSame(this.currentDate)) {
            this.isCurrentDate = true;
            this.isPastDate = false;
            this.isFutureDate = false;
            this.currentMonthErrorMessage = 'No public holidays are listed for this month.';
          } else if (moment(this.monthChangedDate).isBefore(moment(this.currentDate))) {
            this.pastMonthErrorMessage = 'No public holidays were listed for this month.';
            this.isCurrentDate = false;
            this.isPastDate = true;
            this.isFutureDate = false;
          } else {
            this.futureMonthErrorMessage = 'No public holidays are listed for this month.';
            this.isCurrentDate = false;
            this.isPastDate = false;
            this.isFutureDate = true;
          }
          await this.getHolidayList(0);
        } else {
          this.calendarComponent.getApi().removeAllEvents();
          this.currentMonth = _startMonth;
          this.currentYear = moment(event.view.currentStart).year();
          this.monthChangedDate = this.currentYear + '-' + this.currentMonth + '-' + this.currentDate.split('-')[2];
          setTimeout(() => {
            if (!this.specialDayList?.length || !this.holidayList?.length) {
              this.isCurrentDate = true;
              this.currentMonthErrorMessage = 'No data available for current dates';
            }
          }, 1000);
        }

        // logic for year change calendar
        // if (_startYear !== this.currentYear) {
        //   this.calendarOptions.events = [];
        //   this.currentYear = moment(event.view.currentStart).year();
        //   this.getHolidayList();
        // }
      },
      customButtons: {
        todayButton: {
          text: 'Today',
          click: async () => {
            this.calendarComponent.getApi().today();
            this.calendarComponent.getApi().removeAllEvents();
            await this.getHolidayList(0);
          },
        },
      },
      dateClick: this.dayClick.bind(this),
    };
  }

  renderEventContent(eventInfo: any, createElement: any) {
    const eventTitle = eventInfo.event.title;
    const eventCount = eventInfo.event.extendedProps.sameStartDateCount;
    const isHoliday = eventInfo.event.extendedProps.isHoliday;
    const eventStartDate = eventInfo.event.start;
    let moreButtonHtml = '';
    if (eventCount > 1) {
      moreButtonHtml = `<p id="moreButton-${eventStartDate.getTime()}" class="holiday-title holiday-link more-button">+${eventCount - 1} more </p>`;
    }
    const eventHtml = `
      <div class="is-holiday" >
        <p class='holiday-title holiday-color-item ${
          isHoliday == 1 ? 'purple-holiday' : isHoliday == 0 ? 'yellowish-brown-holiday' : isHoliday == 2 ? 'babypink-holiday ' : 'skyblue-holiday'
        }'>${eventTitle}</p>
        ${moreButtonHtml}
      </div>
    `;

    return (createElement = { html: eventHtml });
  }

  handleEventClick(info: any) {
    this.isVisibleTooltip = !this.isVisibleTooltip;
    const event = info.event;
    const el = info.el;
    const moreButton = el.querySelector('.more-button');
    if (moreButton) {
      const date = moment(event.start).format('YYYY-MM-DD');
      const otherRecords = this.events.filter((m) => m.eventDate === moment(date).format('YYYY-MM-DD'));
      if (otherRecords.length > 1) {
        const tooltipDiv = document.createElement('div');
        tooltipDiv.className = 'custom-tooltip';
        tooltipDiv.id = 'custom-tooltip';
        otherRecords.forEach((element) => {
          const eventParagraph = document.createElement('p');

          eventParagraph.innerHTML = ` <div class="is-holiday" ><p style="margin-left: 20px;" class='holiday-title holiday-color-item ${
            element.isHoliday == 1
              ? 'purple-holiday'
              : element.isHoliday == 0
              ? 'yellowish-brown-holiday'
              : element.isHoliday == 2
              ? 'babypink-holiday '
              : 'skyblue-holiday'
          }'>${element.title}</div>`;
          tooltipDiv.appendChild(eventParagraph);
        });
        this.isVisibleTooltip
          ? el.appendChild(tooltipDiv)
          : el.contains(document.querySelector('#custom-tooltip')) && el.removeChild(document.querySelector('#custom-tooltip'));
        moreButton.addEventListener('click', () => {
          // Handle more button click if needed
        });
      } else {
        this.isVisibleTooltip = false;
      }
    }
  }

  bindEvents(calendarEventData: any) {
    if (this.calendarComponent) {
      calendarEventData.forEach((event: any) => {
        this.calendarComponent.getApi().addEvent(event);
      });
    }
  }

  resetEvents() {
    if (this.calendarComponent) {
      this.calendarComponent.getApi().removeAllEvents();
    }
  }

  dayClick(arg: any) {
    // console.log('dayClick', arg);
    this.isVisibleTooltip = false;
    document.getElementById('custom-tooltip')?.remove();
  }

  getMonthAndYear(isYear?: any) {
    if (isYear) {
      return '(' + moment(this.monthChangedDate).format('YYYY') + ')' || '(' + moment(this.currentMonth).format('YYYY') + ')';
    }
    return '(' + moment(this.monthChangedDate).format('MMMM YYYY') + ')' || '(' + moment(this.currentMonth).format('MMMM YYYY') + ')';
  }

  onDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
