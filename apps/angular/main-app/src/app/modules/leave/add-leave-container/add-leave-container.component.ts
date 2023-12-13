import { Component, OnInit } from '@angular/core';
import { SiteSettingService } from '../../../core/services/common/site-setting.service';
import { UserService } from '../../../core/services/module/users/users.service';
import { HolidayService } from '../../../core/services/module/holiday/holiday.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import moment from 'moment';

@Component({
  selector: 'app-add-leave-container',
  templateUrl: './add-leave-container.component.html',
  styleUrls: ['./add-leave-container.component.scss'],
})
export class AddLeaveContainerComponent implements OnInit {
  isUserLeaveResponsiblePerson!: boolean;
  loggedInUserId!: string;
  holidayList!: any;
  constructor(
    private spinnerService: SpinnerService,
    private holidayService: HolidayService,
    private siteSettingService: SiteSettingService,
    private userService: UserService
  ) {}
  ngOnInit(): void {
    this.loggedInUserId = this.userService.getLoggedInUserId().toString();
    this.checkIfUserIsLeaveResponsiblePerson();
    this.getHolidayList();
  }

  checkIfUserIsLeaveResponsiblePerson() {
    this.siteSettingService.getModuleWiseSiteSettingsData('leave').subscribe((res: any) => {
      if (res.data) {
        let leaveRPData = res.data.find((data: any) => data.identifier == 'leave_reponsible_person');
        if (leaveRPData && leaveRPData.value) {
          if (leaveRPData.value.find((resp_id: number) => resp_id.toString() === this.loggedInUserId)) {
            this.isUserLeaveResponsiblePerson = true;
          } else {
            this.isUserLeaveResponsiblePerson = false;
          }
        }
      }
    });
  }

  getHolidayList() {
    this.spinnerService.showSpinner();

    this.holidayService.getAllHoliday({ year: new Date().getFullYear(), sortBy: 'eventDate' }).subscribe(
      (res) => {
        this.spinnerService.hideSpinner();
        if (res && res.length == 0) {
          this.holidayList = [];
          return;
        }
        this.holidayList = res.list.map((holiday: any) => ({
          festivalName: holiday.title,
          festivalDate: moment(holiday.eventDate).format('YYYY-MM-DD'),
          day: moment(holiday.eventDate).format('dddd'),
          isHoliday: holiday.isHoliday,
        }));
      },
      (error) => {
        this.holidayList = [];

        this.spinnerService.hideSpinner();
      }
    );
  }
}
