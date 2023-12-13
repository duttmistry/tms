import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CalendarOptions, Calendar } from '@fullcalendar/core';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import { ResourceApi } from '@fullcalendar/resource';
import { TeamLeaveService } from '../../../../core/services/module/leave/team-leave/team-leave.service';
import { map, Observable, startWith, Subscription } from 'rxjs';
import * as moment from 'moment';
import { environment } from '../../../../../environments/environment';
import { log } from 'console';
import { Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';

export interface IReportingUsersModel {
  id: number;
  name: string;
  date: string;
  leaveType: string;
  employee_image: string;
  designation: string;
}
@Component({
  selector: 'main-app-team-leave',
  templateUrl: './team-leave.component.html',
  styleUrls: ['./team-leave.component.scss'],
})
export class TeamLeaveComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('search') serach!: ElementRef;
  public calendarOptions!: CalendarOptions;
  public employee = new FormControl();
  public searchTextBoxControl = new FormControl();
  public leaveImageUrl = '../../../../assets/images/';
  imageBaseURL = environment.base_url;
  selectedEmployee: any = [];
  filteredEmployees!: Observable<any>;
  @Input()
  initialCalendarDate = new Date();
  currentDate = moment().day();
  elementsData: any;
  @Input()
  public allEmployee: IReportingUsersModel[] = [];

  @Input()
  public allUsers: any = [];

  @Output()
  // eslint-disable-next-line @angular-eslint/no-output-on-prefix
  public onCalendarMonthChangeEvent = new EventEmitter<Date>();
  allEmployeeCheckboxControl = new FormControl(false);
  totalSelectedEmployee = 0;
  totalEmployee = 0;
  selectAllEmployee: any;
  subscription!: Subscription;
  showDropdown = false;
  showSpinner = true;
  constructor(private teamLeaveService: TeamLeaveService, private router: Router) {
    this.subscription = this.teamLeaveService.calendarData$.subscribe(
      async (data) => {
        this.allEmployee = data?.empData || [];
        // console.log('all employee', this.allEmployee);
        this.allUsers = data?.userData || [];
        this.showDropdown = data?.showDropdown;
        await this.manageAppliedEmployeeLeaves();
        await this.setupFilteredEmployees();
        this.showSpinner = false;
      },
      (error: any) => {
        this.showSpinner = false;
      }
    );
  }

  ngOnInit() {
    // console.log();
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  ngAfterViewInit() {
    this.manageAppliedEmployeeLeaves();
  }

  async manageAppliedEmployeeLeaves() {
    this.employee.patchValue(this.allUsers);
    this.selectedEmployee = [...this.allUsers];
    this.totalEmployee = this.allUsers.length;
    await this.createCustomCalendarOption();
    setTimeout(() => {
      this.getData();
    }, 100);
    // await this.clickedEventBind()
  }
  navigateToLeaveHistory(id: any) {
    // console.log("ID", id);
    this.router.navigate(['leave', 'history', Encryption._doEncrypt(id.toString())], { state: { data: 'Profile' } });
  }

  public createCustomCalendarOption() {
    this.calendarOptions = {
      plugins: [resourceTimelinePlugin],
      initialView: 'resourceTimelineMonth',
      nowIndicator: true,
      aspectRatio: 1.6,
      // contentHeight: 'auto',
      // height: 'auto',
      initialDate: moment().subtract(3, 'days').toISOString(), // start display month from the date
      headerToolbar: {
        left: 'prev',
        center: 'title',
        right: 'next',
      },
      views: {
        resourceTimelineMonth: {
          slotLabelFormat: [
            { weekday: 'short', day: '2-digit' }, // lower level of text
          ],
          duration: { days: 30 }, // start display month from the date
          // viewRender: (event:any) => {
          //   // get the current date and format it as required
          //   const currentDate = new Date();
          //   const currentDateString = moment(currentDate).format('yyyy-MM-dd');

          //   // get the current date event element
          //   const currentDateEl = document.querySelector(`.fc-timeline-event[data-date="${currentDateString}"]`);

          //   // scroll the element into view
          //   if (currentDateEl) {
          //     currentDateEl.classList.add('event-current-date');
          //     currentDateEl.scrollIntoView();
          //   }
          // },
        },
      },

      resourceAreaHeaderContent: (arg: any) => {
        return {
          html: `
            <span style="margin-left: 20px;">All Employee</span>
          `,
        };
      },
      resources: [
        ...this.allEmployee.map((ele: any) => {
          return {
            id: ele.id.toString(),
            title: ele.name,
            employee_image: ele.employee_image ? this.imageBaseURL + ele.employee_image : 'assets/images/default.png',
            designation: ele.designation,
          };
        }),
      ],
      resourceOrder: 'title',
      resourcesSet: (resources: ResourceApi[]) => {
        resources.sort((a, b) => {
          return a.id.localeCompare(b.id);
        });
      },

      eventContent: this.renderEventContent,
      datesSet: (event: any) => {
        this.onCalendarMonthChangeEvent.emit(event.start);
        // event.view.calendar.gotoDate(this.calendarOptions.now);
      },
      events: [
        ...this.allEmployee.map((ele: any) => {
          return {
            leaveSubject: ele.leaveSubject,
            resourceId: ele.id.toString(),
            start: ele.date,
            imageUrl:
              ele.leaveType == 'FD'
                ? this.leaveImageUrl + 'full-day.png'
                : ele.leaveType == 'FH'
                ? this.leaveImageUrl + 'first-half.png'
                : ele.leaveType == 'SH'
                ? this.leaveImageUrl + 'second-half.png'
                : '',
          };
        }, ...(this.allEmployee = [])),
      ],
      resourceAreaWidth: '290px',
      slotMinWidth: 100,
      resourceLabelClassNames: ['employee-name-label'],

      // calendar header day and date section
      slotLabelContent: (arg: any) => {
        const _date = arg.text.split(' ')[0] || '-';
        const _day = arg.text.split(' ')[1] || '-';
        return {
          html: `
            <div class="calendar-header-day-date">

              <span class="day-text">${_day}</span>
              <span class="date-number">${_date}</span>
            </div>
          `,
        };
      },

      // employee listing section
      resourceLabelContent: (arg) => {
        // console.log('resourceLabelContent data =>>', arg?.resource?._resource);
        // console.log("ARG", arg)
        const props = arg?.resource?._resource;
        const extendedProps = arg?.resource?._resource['extendedProps'] || {};
        // document.addEventListener("DOMContentLoaded", function () {
        //   const elements1 : any = document.getElementsByClassName("resource-label-content cursor-pointer");
        //   // console.log('%c  elements1:', 'color: #0e93e0;background: #aaefe5;', elements1);
        //   let elements = [...elements1]
        //   // console.log('%c  elements:', 'color: #0e93e0;background: #aaefe5;', elements);
        //   for (let i = 0; i < elements.length; i++) {
        //     const element = elements[i] as HTMLElement;
        //     element.addEventListener("click", function (event) {
        //       // console.log('%c  event:', 'color: #0e93e0;background: #aaefe5;', event);
        //       const id = element.getAttribute("data-id");
        //       navigateToLeaveHistory(id);
        //     });
        //   }
        // // })
        //   function navigateToLeaveHistory(id: any) {
        //     // Your navigation logic here
        //     console.log("NAVIGATION id", id)
        //   }

        return {
          // href='/leave/history/${encodeURIComponent(Encryption._doEncrypt(props.id.toString()))}'
          html: `
            <div  class="resource-label-content cursor-pointer" style="display: flex; align-items: center;width: 100%;gap: 10px;height: 59px;margin-left: 20px;" data-id="${
              props.id
            }">
            <img crossorigin="anonymous" src="${extendedProps['employee_image']}" onerror="this.src = 'assets/images/default.png'" style="width: 32px;
            height: 32px;border-radius: 50%;object-fit: cover;" />
             <div>
             <p  class="resource-label-content-title" style="margin-left: 8px">${props?.title || ''}</p>
             <span class="resource-label-content-designation" style="display: block;white-space: nowrap;text-overflow: ellipsis;overflow: hidden;width: 210px;font-size: 14px;
             font-weight: 400;
             line-height: 17px;">${extendedProps['designation'] || ''}</span>
             </div>
            </div>
            `,
        };
      },
      eventDidMount: (info: any) => {
        console.log('info', info);
        const title = info.event.title;
        const imageUrl = info.event.extendedProps.imageUrl;
        const leaveSubject = info.event.extendedProps.leaveSubject;

        if (imageUrl) {
          const element = info.el as HTMLElement;
          const imageElement = element.querySelector('img') as HTMLImageElement;

          // Set the title attribute for the tooltip
          //  imageElement.setAttribute('title', leaveSubject);

          // Create a tooltip content element
          const tooltipElement = document.createElement('div');
          tooltipElement.innerText = leaveSubject;
          tooltipElement.style.position = 'absolute';
          tooltipElement.style.backgroundColor = '#333';
          tooltipElement.style.color = '#fff';
          tooltipElement.style.padding = '5px';
          tooltipElement.style.borderRadius = '5px';
          tooltipElement.style.zIndex = '1';
          tooltipElement.style.display = 'none'; // Initially hide the tooltip
          tooltipElement.style.left = '100%'; // Center the tooltip horizontally over the image
          tooltipElement.style.transform = 'translateX(-50%)'; // Adjust to center the tooltip
          tooltipElement.style.top = '5%';

          // Add event listeners to show and hide the tooltip
          imageElement.addEventListener('mouseover', () => {
            // Check if the tooltip is already present
            if (!element.contains(tooltipElement)) {
              element.appendChild(tooltipElement);
              tooltipElement.style.display = 'block'; // Show the tooltip
              tooltipElement.style.zIndex = '2';

              // Position the tooltip behind the image
              // const imageRect = imageElement.getBoundingClientRect();
              // tooltipElement.style.left = element.offsetLeft + 'px';
              // tooltipElement.style.top = element.offsetTop + imageRect.height + 15 + 'px';
            }
          });

          imageElement.addEventListener('mouseout', () => {
            // Check if the tooltip is present before removing
            if (element.contains(tooltipElement)) {
              element.removeChild(tooltipElement);
              tooltipElement.style.zIndex = '1';
            }
          });

          // Ensure parent elements have a positioning context
          element.style.position = 'relative';

          // Optionally, you can set additional styling for the image
          imageElement.style.cursor = 'pointer'; // Add a pointer cursor on hover
          imageElement.style.position = 'relative';
        }
      },
    };
  }

  //Event Render Function used for display images
  renderEventContent(eventInfo: any, createElement: any): any {
    let innerHtml;
    //Check if event has image
    if (eventInfo.event._def.extendedProps.imageUrl) {
      // Store custom html code in variable
      innerHtml = eventInfo.event._def.title + "<img style='width:20px;' src='" + eventInfo.event._def.extendedProps.imageUrl + "'>";
      //Event with rendering html
      return (createElement = {
        html: '<div style="text-align: center;">' + innerHtml + '</div>',
      });
    }
  }

  /**
   * Used to set up filter data
   */
  private setupFilteredEmployees() {
    /*** Set filter event based on value changes */
    this.filteredEmployees = this.searchTextBoxControl.valueChanges.pipe(
      startWith<string>(''),
      map((name) => this._filterEployees(name))
    );
  }

  /**
   * Used to filter data based on search input
   */
  private _filterEployees(name: any): any[] {
    const filterValue = name.toLowerCase();
    this.getSelectedData();
    return this.allUsers.filter((option: any) => option.name.toLowerCase().indexOf(filterValue) === 0);
  }

  /**
   * Used to get data on vlaue change
   */
  public getSelectedData() {
    this.employee.valueChanges.subscribe((selectedEmployee: { id: number; name: string; employee_image: string; designation: string }[]) => {
      this.calendarOptions.resources = [
        ...selectedEmployee.map((ele) => {
          return {
            id: ele.id?.toString(),
            title: ele.name,
            employee_image: ele.employee_image ? this.imageBaseURL + ele.employee_image : 'assets/images/default.png',
            designation: ele.designation,
          };
        }),
      ];
      if (this.calendarOptions.resources.length == 0) {
        this.calendarOptions.resources = [
          ...this.allEmployee.map((ele) => {
            return {
              id: ele.id.toString(),
              title: ele.name,
              employee_image: ele.employee_image ? this.imageBaseURL + ele.employee_image : 'assets/images/default.png',
              designation: ele.designation,
            };
          }),
        ];
      }
    });
  }
  getData() {
    this.elementsData = document.getElementsByClassName('resource-label-content cursor-pointer');
    // console.log('%c  this.elementsData:', 'color: #0e93e0;background: #aaefe5;', this.elementsData);

    for (let i = 0; i < this.elementsData?.length; i++) {
      const element = this.elementsData[i] as HTMLElement;
      element.addEventListener('click', (event) => {
        const id = element.getAttribute('data-id');
        // console.log('id:', id);
        this.navigateToLeaveHistorys(id);
      });
    }
    // })
  }
  navigateToLeaveHistorys(id: any) {
    // console.log('%c  id:', 'color: #0e93e0;background: #aaefe5;', id);
    this.router.navigate(['/leave/history', Encryption._doEncrypt(id.toString())], { state: { data: 'Profile' } });
  }

  selectAllAsignee() {
    this.selectedEmployee = [...this.allUsers];
    this.allEmployee = [...this.allUsers];

    this.employee.patchValue(this.selectedEmployee);
  }

  unselcteAllAsignee() {
    this.selectedEmployee = [];
    this.allEmployee = [];
    this.employee.patchValue(this.selectedEmployee);
  }

  /**
   *  Set and unset data from selected values based on check and uncheck
   */
  selectionChange(event: any, data: any) {
    if (event.isUserInput && event.source.selected == false) {
      const index = this.selectedEmployee.indexOf(event.source.value);
      this.selectedEmployee.splice(index, 1);
      this.employee.patchValue(this.selectedEmployee);
      this.allEmployee = this.employee.value;
    }
    if (event.isUserInput && event.source.selected) {
      this.selectedEmployee.push(data);
      this.employee.patchValue(this.selectedEmployee);
      this.allEmployee = this.employee.value;
      // const index = this.selectedEmployee.indexOf(event.source.value);
    }

    if (this.employee?.value.length === this.totalEmployee) {
      this.selectAllEmployee = true;
    } else if (this.totalSelectedEmployee === this.totalEmployee) {
      this.selectAllEmployee = true;
    } else {
      this.selectAllEmployee = false;
    }
    this.allEmployeeCheckboxControl.setValue(this.selectAllEmployee);
  }

  openedChange(e: any) {
    // Set search textbox value as empty while opening selectbox
    this.searchTextBoxControl.patchValue('');
    // Focus to search textbox while clicking on selectbox
    if (e == true) {
      this.serach.nativeElement.focus();
    }
  }

  /** * Clearing search textbox value */
  clearSearch(event: any) {
    event.stopPropagation();
    this.searchTextBoxControl.patchValue('');
  }

  onToggleAllEmp() {
    this.selectAllEmployee = this.allEmployeeCheckboxControl.value;
    if (this.selectAllEmployee === true) {
      this.selectedEmployee = [...this.allUsers];
      this.allEmployee = [...this.allUsers];
    } else {
      this.selectedEmployee = [];
      this.allEmployee = [];
    }
    this.employee.patchValue(this.selectedEmployee);
  }

  stopPropagation(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }
}
