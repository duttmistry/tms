import { Component, Input, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { isMoment } from 'moment';

import { GlobalService } from '../../../core/services/common/global.service';
import * as moment from 'moment';
import { LeaveService } from '../../../core/services/module/leave/leave.service';
import { Encryption } from '@tms-workspace/encryption';
import { environment } from '../../../../../src/environments/environment';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { Observable, map, startWith } from 'rxjs';
import { UserService } from '../../../core/services/module/users/users.service';
import { ITeamMembersData } from '../../../core/model/projects/project.model';
import { MatAutocomplete, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { STORAGE_CONSTANTS } from '../../../core/services/common/constants';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { DocumentsService } from '../../../core/services/module/documents/documents.service';
import { ILeaveSubjectResModel } from '../../../core/model/leave/leave.model';
import { Location } from '@angular/common';
import { en } from '@fullcalendar/core/internal-common';

@Component({
  selector: 'app-add-leave',
  templateUrl: './add-leave.component.html',
  styleUrls: ['./add-leave.component.scss'],
})
export class AddLeaveComponent implements OnInit {
  _base_url = environment.base_url;
  _minDate!: Date;

  leaveId: string | null = null;
  addLeaveForm: FormGroup;
  checkBalanceResData: any;
  leaveSubjectsResData: ILeaveSubjectResModel[] = [];
  filteredLeaveSubjectResData!: Observable<ILeaveSubjectResModel[]>;

  isSingleDayLeave = false;
  showLeaveSlotFields = false;
  fromDateSlotOptions!: {
    value: string;
    option: string;
  }[];
  toDateSlotOptions!: {
    value: string;
    option: string;
  }[];
  singleDateOptions!: {
    value: string;
    option: string;
  }[];

  leaveDateString: any;
  fromDateString: any;
  toDateString: any;

  leaveNoOfDaysCount = 0;
  availableBalance = {
    CL: 0,
    PL: 0,
    LWP: 0,
  };

  attachedDocuments: File[] = [];
  attachedDocumentsResData: any = [];

  approverUsersData: any;
  teamAlsoOnLeave: any;

  fromDate!: string;
  toDate!: string;
  @ViewChild('userInput') userInput!: ElementRef<HTMLInputElement>;

  loggedInUserId!: number;
  userRole!: string;
  @Input()
  isUserLeaveResponsiblePerson = false;
  userInputCtrl = new FormControl();
  filteredUsersResData!: Observable<any>;
  selectedLeaveUser: any;
  actionPermissionData: any;
  allUsersResData: any = [];
  @Input()
  holidayList: any = [];
  balanceAfterBookLeave: any;
  isSandwichLeave = false;
  isEditingASandwichLeave = false;
  isDocumentRequired = false;
  isDateAvailable = true;
  isLeaveInBetweenAvailable = false;
  isFromSlotAvailable = true;
  isToSlotAvailable = true;
  isHoliday = false;
  isWeekend = false;
  isLeaveUpdated = false;
  @ViewChild('fileInput') fileInput: any;
  loadingCount = 0;
  previousUrl: any;

  constructor(
    private formBuilder: FormBuilder,
    private sanitizer: DomSanitizer,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private _snackBar: MatSnackBar,
    private leaveService: LeaveService,
    private globalService: GlobalService,
    private spinnerService: SpinnerService,
    private userService: UserService,
    private dialog: MatDialog,
    private documentService: DocumentsService,
    private location: Location
  ) {
    window.scroll(0, 0);
    const id = this.activatedRoute.snapshot.params['id'];
    if (id) {
      this.leaveId = Encryption._doDecrypt(id).toString();
    }
    this.loggedInUserId = this.userService.getLoggedInUserId();
    this.addLeaveForm = this.initializeForm();

    this.previousUrl = this.activatedRoute.snapshot.queryParams['rb'];
  }

  ngOnInit(): void {
    this.getLeaveSubjects();
    if (!this.isUserLeaveResponsiblePerson) {
      this._minDate = new Date();
    } else {
      this._minDate = moment().subtract(1, 'month').endOf('month').toDate();
    }
    if (this.leaveId) {
      this.getLeaveDetailsById(this.leaveId);
    } else {
      const user = JSON.parse(Encryption._doDecrypt(localStorage.getItem(STORAGE_CONSTANTS.USER_DATA) as string));
      this.userRole = user.user_role;
      const id = this.activatedRoute.snapshot.queryParams['user_id'];
      const user_id = +Encryption._doDecrypt(id);

      if (this.isUserLeaveResponsiblePerson || this.userRole == 'Super Admin') {
        this.getAllUsersList(user_id ? user_id : this.loggedInUserId);
        this.getLeaveBalance(user_id ? user_id : this.loggedInUserId);
        this.getApproverUsersResData(user_id ? user_id : this.loggedInUserId);
      } else {
        this.getLeaveBalance(this.loggedInUserId);
        this.getApproverUsersResData(this.loggedInUserId);
      }
    }
  }

  initializeForm() {
    return this.formBuilder.group({
      description: [''],
      leaveSubject: ['', [Validators.required, Validators.pattern(/[a-zA-Z0-9]/), Validators.minLength(5), Validators.maxLength(30)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      leaveFromSlot: ['FD'],
      leaveToSlot: ['FD'],
    });
  }

  validateDate() {
    let startDate = this._addLeaveForm['startDate'].value;
    let endDate = this._addLeaveForm['endDate'].value;
    if (startDate instanceof Date) {
      startDate = moment(startDate.toISOString().split('T')[0]);
    }
    if (endDate instanceof Date) {
      endDate = moment(endDate.toISOString().split('T')[0]);
    }
    if (isMoment(startDate) && isMoment(endDate)) {
      if (startDate.isAfter(endDate)) {
        this._addLeaveForm['startDate'].setErrors({ isEndDateLessThanStartDate: true });
      } else {
        this._addLeaveForm['startDate'].setErrors(null);
      }
    }
  }

  get _addLeaveForm() {
    return this.addLeaveForm.controls;
  }

  openAuto(trigger: MatAutocompleteTrigger) {
    trigger.openPanel();
    this.userInput.nativeElement.focus();
  }

  closeAuto() {
    this.userInput.nativeElement.value = '';
    this.userInputCtrl.setValue(null);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const newValue = event.option.value;

    this.userInput.nativeElement.value = '';
    this.userInputCtrl.setValue(null);
    if (this.previousUrl) {
      this.router.navigateByUrl(`/index`).then(() => {
        this.router.navigate(['leave', 'add'], {
          queryParams: {
            rb: true,
            user_id: Encryption._doEncrypt(newValue.id.toString()),
          },
        });
      });
    } else {
      this.router.navigateByUrl(`/index`).then(() => {
        this.router.navigate(['leave', 'add'], {
          queryParams: {
            user_id: Encryption._doEncrypt(newValue.id.toString()),
          },
        });
      });
    }

    // this.selectedLeaveUser = newValue;
    // this.isSingleDayLeave = false;
    // this.showLeaveSlotFields = false;
    // this.fromDateSlotOptions = [];
    // this.toDateSlotOptions = [];
    // this.singleDateOptions = [];

    // this.leaveDateString = '';
    // this.fromDateString = '';
    // this.toDateString = '';

    // this.leaveNoOfDaysCount = 0;
    // console.log('selected leave user', this.selectedLeaveUser);

    // this.addLeaveForm.reset();
    // this.checkBalanceResData = null;

    // this.getApproverUsersResData(this.selectedLeaveUser.id);
    // this.getLeaveBalance(this.selectedLeaveUser.id);
  }

  getAllUsersList(user_id: number) {
    if (this.loadingCount === 0) {
      this.spinnerService.showSpinner();
    }
    this.loadingCount += this.loadingCount;

    this.userService.getAllUsers().subscribe(
      (response: any) => {
        if (response.data && response.data.list && response.data.list.length) {
          this.allUsersResData = response.data.list.map((user: any) => ({
            id: user.id,
            name: user.first_name + ' ' + user.last_name,
            avatar: user.employee_image,
            designation: user.designation,
          }));
        }

        this.selectedLeaveUser = this.allUsersResData.find((user: ITeamMembersData) => user.id.toString() == user_id.toString());
        // console.log('selected user', this.selectedLeaveUser);

        this.filteredUsersResData = this.userInputCtrl.valueChanges.pipe(
          startWith(null),
          map((item: string | null) => {
            return item ? this._filterUsers(item) : this.allUsersResData?.slice();
          })
        );

        this.loadingCount -= this.loadingCount;
        if (this.loadingCount === 0) {
          this.spinnerService.hideSpinner();
        }
      },
      (error) => {
        this.loadingCount -= this.loadingCount;
        if (this.loadingCount === 0) {
          this.spinnerService.hideSpinner();
        }
        console.log('error', error);
      }
    );
  }

  private _filterUsers(value: any): any {
    if (!value?.id) {
      const filterValue = value.toLowerCase();

      return this.allUsersResData.filter((item: ITeamMembersData) => item.name.toLowerCase().indexOf(filterValue) >= 0);
    }
  }

  getLeaveDetailsById(leave_id: string) {
    if (this.loadingCount === 0) {
      this.spinnerService.showSpinner();
    }
    this.loadingCount += this.loadingCount;
    this.leaveService.getLeaveDetailsById(leave_id).subscribe(
      (res: any) => {
        if (!(this.isUserLeaveResponsiblePerson || res.user_id == this.loggedInUserId)) {
          this.router.navigate(['unauthorized-access']);
        }

        if (this.isUserLeaveResponsiblePerson) {
          this.getAllUsersList(res.user_id);
        }
        this.getLeaveBalance(res.user_id);
        this.getApproverUsersResData(res.user_id);
        // if (moment(res.from_date).isBefore(new Date().toDateString().split('T')[0])) {
        //   this.router.navigate(['leave']);
        // }
        this.addLeaveForm.patchValue({
          description: res.description,
          leaveSubject: res.leaveSubject ? res.leaveSubject.title : res.leave_subject_text,

          startDate: moment(res.from_date),
          endDate: moment(res.to_date),

          leaveFromSlot: res.leave_from_slot,
          leaveToSlot: res.leave_to_slot,
        });

        this.getMyTeamsLeave(res.user_id, moment(res.from_date).format('YYYY-MM-DD'), moment(res.to_date).format('YYYY-MM-DD'));

        this.attachedDocumentsResData = res.attachments || [];
        this.leaveNoOfDaysCount = res.no_of_days;
        this.isEditingASandwichLeave = res.isSandwichLeave;
        if (this.isEditingASandwichLeave) {
          this.sandwichFromDate = res.sandwich_from_date.split('T')[0];
          this.sandwichToDate = res.sandwich_to_date.split('T')[0];
        }
        this.fromDate = res.from_date.split('T')[0];
        this.toDate = res.to_date.split('T')[0];
        this.checkLeavebalance(res.user_id);
        this.loadingCount -= this.loadingCount;
        if (this.loadingCount === 0) {
          this.spinnerService.hideSpinner();
        }
      },
      (error) => {
        this.loadingCount -= this.loadingCount;
        if (this.loadingCount === 0) {
          this.spinnerService.hideSpinner();
        }
      }
    );
  }

  getLeaveSubjects() {
    if (this.loadingCount === 0) {
      this.spinnerService.showSpinner();
    }
    this.loadingCount += this.loadingCount;

    this.leaveService.getLeaveSubjects().subscribe(
      (res: any) => {
        this.leaveSubjectsResData = res.data;

        this.filteredLeaveSubjectResData = this._addLeaveForm['leaveSubject'].valueChanges.pipe(
          startWith(''),
          map((value) => this._filterSubject(value || ''))
        );
        this.loadingCount -= this.loadingCount;
        if (this.loadingCount === 0) {
          this.spinnerService.hideSpinner();
        }
      },
      (error) => {
        this.loadingCount -= this.loadingCount;
        if (this.loadingCount === 0) {
          this.spinnerService.hideSpinner();
        }
      }
    );
  }

  private _filterSubject(value: string): any {
    const filterValue = value.toLowerCase();
    const filterArray = this.leaveSubjectsResData.filter((option: any) => option.title.toLowerCase().includes(filterValue));

    return filterArray;
  }
  approverUsers: any;
  getApproverUsersResData(user_id: number) {
    if (this.loadingCount === 0) {
      this.spinnerService.showSpinner();
    }
    this.loadingCount += this.loadingCount;

    this.leaveService.getApproverUsers(user_id.toString()).subscribe(
      (res) => {
        this.approverUsers = res.map((user: any) => ({
          ...user,
          avatar: user.employee_image,
        }));
        this.approverUsersData = res;

        this.loadingCount -= this.loadingCount;
        if (this.loadingCount === 0) {
          this.spinnerService.hideSpinner();
        }
      },
      (error) => {
        this.loadingCount -= this.loadingCount;
        if (this.loadingCount === 0) {
          this.spinnerService.hideSpinner();
        }
      }
    );
  }

  getLeaveBalance(user_id: number) {
    if (this.loadingCount === 0) {
      this.spinnerService.showSpinner();
    }
    this.loadingCount += this.loadingCount;

    this.leaveService.getLeaveBalance(user_id.toString()).subscribe(
      (res: any) => {
        res.data.forEach((item: any) => {
          if (item.leave_type == 'CL') {
            this.availableBalance.CL = item.current_balance;
          }
          if (item.leave_type == 'PL') {
            this.availableBalance.PL = item.current_balance;
          }
        });
        this.loadingCount -= this.loadingCount;
        if (this.loadingCount === 0) {
          this.spinnerService.hideSpinner();
        }
      },
      (error) => {
        this.loadingCount -= this.loadingCount;
        if (this.loadingCount === 0) {
          this.spinnerService.hideSpinner();
        }
      }
    );
  }

  getMyTeamsLeave(user_id: number, from_date: string, to_date: string) {
    // this.selectedLeaveUser ? this.selectedLeaveUser.id.toString() : this.loggedInUserId.toString()
    // if (this.loadingCount === 0) {
    //   this.spinnerService.showSpinner();
    // }
    this.loadingCount += this.loadingCount;
    this.leaveService.getMyTeamsLeave(from_date, to_date, this.leaveId || '', user_id.toString()).subscribe((res: any) => {
      this.teamAlsoOnLeave = res.data.map((teamLeave: any) => ({
        user: teamLeave.user,
        fromDate: moment(teamLeave.from_date).format('DD/MM/YYYY'),
        toDate: moment(teamLeave.to_date).format('DD/MM/YYYY'),
        noOfDays: teamLeave.no_of_days,
      }));

      // this.loadingCount -= this.loadingCount;
      // if (this.loadingCount === 0) {
      //   this.spinnerService.hideSpinner();
      // }
    });
  }
  endDateStartAt: any = new Date();
  handleDateChange() {
    this.validateDate();
    this.showLeaveSlotFields = false;
    this._addLeaveForm['leaveFromSlot'].setValue('FD');
    this._addLeaveForm['leaveToSlot'].setValue('FD');

    let fromMoment: moment.Moment | null = this._addLeaveForm['startDate']?.value;
    let toMoment: moment.Moment | null = this._addLeaveForm['endDate']?.value;

    if (fromMoment instanceof Date) {
      fromMoment = moment(fromMoment.toISOString().split('T')[0]);
    }
    if (toMoment instanceof Date) {
      toMoment = moment(toMoment.toISOString().split('T')[0]);
    }
    if (isMoment(fromMoment) && !toMoment) {
      this.endDateStartAt = fromMoment.toDate();
    }
    if (isMoment(fromMoment) && isMoment(toMoment) && fromMoment.isSameOrBefore(toMoment)) {
      this.getMyTeamsLeave(
        this.selectedLeaveUser ? this.selectedLeaveUser.id : this.loggedInUserId,
        fromMoment.format('YYYY-MM-DD'),
        toMoment.format('YYYY-MM-DD')
      );
      this.fromDate = fromMoment.format('YYYY-MM-DD');
      this.toDate = toMoment.format('YYYY-MM-DD');
      this.checkLeavebalance(this.selectedLeaveUser ? this.selectedLeaveUser.id : this.loggedInUserId);
    }
  }

  //check that leave is not applied on holiday
  // checkIfLeaveAppliedOnHoliday(fromDate: moment.Moment, toDate: moment.Moment) {
  //   if (
  //     this.holidayList.find((holiday: any) => {
  //       return moment(holiday.festivalDate.toDateString()).isSame(fromDate) || moment(holiday.festivalDate).isSame(toDate);
  //     })
  //   ) {
  //     this.isLeaveAppliedOnHoliday = true;
  //   } else {
  //     this.isLeaveAppliedOnHoliday = false;
  //   }
  // }

  // // check that leave is not applied on saturday or sunday
  // checkIfLeaveAppliedOnWeekend(fromDate: moment.Moment, toDate: moment.Moment) {
  //   let fromDateDay = fromDate.toDate().getDay();
  //   let toDateDay = toDate.toDate().getDay();

  //   if (fromDateDay == 0 || fromDateDay == 6 || toDateDay == 0 || toDateDay == 6) {
  //     this.isLeaveAppliedOnWeekend = true;
  //   } else {
  //     this.isLeaveAppliedOnWeekend = false;
  //   }
  // }
  sandwichFromDate!: string;
  sandwichToDate!: string;
  checkLeavebalance(user_id: number) {
    let body: any;
    if (this.isSandwichLeave && (this._addLeaveForm['leaveFromSlot'].value !== 'FD' || this._addLeaveForm['leaveToSlot'].value !== 'FD')) {
      body = {
        from_date: this.sandwichFromDate,
        from_slot: this._addLeaveForm['leaveFromSlot'].value,
        to_date: this.sandwichToDate,
        to_slot: this._addLeaveForm['leaveToSlot'].value,
        sandwich_from_date: this.isSandwichLeave ? this.formatDate(this.checkBalanceResData.sandwich_from_date).format('YYYY-MM-DD') : null,
        sandwich_to_date: this.isSandwichLeave ? this.formatDate(this.checkBalanceResData.sandwich_to_date).format('YYYY-MM-DD') : null,
        isSandwichLeave: this.isSandwichLeave,
      };
    } else if (this.isEditingASandwichLeave) {
      body = {
        from_date: this.sandwichFromDate,
        from_slot: this._addLeaveForm['leaveFromSlot'].value,
        to_date: this.sandwichToDate,
        to_slot: this._addLeaveForm['leaveToSlot'].value,
        sandwich_from_date: this.isSandwichLeave ? this.formatDate(this.checkBalanceResData.sandwich_from_date).format('YYYY-MM-DD') : null,
        sandwich_to_date: this.isSandwichLeave ? this.formatDate(this.checkBalanceResData.sandwich_to_date).format('YYYY-MM-DD') : null,
        isSandwichLeave: this.isSandwichLeave,
      };
    } else {
      body = {
        from_date: this.fromDate,
        from_slot: this._addLeaveForm['leaveFromSlot'].value,
        to_date: this.toDate,
        to_slot: this._addLeaveForm['leaveToSlot'].value,
        sandwich_from_date: this.isSandwichLeave ? this.formatDate(this.checkBalanceResData.sandwich_from_date).format('YYYY-MM-DD') : null,
        sandwich_to_date: this.isSandwichLeave ? this.formatDate(this.checkBalanceResData.sandwich_to_date).format('YYYY-MM-DD') : null,
        isSandwichLeave: this.isSandwichLeave,
      };
    }
    // if (this.loadingCount === 0) {
    //   this.spinnerService.showSpinner();
    // }
    // this.loadingCount += this.loadingCount;

    // console.log('check bal', 'seleceted user', this.selectedLeaveUser);
    // this.selectedLeaveUser ? this.selectedLeaveUser.id.toString() : this.loggedInUserId.toString(),
    this.leaveService.checkLeaveBalance(body, user_id.toString(), this.leaveId ? this.leaveId : '').subscribe(
      (res: any) => {
        if (res.data) {
          if (this.isEditingASandwichLeave) {
            this.isEditingASandwichLeave = false;
          }
          this.isSandwichLeave = res.data.isSandwichLeave;
          this.isLeaveInBetweenAvailable = res.data.isLeaveAvailable;

          this.checkBalanceResData = res.data;
          if (this.isSandwichLeave) {
            this._addLeaveForm['startDate']?.setValue(this.formatDate(res.data.sandwich_from_date));
            this._addLeaveForm['endDate']?.setValue(this.formatDate(res.data.sandwich_to_date));
            this.sandwichFromDate = this.formatDate(res.data.from_date).format('YYYY-MM-DD');
            this.sandwichToDate = this.formatDate(res.data.to_date).format('YYYY-MM-DD');
            this.fromDate = this.formatDate(res.data.sandwich_from_date).format('YYYY-MM-DD');
            this.toDate = this.formatDate(res.data.sandwich_to_date).format('YYYY-MM-DD');
          } else {
            this._addLeaveForm['startDate']?.setValue(this.formatDate(res.data.from_date));
            this._addLeaveForm['endDate']?.setValue(this.formatDate(res.data.to_date));
            this.fromDate = this.formatDate(res.data.from_date).format('YYYY-MM-DD');
            this.toDate = this.formatDate(res.data.to_date).format('YYYY-MM-DD');
          }

          this.leaveNoOfDaysCount = res.data.no_of_days;
          this.showLeaveSlotFields = true;

          if (this.isSandwichLeave) {
            if (this.sandwichFromDate == this.sandwichToDate) {
              this.isSingleDayLeave = true;
              this.leaveDateString = moment(this.sandwichFromDate).format('DD/MM/YYYY');
              this.singleDateOptions = [
                { value: 'FH', option: `First Half` },
                { value: 'SH', option: `Second Half` },
                { value: 'FD', option: `Full` },
              ];
            } else {
              this.isSingleDayLeave = false;
              this.fromDateString = moment(this.sandwichFromDate).format('DD/MM/YYYY');
              this.toDateString = moment(this.sandwichToDate).format('DD/MM/YYYY');

              this.fromDateSlotOptions = [
                { value: 'SH', option: `Second Half` },
                { value: 'FD', option: `Full` },
              ];

              this.toDateSlotOptions = [
                { value: 'FH', option: `First Half` },
                { value: 'FD', option: `Full` },
              ];
            }
          } else {
            if (this.fromDate == this.toDate) {
              this.isSingleDayLeave = true;
              this.leaveDateString = moment(this.fromDate).format('DD/MM/YYYY');
              this.singleDateOptions = [
                { value: 'FH', option: `First Half` },
                { value: 'SH', option: `Second Half` },
                { value: 'FD', option: `Full` },
              ];
            } else {
              this.isSingleDayLeave = false;
              this.fromDateString = moment(this.fromDate).format('DD/MM/YYYY');
              this.toDateString = moment(this.toDate).format('DD/MM/YYYY');

              this.fromDateSlotOptions = [
                { value: 'SH', option: `Second Half` },
                { value: 'FD', option: `Full` },
              ];

              this.toDateSlotOptions = [
                { value: 'FH', option: `First Half` },
                { value: 'FD', option: `Full` },
              ];
            }
          }

          this._addLeaveForm['leaveFromSlot'].setValue(res.data.from_slot);
          this._addLeaveForm['leaveToSlot'].setValue(res.data.to_slot);

          this.isDocumentRequired = res.data.isDocumentRequired;
          this.isDateAvailable = res.data.isDateAvailable;

          this.isFromSlotAvailable = res.data.isFromSlotAvailable;
          this.isToSlotAvailable = res.data.isToSlotAvailable;
          this.isHoliday = res.data.isHoliday;
          this.isWeekend = res.data.isWeekend;
          this.balanceAfterBookLeave = res.data.balance;
        }

        // this.loadingCount -= this.loadingCount;
        // if (this.loadingCount === 0) {
        //   this.spinnerService.hideSpinner();
        // }
      },
      (error) => {
        // this.loadingCount -= this.loadingCount;
        // if (this.loadingCount === 0) {
        //   this.spinnerService.hideSpinner();
        // }
      }
    );
  }

  goBack() {
    this.location.back();
  }

  formatDate(date: string) {
    let date_arr = date.split('-');
    let day = date_arr[0];

    let month = date_arr[1];

    let year = date_arr[2];
    return moment(year + '-' + month + '-' + day);
  }

  handleSlotChange(e: any) {
    // if (e.value == 'FD') {
    //   this.leaveNoOfDaysCount += 0.5;
    // } else {
    //   this.leaveNoOfDaysCount -= 0.5;
    // }

    this.checkLeavebalance(this.selectedLeaveUser ? this.selectedLeaveUser.id : this.loggedInUserId);
  }

  handleSingleDaySlotChange(e: any) {
    this._addLeaveForm['leaveToSlot'].setValue(this._addLeaveForm['leaveFromSlot'].value);
    // if (e.value == 'FD') {
    //   this.leaveNoOfDaysCount = 1;
    // } else {
    //   this.leaveNoOfDaysCount = 0.5;
    // }

    this.checkLeavebalance(this.selectedLeaveUser ? this.selectedLeaveUser.id : this.loggedInUserId);
  }

  navigateToLeaveDashboard() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Are you sure you want to cancel ?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // this.router.navigate(['leave']);
        this.location.back(); // redirect to previous page
      }
    });
  }

  onSubmit() {
    this.addLeaveForm.markAllAsTouched();
    if (this.leaveId && this.isUserLeaveResponsiblePerson && !this._addLeaveForm['startDate']?.hasError('isEndDateLessThanStartDate')) {
      if (this._addLeaveForm['startDate'].value && this._addLeaveForm['endDate'].value) {
        this._addLeaveForm['startDate'].setErrors(null);
        this._addLeaveForm['endDate'].setErrors(null);
      } else {
        return;
      }
    }

    this.addLeaveForm.get('leaveSubject')?.setValue(this.addLeaveForm.value.leaveSubject.trim());
    if (this.addLeaveForm.valid) {
      let fromMoment: moment.Moment | null = this._addLeaveForm['startDate']?.value;
      let toMoment: moment.Moment | null = this._addLeaveForm['endDate']?.value;
      if (fromMoment instanceof Date) {
        fromMoment = moment(fromMoment.toISOString().split('T')[0]);
      }
      if (toMoment instanceof Date) {
        toMoment = moment(toMoment.toISOString().split('T')[0]);
      }

      if (isMoment(fromMoment) && isMoment(toMoment) && fromMoment.isAfter(toMoment)) {
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: { message: 'The Leave start date must be equal to or earlier than the end date.' },
          duration: 45000,
        });

        return;
      }
      if (!this.isSandwichLeave && this.isHoliday) {
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: { message: 'You cannot request leave for a holiday.' },
          duration: 45000,
        });

        return;
      }

      if (!this.isSandwichLeave && this.isWeekend) {
        // let fromDateDay = moment(this.fromDate).toDate().getDay();
        // let toDateDay = moment(this.toDate).toDate().getDay();

        // if (fromDateDay == 0 || fromDateDay == 6 || toDateDay == 0 || toDateDay == 6) {

        this._snackBar.openFromComponent(SnackbarComponent, {
          data: { message: 'You cannot request leave for weekends.' },
          duration: 45000,
        });

        return;
        // }
      }

      // if (!this.isDateAvailable) {
      //   this._snackBar.openFromComponent(SnackbarComponent, {
      //     data: { message: 'Leave has been already applied on this date.' },
      //     duration: 45000,
      //   });

      //   return;
      // }

      if (!this.isFromSlotAvailable) {
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: {
            message: 'A leave request has already been submitted for ' + moment(this.fromDate).format('DD/MM/YYYY'),
          },
          duration: 45000,
        });
        return;
      }

      if (!this.isToSlotAvailable) {
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: {
            message: 'A leave request has already been submitted for ' + moment(this.toDate).format('DD/MM/YYYY'),
          },
          duration: 45000,
        });
        return;
      }

      if (this.isLeaveInBetweenAvailable) {
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: {
            message: 'A leave request has already been applied within this date range.',
          },
          duration: 45000,
        });
        return;
      }

      if (this.isDocumentRequired && this.attachedDocuments.length == 0 && !this.attachedDocumentsResData.length) {
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: { message: 'Please attach supporting documents for your absence, such as travel tickets or medical certificates.' },
          duration: 45000,
        });

        return;
      }

      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: {
          title:
            'Are you sure you want to proceed with the leave request on the following dates?<br>' +
            moment(this.fromDate).format('DD/MM/YYYY') +
            ' - ' +
            moment(this.toDate).format('DD/MM/YYYY'),
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          const values = this.addLeaveForm.value;
          const formData = new FormData();

          formData.append('from_date', values.startDate.format('YYYY-MM-DD'));

          formData.append('leave_from_slot', values.leaveFromSlot);
          formData.append('to_date', values.endDate.format('YYYY-MM-DD'));
          formData.append('leave_to_slot', values.leaveToSlot);
          formData.append('no_of_days', this.leaveNoOfDaysCount.toString());
          formData.append('is_sandwich_leave', this.isSandwichLeave ? 'true' : 'false');
          if (this.isSandwichLeave) {
            formData.append('sandwich_from_date', this.sandwichFromDate);
            formData.append('sandwich_to_date', this.sandwichToDate);
          }

          const suggestedSubject = this.leaveSubjectsResData.find((subject: any) => subject.title == values.leaveSubject);
          if (suggestedSubject) {
            formData.append('leave_subject', suggestedSubject.id.toString());
            formData.append('leave_subject_text', '');
          } else {
            formData.append('leave_subject', '');
            formData.append('leave_subject_text', values.leaveSubject);
          }
          formData.append('leave_type', JSON.stringify(this.balanceAfterBookLeave));
          formData.append('description', values.description);

          if (this.leaveId) {
            formData.append('atteched_documents', JSON.stringify(this.attachedDocumentsResData));
          }

          this.attachedDocuments.forEach((document) => {
            formData.append('attachments', document);
          });

          formData.append('approved_required_from', JSON.stringify(this.approverUsersData));

          if (this.leaveId) {
            if (this.loadingCount === 0) {
              this.spinnerService.showSpinner();
            }
            this.loadingCount += this.loadingCount;
            this.isLeaveUpdated = true;
            this.addLeaveForm.markAsPristine();
            this.leaveService
              .updateLeave(formData, this.leaveId, this.selectedLeaveUser ? this.selectedLeaveUser.id.toString() : this.loggedInUserId.toString())
              .subscribe(
                (res: any) => {
                  this.loadingCount -= this.loadingCount;
                  if (this.loadingCount === 0) {
                    this.spinnerService.hideSpinner();
                  }
                  // this.router.navigate(['leave', 'view']);
                  this._snackBar.openFromComponent(SnackbarComponent, {
                    data: { message: res.message },
                  });
                },
                (error) => {
                  this.isLeaveUpdated = false;
                  this.loadingCount -= this.loadingCount;
                  if (this.loadingCount === 0) {
                    this.spinnerService.hideSpinner();
                  }
                  this._snackBar.openFromComponent(SnackbarComponent, {
                    data: { message: error.error.message },
                    duration: 45000,
                  });
                }
              );
          } else {
            if (this.loadingCount === 0) {
              this.spinnerService.showSpinner();
            }
            this.loadingCount += this.loadingCount;
            this.leaveService
              .addLeave(formData, this.selectedLeaveUser ? this.selectedLeaveUser.id.toString() : this.loggedInUserId.toString())
              .subscribe(
                (res: any) => {
                  this.loadingCount -= this.loadingCount;
                  if (this.loadingCount === 0) {
                    this.spinnerService.hideSpinner();
                  }
                  if (this.previousUrl) {
                    // this.location.back();
                    this.router.navigate(['leave', 'approval']);
                  } else {
                    this.router.navigate(['leave', 'view']);
                  }
                  this._snackBar.openFromComponent(SnackbarComponent, {
                    data: { message: res.message },
                  });
                },
                (error) => {
                  this.loadingCount -= this.loadingCount;
                  if (this.loadingCount === 0) {
                    this.spinnerService.hideSpinner();
                  }
                  this._snackBar.openFromComponent(SnackbarComponent, {
                    data: { message: error.error.message },
                    duration: 45000,
                  });
                }
              );
          }
        }
      });
    }
  }

  //handle document upload -------------------------------start---------------------------------------
  onDragover(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  // Dragleave listener
  onDragLeave(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  onDrop(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    // console.log(evt.dataTransfer.files);

    for (const file of evt.dataTransfer.files) {
      if (file instanceof File) {
        if (this.attachedDocuments.find((item: any) => item.name == file.name)) {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: `A file with the same name has already been uploaded.` },
            duration: 45000,
          });
          return;
        }
        const isValid =
          this.globalService.checkFileSize(file, 5) && this.globalService.checkFileType(file, this.globalService.leaveDocumentsFileTypes);

        if (isValid) {
          let fileSize = 0;
          this.attachedDocumentsResData.forEach((doc: any) => {
            fileSize = fileSize + (doc.size || 0);
          });
          this.attachedDocuments.forEach((file) => {
            fileSize = fileSize + file.size;
          });
          fileSize = fileSize + file.size;

          if (Math.floor(fileSize / 1024 / 1024) > 25) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: 'The total size of all documents should not exceed 25 MB.' },
              duration: 45000,
            });
          } else if (this.attachedDocuments.length + (this.attachedDocumentsResData ? this.attachedDocumentsResData.length : 0) > 9) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: 'You are not allowed to add more than 10 documents.' },
              duration: 45000,
            });
          } else {
            this.attachedDocuments.push(file);
            if (this.isLeaveUpdated && this.addLeaveForm.pristine) {
              this.addLeaveForm.markAsDirty();
            }
          }
        }
      }
    }
  }

  @HostListener('document:dragover', ['$event'])
  @HostListener('drop', ['$event'])
  onDragDropFileVerifyZone(event: any) {
    event.preventDefault();
    event.dataTransfer.effectAllowed = 'none';
    event.dataTransfer.dropEffect = 'none';
  }

  fileBrowseHandler(e: any) {
    for (const file of e.target.files) {
      if (file instanceof File) {
        if (this.attachedDocuments.find((item: any) => item.name == file.name)) {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: `A file with the same name has already been uploaded.` },
            duration: 45000,
          });
          return;
        }
        const isValid =
          this.globalService.checkFileSize(file, 5) && this.globalService.checkFileType(file, this.globalService.leaveDocumentsFileTypes);

        if (isValid) {
          let fileSize = 0;
          this.attachedDocumentsResData.forEach((doc: any) => {
            fileSize = fileSize + doc.size;
          });
          this.attachedDocuments.forEach((file) => {
            fileSize = fileSize + file.size;
          });
          fileSize = fileSize + file.size;

          if (Math.floor(fileSize / 1024 / 1024) > 25) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: 'The total size of all documents should not exceed 25 MB.' },
              duration: 45000,
            });
          } else if (this.attachedDocuments.length + (this.attachedDocumentsResData ? this.attachedDocumentsResData.length : 0) > 9) {
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: 'You are not allowed to add more than 10 documents.' },
              duration: 45000,
            });
          } else {
            this.attachedDocuments.push(file);
            if (this.isLeaveUpdated && this.addLeaveForm.pristine) {
              this.addLeaveForm.markAsDirty();
            }
          }
        }
      }
    }
  }

  clearFileInput() {
    this.fileInput.nativeElement.value = '';
  }
  getAndPreviewDocument(document: any) {
    this.documentService.getDocumentFile(document.path).subscribe((res) => {
      this.previewDocument(res as File);
    });
  }

  previewDocument(file: File) {
    const objectURL = URL.createObjectURL(file);
    const documentFile: any = this.sanitizer.bypassSecurityTrustUrl(objectURL);

    this.router.navigate([]).then((result) => {
      window.open(documentFile.changingThisBreaksApplicationSecurity, '_blank');
    });
  }

  removeAttachedFile(index: number) {
    this.attachedDocuments.splice(index, 1);
  }

  removeAttachedFileWhileEdit(index: number) {
    this.attachedDocumentsResData.splice(index, 1);
  }

  //handle document upload ---------------------------------------ends--------------------------------------
}
