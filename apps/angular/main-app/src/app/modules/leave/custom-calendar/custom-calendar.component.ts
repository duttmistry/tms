import {
  Component,
  ViewEncapsulation,
  Input,
  AfterViewInit,
  OnInit,
  ViewChild,
  SimpleChanges,
  OnChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DateRange, MatCalendar, MatCalendarCellClassFunction, MatCalendarCellCssClasses, MatCalendarCell } from '@angular/material/datepicker';
import moment from 'moment';
import { CalendarOptions, Calendar, EventContentArg, EventApi, CalendarApi, DateSelectArg, DayCellContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { FullCalendarComponent } from '@fullcalendar/angular';

@Component({
  selector: 'custom-calendar',
  templateUrl: './custom-calendar.component.html',
  styleUrls: ['./custom-calendar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomCalendarComponent implements OnInit, OnChanges, AfterViewInit {
  calendarOptions!: CalendarOptions;
  calendarEvents: EventApi[] = [];
  @ViewChild('Calendar')
  holidayCalendar!: FullCalendarComponent;

  @Input()
  holidayList!: {
    day: string;
    festivalDate: string;
    festivalName: string;
    isHoliday: string;
  }[];
  @Input()
  fromDate!: string;
  @Input()
  toDate!: string;
  selectedDateRange: any = '';
  minDate = new Date('1900-01-01');

  // dateClass: MatCalendarCellClassFunction<any> = (cellDate, view) => {
  //   // Only highligh dates inside the month view.
  //   if (view === 'month') {
  //     const date = cellDate.toDate();
  //     const day = date.getDay();

  //     if (day == 0 || day == 6) {
  //       return ['weekends'];
  //     } else if (
  //       this.holidayList.find((holiday: any) => {
  //         return moment(holiday.festivalDate).format('DD/MM/YYYY') == moment(date).format('DD/MM/YYYY');
  //       })
  //     ) {
  //       return ['is-holiday'];
  //     } else {
  //       return [''];
  //     }
  //   }
  //   return '';
  // };
  constructor() {}

  ngOnInit(): void {
    if (this.holidayList && this.holidayList.length) {
      this.holidayList = this.holidayList.filter((holiday: any) => holiday.isHoliday == 1 || holiday.isHoliday == 0);
    }
    this.initializeHolidayCalendar();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && (changes['fromDate'] || changes['toDate'])) {
      if (this.fromDate && this.toDate && this.holidayCalendar) {
        this.holidayCalendar.getApi()?.gotoDate(this.fromDate);

        this.selectedDateRange = new DateRange(this.fromDate, moment(this.toDate).add('days', 1).format('YYYY-MM-DD'));

        this.holidayCalendar.getApi()?.select(this.selectedDateRange);

        if (
          this.holidayList.find(
            (day: any) =>
              moment(day.festivalDate).isSameOrBefore(moment(this.toDate)) && moment(day.festivalDate).isSameOrAfter(moment(this.fromDate))
          )
        ) {
          this.holidayCalendar.getApi().render();
        }
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.fromDate && this.toDate) {
      this.holidayCalendar.getApi().gotoDate(this.fromDate);
      this.selectedDateRange = new DateRange(this.fromDate, moment(this.toDate).add('days', 1).format('YYYY-MM-DD'));

      this.holidayCalendar.getApi().select(this.selectedDateRange);
    }
  }

  // setDateClass() {
  //   return (date: Date): MatCalendarCellCssClasses => {
  //     if (moment(date).day() == 0 || moment(date).day() == 6) {
  //       return 'weekends';
  //     } else if (
  //       this.holidayList.find((holiday: any) => {
  //         return moment(holiday.festivalDate).format('DD/MM/YYYY') == moment(date).format('DD/MM/YYYY');
  //       })
  //     ) {
  //       return 'is-event-day';
  //     } else {
  //       return '';
  //     }
  //   };
  // }

  initializeHolidayCalendar() {
    this.calendarOptions = {
      initialView: 'dayGridMonth',
      plugins: [dayGridPlugin],
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
      // validRange: {
      //   start: new Date(),
      //   end: new Date(new Date().getFullYear() + 1, 11, 31),
      // },
      events: [],
      // eventContent: this.renderEventContent,
      datesSet: (event: any) => {
        this.holidayCalendar.getApi().select(this.selectedDateRange);
      },
      customButtons: {
        todayButton: {
          text: 'Today',
          click: () => {
            // Handle the custom button click event
            this.holidayCalendar.getApi().today();
          },
        },
      },
      selectable: true,
      select: this.handleDateSelect.bind(this),
      dayCellContent: this.modifyDayCellContent.bind(this),
      dayCellClassNames: this.modifyDayCellClassNames.bind(this),
      // dayCellDidMount: this.modifyDayCellDidMount.bind(this),
    };
    // setTimeout(() => {

    // }, 2000);
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

  //       </div>
  //       `,
  //     });
  //   }
  // }
  //  <span class="event-title">H</span>
  // <p class="event-title"></p>
  // ${eventInfo.event._def.title}

  handleDateSelect(arg: DateSelectArg) {
    const { start, end } = arg;
    this.selectedDateRange.start = start;
    this.selectedDateRange.end = end;
  }

  modifyDayCellClassNames(arg: any) {
    let holiday = this.holidayList.find((h: any) => h.festivalDate == moment(arg.date).format('YYYY-MM-DD'));
    if (
      holiday &&
      moment(holiday.festivalDate).isSameOrBefore(moment(this.toDate)) &&
      moment(holiday.festivalDate).isSameOrAfter(moment(this.fromDate))
    ) {
      return [];
    }

    if (holiday) {
      return holiday.isHoliday == '1'
        ? ['bg-holiday']
        : holiday.isHoliday == '0'
        ? ['bg-specialday']
        : holiday.isHoliday == '2'
        ? ['bg-birthday']
        : ['bg-workany'];
    } else {
      return [];
    }
  }

  /**
   *
   * heigh light range of to and from date
   */
  modifyDayCellDidMount(arg?: any) {
    const date = arg.date;
    if (this.selectedDateRange.start && this.selectedDateRange.end && date >= this.selectedDateRange.start && date < this.selectedDateRange.end) {
      const cellEl = arg.el;
      cellEl.classList.add('selected-range');
    }
  }

  modifyDayCellContent(arg: any) {
    let holiday = this.holidayList.find((h: any) => h.festivalDate == moment(arg.date).format('YYYY-MM-DD'));

    if (holiday) {
      switch (holiday.isHoliday) {
        case '1':
          'is-holiday';
          break;
        case '0':
          'is-specialday';
          break;
        case '2':
          'is-birthday';
          break;
        default:
          'is-workany';
          break;
      }
    }
    return {
      html: ` ${
        holiday && holiday.festivalName
          ? `<div  data-tooltip="${holiday.festivalName}">${arg.dayNumberText}</div>`
          : `<div>${arg.dayNumberText}</div>`
      }`,
    };

    // return {
    //   html: `<div  class=${
    //     holiday
    //       ? holiday.isHoliday == '1'
    //         ? 'is-holiday'
    //         : holiday.isHoliday == '0'
    //         ? 'is-specialday'
    //         : holiday.isHoliday == '2'
    //         ? 'is-birthday'
    //         : 'is-workany'
    //       : ''
    //   } title="${holiday ? holiday.festivalName : ''}"> ${arg.dayNumberText}

    //   </div> `,
    // };
  }

  /**
   * bind event data on full calendar
   */
  // bindEvents() {
  //   const eventData = this.holidayList.map((m: any) => ({
  //     title: m.festivalName || '',
  //     start: m.festivalDate || '',
  //     end: '',
  //     allDay: false,
  //     className: 'is-event-day',
  //   }));
  //   if (this.holidayCalendar) {
  //     this.holidayCalendar.getApi().addEvent([]);
  //     eventData.forEach((event: any) => {
  //       this.holidayCalendar.getApi().addEvent(event);
  //     });
  //   }
  // }
}
