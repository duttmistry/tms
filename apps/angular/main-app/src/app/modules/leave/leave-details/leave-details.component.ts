import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { DateRange, MatCalendar } from '@angular/material/datepicker';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { environment } from '../../../../../src/environments/environment';
import * as moment from 'moment';
import { DocumentsService } from '../../../core/services/module/documents/documents.service';
import { LeaveService } from '../../../core/services/module/leave/leave.service';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { Subscription } from 'rxjs';
import { StorageService } from '../../../core/services/common/storage.service';
import { el } from '@fullcalendar/core/internal-common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HolidayService } from '../../../core/services/module/holiday/holiday.service';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { LeaveApprovalDialogComponent } from '../leave-approval-dialog/leave-approval-dialog.component';
import { APPROVED, PENDING, REJECTED, STORAGE_CONSTANTS } from '../../../core/services/common/constants';
import { SiteSettingService } from '../../../core/services/common/site-setting.service';


@Component({
  selector: 'app-leave-details',
  templateUrl: './leave-details.component.html',
  styleUrls: ['./leave-details.component.scss'],
})
export class LeaveDetailsComponent implements OnInit, OnDestroy {
  _base_url = environment.base_url;
  attachments: any = [];
  leaveId: any;
  base_url = environment.base_url;
  dataSource = new MatTableDataSource<any>();
  emptyData = new MatTableDataSource([{ empty: 'row' }]);
  leaveDetails: any;
  displayedColumns = ['user', 'status', 'comment', 'time'];
  userId: number;
  leaveHistoryLogs: any;
  holidayList: any;
  showSpinner = true;
  // @ViewChild('previewCalendar') previewCalendar!: MatCalendar<any>;
  allDateDisabledFilter = (d: Date): boolean => {
    return false;
  };
  leaveApproverData: any;
  PENDING = PENDING;
  REJECTED = REJECTED;
  APPROVED = APPROVED;
  teamAlsoOnLeave: any;
  isUserLeaveResponsiblePerson = false;
  // selectedDateRange!: any;

