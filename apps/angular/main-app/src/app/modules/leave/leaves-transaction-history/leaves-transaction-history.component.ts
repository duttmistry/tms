import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { LeaveService } from '../../../core/services/module/leave/leave.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { Location } from '@angular/common';
import { FormControl, FormGroup } from '@angular/forms';

import moment from 'moment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from './../../../../environments/environment';
import { debounceTime, distinctUntilChanged, fromEvent, tap } from 'rxjs';
import { STORAGE_CONSTANTS } from '../../../core/services/common/constants';

@Component({
  selector: 'main-app-leaves-transaction-history',
  templateUrl: './leaves-transaction-history.component.html',
  styleUrls: ['./leaves-transaction-history.component.scss'],
})
export class LeavesTransactionHistoryComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['leaveType', 'credit', 'debit', 'remainingBalance', 'remarks', 'actionDateTime'];
  transactionHistoryDataSource = new MatTableDataSource();
  emptyData = new MatTableDataSource([{ empty: 'row' }]);
  limit: any = 10;
  totalPage: any;
  totalRecords: any;
  currentPage: any = 1;

  minDate = new Date('1900-01-01');
  transactionList: any[] = [];
  userId: any;
  userData: any;
  searchControl = new FormControl('');
  filterObject = {
    search: '',
    page: this.currentPage,
    limit: this.limit,
    toDate: '',
    fromDate: '',
    leaveType: '',
  };
  orderBy = 'asc';
  // leaveTypeControl = new FormControl('');
  leaveTypeList: any[] = ['PL', 'CL', 'LWP'];
  statusControl = new FormControl('');

  toDate: any;
  fromDate: any;
  filterDateGroup = new FormGroup({
    toDateControl: new FormControl(),
    fromDateControl: new FormControl(),
  });

  userInformation: any;
  isToDateError = false;
  isFromDateError = false;
  fullName: any;
  teamLeadName: any;
  projectManagerName: any;
  leaveBalance: any[] = [];
  baseUrl = environment.base_url;
  breadCrumb = '';
  @ViewChild('searchInput') searchInput!: ElementRef;
  showSpinner = true;
  showSpinnerUserDetails = true;
  constructor(
    private activatedRoute: ActivatedRoute,
    private leaveService: LeaveService,
    private spinnerService: SpinnerService,
    private location: Location,
    private router: Router
  ) {
    window.scroll(0, 0);
    this.breadCrumb = this.router.getCurrentNavigation()?.extras.state?.['data'];

    const id = this.activatedRoute.snapshot.params['id'] || null;
    const userData = JSON.parse(Encryption._doDecrypt(localStorage.getItem(STORAGE_CONSTANTS.USER_DATA) as any));
    this.userId = id !== null ? Encryption._doDecrypt(id) : userData.user_id;
  }
  ngAfterViewInit(): void {
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        debounceTime(1500),
        distinctUntilChanged(),
        tap((text) => {
          // console.log(this.searchInput.nativeElement.value);
        })
      )
      .subscribe((res) => {
        this.searchLeave();
      });
  }

  ngOnInit() {
    this.getLeaveTransactionsData();
    this.getUsersLeaveBalance(this.userId);
  }

  getLeaveTransactionsData() {
    this.showSpinner = true;
    this.filterObject.limit = this.limit;
    this.filterObject.page = this.currentPage;
    try {
      // const reqBody = {
      //   limit: this.limit,
      //   page: this.currentPage,
      // };
      this.leaveService.getLeaveTransactionsData(this.userId, this.filterObject).subscribe(
        (response: any) => {
          if (response && response?.data) {
            this.totalPage = response?.data?.totalPages || 0;
            this.limit = response?.data?.limit;
            this.totalRecords = response?.data?.totalRecords || 0;
            this.currentPage = response?.data?.currentPage || 1;
            this.transactionList = response?.data?.list || [];
            this.transactionHistoryDataSource = new MatTableDataSource(this.transactionList);
            this.showSpinner = false;
          } else {
            this.transactionList = [];
            this.transactionHistoryDataSource = new MatTableDataSource();
            this.showSpinner = false;
          }
          this.showSpinner = false;
        },

        (err) => {
          this.showSpinner = false;
          throw err;
        }
      );
    } catch (error) {
      console.log('error', error);
      this.showSpinner = false;
    }
  }

  resetAllFilters() {
    this.limit = 10;
    this.currentPage = 1;
    this.filterDateGroup.reset();
    // this.leaveTypeControl.reset();
    this.searchControl.reset();
    this.filterObject = {
      search: '',
      page: 1,
      limit: 10,
      toDate: '',
      fromDate: '',
      leaveType: '',
    };
    this.getLeaveTransactionsData();
  }

  onTransactionPageSelectionChange(event: any) {
    this.limit = event?.pageSize;
    this.currentPage = event.pageIndex + 1;

    this.getLeaveTransactionsData();
  }

  redirectBack() {
    this.location.back();
  }

  // check if textbox is made empty, then call API

  searchLeave() {
    this.limit = 10;
    this.currentPage = 1;
    this.filterObject.search = this.searchControl.value?.trim() || '';
    // console.log('filterObject', this.filterObject);
    this.getLeaveTransactionsData();
  }

  leaveOrderBy() {
    // console.log('workkk..', this.filterObject);
  }

  onFilterDateChange(event: any) {
    if (event instanceof PointerEvent) {
      event.stopPropagation();
    }
    let fromDateControl = this.filterDateGroup.controls['fromDateControl'];
    let toDateControl = this.filterDateGroup.controls['toDateControl'];
    if (fromDateControl.value && !toDateControl.value) {
      toDateControl.setErrors({
        endDateReq: true,
      });
      return;
    } else {
      toDateControl.setErrors(null);
    }
    this.limit = 10;
    this.currentPage = 1;

    if (
      fromDateControl.value &&
      toDateControl.value &&
      fromDateControl.value.isSameOrBefore(toDateControl.value) &&
      fromDateControl.valid &&
      toDateControl.valid
    ) {
      let from: any = fromDateControl.value;
      this.filterObject.fromDate = from ? from.format('YYYY-MM-DD') : '';
      let to: any = toDateControl.value;
      this.filterObject.toDate = to ? to.format('YYYY-MM-DD') : '';
    } else {
      this.filterObject.fromDate = '';
      this.filterObject.toDate = '';
    }
    // console.log('filterObject..', this.filterObject);
    this.getLeaveTransactionsData();
  }

  // onSelectType(event: any) {
  //   if (event instanceof PointerEvent) {
  //     event.stopPropagation();
  //   }
  //   this.limit = 10;
  //   this.currentPage = 1;
  //   this.filterObject.leaveType = this.leaveTypeControl.value || '';
  //   console.log('filterObject..', this.filterObject);
  //   this.getLeaveTransactionsData();
  // }

  // onSelectStatus() {
  //   this.filterObject.status = this.statusControl.value || '';
  //   console.log('filterObject..', this.filterObject);
  //   this.getLeaveTransactionsData();
  // }

  formateDate(date: string) {
    if (date && date != '') {
      return moment(date).format('DD/MM/YYYY hh:mm A');
    }
    return '-';
  }

  getUsersLeaveBalance(userId: string) {
    this.showSpinnerUserDetails = true;
    this.spinnerService.showSpinner();
    this.leaveService.getUsersLeaveBalance(userId).subscribe(
      (response: any) => {
        if (response && response.data) {
          this.userInformation = response?.data;
          this.fullName = response?.data?.first_name + ' ' + response?.data?.last_name || '-';
          this.teamLeadName = this.userInformation?.team_lead
            ? this.userInformation?.team_lead?.first_name + ' ' + this.userInformation?.team_lead?.last_name
            : '';
          this.projectManagerName = this.userInformation?.project_manager
            ? this.userInformation?.project_manager?.first_name + ' ' + this.userInformation?.project_manager?.last_name
            : '';
        } else {
          this.userInformation = {};
        }
        this.spinnerService.hideSpinner();
        this.showSpinnerUserDetails = false;
      },
      (error: any) => {
        this.spinnerService.hideSpinner();
        this.showSpinnerUserDetails = false;
      }
    );
  }
}