  subscriptions: Subscription[] = [];
  constructor(
    private sanitizer: DomSanitizer,
    private documentService: DocumentsService,
    private activatedRoute: ActivatedRoute,
    private leaveService: LeaveService,
    private router: Router,
    private spinnerService: SpinnerService,
    private storageService: StorageService,
    private dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private location: Location,
    private holidayService: HolidayService,
    private siteSettingService: SiteSettingService,
  ) {
    window.scroll(0, 0);
    const user: any = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.USER_DATA);
    const currentUser = JSON.parse(Encryption._doDecrypt(user));
    this.userId = currentUser.user_id;
    this.getHolidayList();
  }

  fromDate!: string;
  toDate!: string;

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  ngOnInit(): void {
    let id = this.activatedRoute.snapshot.params['id'];
    if (id) {
      this.leaveId = Encryption._doDecrypt(id);
      this.getLeaveDetails();
      this.checkIfUserIsLeaveResponsiblePerson();
    } else {
      this.router.navigate(['leave', 'view']);
    }
  }
  showApprovalButtons = false;

  navigateToLeaveHistory() {
    this.router.navigate(['leave', 'history', Encryption._doEncrypt(this.leaveDetails.user.id.toString())], { state: { data: 'Profile' } });
  }

  goBack() {
    this.location.back();
  }

  getHolidayList() {
    this.holidayService.getAllHoliday({ year: 2023 }).subscribe((res) => {
      if (res && res.length == 0) {
        return;
      }
      this.holidayList = res.list.map((holiday: any) => ({
        festivalName: holiday.title,
        festivalDate: moment(holiday.eventDate).format('YYYY-MM-DD'),
        day: moment(holiday.eventDate).format('dddd'),
        isHoliday: holiday.isHoliday,
      }));
    });
  }
  getLeaveDetails() {
    this.showSpinner = true;
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.leaveService.getLeaveDetailsById(this.leaveId).subscribe(
        (data) => {
          this.spinnerService.hideSpinner();
          // console.log(new Date(data.from_date));
          let user = data.leaveApproval.find((user: any) => this.userId == user.user_id);

          let approvalReq = data.approved_required_from && data.approved_required_from.find((id: number) => id == this.userId);

          if (approvalReq) {
            let alreadyApproved = data.approved_by && data.approved_by.find((id: number) => id == this.userId);

            if (alreadyApproved) {
              this.showApprovalButtons = false;
            } else {
              this.showApprovalButtons = true;
            }
          }
          this.leaveHistoryLogs = data.leaveHistoryLog.map((data: any) => ({
            ...data,
            updated_at: moment(data.updated_at).format('DD/MM/YYYY, h:mm a'),
            updated_values:(data?.updated_values && data?.updated_values.length > 0) ? data?.updated_values.map((updated: any) => ({
              ...updated,
              newValue: (updated.key === 'attachments') ? updated.newValue.map((attachment: any) => ({
                ...attachment,
                name:attachment.path.split('/').pop(),
                size: Math.round(attachment.size / 1000) + ' kb'
              })) : updated.newValue,
              oldValue:(updated.key === 'attachments') ? updated.oldValue.map((attachment: any) => ({
                ...attachment,
                name:attachment.path.split('/').pop(),
                size: Math.round(attachment.size / 1000) + ' kb'
              })) : updated.oldValue,
             })).reverse():''
          })).reverse();
          
          // console.log('%c   this.leaveHistoryLogs:', 'color: #0e93e0;background: #aaefe5;',  this.leaveHistoryLogs);

          this.leaveDetails = {
            startDate: moment(new Date(data.from_date)).format('DD/MM/YYYY') + ' ' + '(' + data.leave_from_slot + ')',
            endDate: moment(new Date(data.to_date)).format('DD/MM/YYYY') + ' ' + '(' + data.leave_to_slot + ')',
            appliedDate: moment(new Date(data.requested_date)).format('DD/MM/YYYY'),
            noOfDays: data.no_of_days,
            leaveSubject: data.leaveSubject ? data.leaveSubject.title : data.leave_subject_text,
            leaveType: this.formatLeaveType(data.leaveTypes),
            description: data.description,
            reason: data.comments,
            user: {
              ...data.user,
              avatar: data.user.employee_image,
            },
            status: data.status,
            isDatePassed: moment(data.to_date.split('T')[0]).isBefore(new Date().toISOString().split('T')[0], 'day'),
            id: data.id,
            approvarStatus: user ? user.status : '',
          };
          // console.log("DATA",data)
          // console.log("THIS LEAVEDETAILS",this.leaveDetails)
          this.getMyTeamsLeave(data.from_date, data.to_date, this.leaveId.toString(), data.user_id.toString());

          this.leaveApproverData = data.leaveApproval.map((approver: any) => ({
            user: approver.user,
            status: approver.status,
            comment: approver.action_comment,
            time: approver.status == PENDING ? '-' : moment(new Date(approver.updated_at)).format('DD/MM/YYYY, h:mm a'),
          }));
          // console.log('%c  leaveApproverData:', 'color: #0e93e0;background: #aaefe5;', this.leaveApproverData);

          this.dataSource = new MatTableDataSource(this.leaveApproverData);

          this.getAttenchmentsFiles(data.attachments);
          this.fromDate = data.from_date.split('T')[0];
          this.toDate = data.to_date.split('T')[0];
          //this.selectedDateRange = new DateRange(moment(data.from_date), moment(data.to_date));
          //   this.previewCalendar._goToDateInView(moment(data.from_date), 'month');
          this.showSpinner = false;
        },
        (error) => {
          this.spinnerService.hideSpinner();
          this.showSpinner = false;
        }
      )
    );
  }

  formatLeaveType(leaveTypes: any) {
    let leave_type_string = '';
    if (leaveTypes && leaveTypes.length) {
      leaveTypes.forEach((leave: any, index: number) => {
        leave_type_string += (index !== 0 ? ', ' : '') + leave.leave_type + ' (' + leave.leave_days + ')';
      });
    }

    // console.log(leave_type_string);
    return leave_type_string;
  }

  getMyTeamsLeave(from_date: string, to_date: string, leave_id: string, user_id: string) {
    this.showSpinner = true;
    this.leaveService.getMyTeamsLeave(from_date, to_date, leave_id, user_id).subscribe(
      (res: any) => {
        this.teamAlsoOnLeave = res.data.map((teamLeave: any) => ({
          user: teamLeave.user,
          fromDate: moment(teamLeave.from_date).format('DD/MM/YYYY'),
          toDate: moment(teamLeave.to_date).format('DD/MM/YYYY'),
          noOfDays: teamLeave.no_of_days,
        }));
        this.showSpinner = false;
      },
      (err: any) => {
        this.showSpinner = false;
      }
    );
  }

  changeLeaveStatus(status: string, id: number) {
    const dialogRef = this.dialog.open(LeaveApprovalDialogComponent, {
      width: '450px',
      data: {
        status,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      // console.log(result);
      if (result || result == '') {
        this.spinnerService.showSpinner();

        this.leaveService
          .updateLeaveStatus(
            {
              status,
              action_comment: result,
            },
            id
          )
          .subscribe(
            (res: any) => {
              this._snackBar.open(res.message);
              this.spinnerService.hideSpinner();
              this.getLeaveDetails();
            },
            (error) => {
              this._snackBar.openFromComponent(SnackbarComponent, {
                data: { message: error?.message },
                duration: 45000,
              });
              // this._snackBar.open(error.message);
              this.spinnerService.hideSpinner();
            }
          );
      }
    });
  }

  getAndPreviewDocument(file_path: string) {
    // console.log(file_path);
    this.subscriptions.push(
      this.documentService.getDocumentFile(file_path).subscribe((res) => {
        // console.log(res);

        this.previewDocument(res as File);
      })
    );
  }

  getAttenchmentsFiles(attachments: string[]) {
    if (attachments && attachments.length) {
      
      attachments.forEach((attachment:any) => {
        // console.log('%c  attachments:', 'color: #0e93e0;background: #aaefe5;', attachments);
        this.subscriptions.push(
          this.documentService.getDocumentFile(attachment.path).subscribe((res) => {
            // console.log("RESPONSE IN GET ATTACHMENTS",res);

            this.attachments.push({
              name: attachment.path.split('/').pop(),
              size: Math.round(res.size / 1000) + ' kb',
              path:attachment.path,
            });
          })
        );
      });
    }
  }

  previewDocument(file: File) {
    // console.log("FILE",file);
    const objectURL = URL.createObjectURL(file);
    let documentFile: any = this.sanitizer.bypassSecurityTrustUrl(objectURL);

    this.router.navigate([]).then((result) => {
      window.open(documentFile.changingThisBreaksApplicationSecurity, '_blank');
    });
  }

  downloadDocument(file_path: string) {
    this.documentService.getDocumentFile(file_path).subscribe((res: any) => {
      // console.log(res);

      var a = document.createElement('a');
      a.href = URL.createObjectURL(res);
      a.download = file_path.split('/').pop() as string;
      // start download
      a.click();
    });
  }
  redirectToEditLeave(id: number) {
    this.router.navigate(['leave', 'edit', Encryption._doEncrypt(id?.toString())]);
  }
  ApproveRejectLeave(status: string, id: number) {
    const dialogRef = this.dialog.open(LeaveApprovalDialogComponent, {
      width: '450px',
      data: {
        status,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      // console.log(result);
      if (result || result == '') {
        this.spinnerService.showSpinner();
        // this.subscription.push(
          this.leaveService
            .updateLeaveStatus(
              {
                status,
                action_comment: result,
              },
              id
            )
            .subscribe(
              (res: any) => {
                this._snackBar.open(res?.message);
                this.spinnerService.hideSpinner();
                // this.getLeaveApprovalData();
                this.getLeaveDetails();
              },
              (error) => {
                this._snackBar.openFromComponent(SnackbarComponent, {
                  data: { message: error?.error?.message },
                  duration: 45000,
                });
                //   this._snackBar.open(error.message);
                this.spinnerService.hideSpinner();
              }
            )
        // );
      }
    });
  }
  checkIfUserIsLeaveResponsiblePerson() {
    this.siteSettingService.getModuleWiseSiteSettingsData('leave').subscribe((res: any) => {
      if (res.data) {
        let leaveRPData = res.data.find((data: any) => data.identifier == 'leave_reponsible_person');
        if (leaveRPData && leaveRPData.value) {
          if (leaveRPData.value.find((resp_id: number) => resp_id.toString() === this.userId.toString())) {
            this.isUserLeaveResponsiblePerson = true;
          } else {
            this.isUserLeaveResponsiblePerson = false;
          }
        }
      }
    });
  }

}
