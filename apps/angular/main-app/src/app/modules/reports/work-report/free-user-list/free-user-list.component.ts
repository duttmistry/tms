import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ReportsService } from '../../../../core/services/module/reports/reports.service';
import { Encryption } from '@tms-workspace/encryption';
import { UserDetailsComponent } from '../../../../shared/components/user-details/user-details.component';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
@Component({
  selector: 'main-app-tms-workspace-free-user-list',
  templateUrl: './free-user-list.component.html',
  styleUrls: ['./free-user-list.component.scss'],
})
export class FreeUserListComponent implements OnInit, OnDestroy {
  //#region For Data member
  public freeUsersList: any = [];
  public displayedColumns: string[] = ['id', 'user', 'tl', 'todaytotalwork', 'todayloginat', 'break', 'logout'];
  public dataSource = new MatTableDataSource<any>();
  public emptyData = new MatTableDataSource([{ empty: 'row' }]);
  @Input() loggedInUserId: any;
  @Output() handleUserButtonClicked = new EventEmitter<any>();
  public showSpinner = true;
  public refetchDataFlag = false;
  public userId: any;
  public subscriptions: Subscription[] = [];
  toatlWorkFromHome = 0;
  showOnlyWorkFromHomeUsers = false;
  totalRecordsCount = 0;
  //#endregion

  //#region For Component Structure
  constructor(private reportsService: ReportsService, private cd: ChangeDetectorRef, private dialog: MatDialog) {
    this.reportsService.getFreeUserData().subscribe(
      (res) => {
        if (res) {
          this.freeUsersList = res;
          this.dataSource = new MatTableDataSource(this.freeUsersList);
          this.showSpinner = false;
          this.totalRecordsCount = this.freeUsersList?.length || 0;
          this.toatlWorkFromHome = this.freeUsersList.filter((user: any) => user?.login_capture_data?.isWfo === false)?.length || 0;
        } else {
          this.freeUsersList = [];
          this.showSpinner = false;
        }
      },
      (err: any) => {
        this.showSpinner = false;
      }
    );
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
  ngOnInit(): void {
    this.subscriptions.push(
      this.reportsService.getUserIdWiseDataRefetch().subscribe((response: any) => {
        if (response && response.flag === true && response.componentName === 'freeuser') {
          this.refetchDataFlag = true;
          this.openTaskDetails(response?.userId);
        } else {
          this.refetchDataFlag = false;
        }
      })
    );
  }

  //#endregion

  //#region For Member Functiom

  //This method used for set user id and handle button clicked
  public logoutUser(user: any) {
    if (user) {
      this.reportsService.setUserData(user);
      this.handleUserButtonClicked.emit('logout');
    } else {
      // console.log('unable to get userId');
    }
  }
  //This method used for set task id
  public breakTime(user: any) {
    if (user) {
      this.reportsService.setUserData(user);
      this.handleUserButtonClicked.emit('breakTime');
    } else {
      // console.log('unable to get userId');
    }
  }

  //This method used for show task details
  public openTaskDetails(userId: any) {
    const userObj = {
      flag: false,
      componentName: 'freeuser',
      userId: userId,
    };
    try {
      //  this.userId = userId.toString();
      userId = Encryption._doEncrypt(userId.toString());
      this.reportsService.getUserIdWiseTaskDetails(userId).subscribe(
        (response: any) => {
          if (response?.data && response?.data?.length > 0) {
            if (!this.refetchDataFlag) {
              this.dialog.open(UserDetailsComponent, {
                disableClose: true,
              });
            }
            this.reportsService.setUserIdWiseTaskDetails(response.data);
            this.reportsService.setUserIdWiseDataRefetch(userObj);
          } else {
            // console.log('No Task');
            this.reportsService.setUserIdWiseTaskDetails([]);
            this.reportsService.setUserIdWiseDataRefetch(userObj);
          }
        },
        (err: any) => {
          this.reportsService.setUserIdWiseDataRefetch(userObj);
        }
      );
    } catch (err: any) {
      this.reportsService.setUserIdWiseDataRefetch(userObj);
    }
  }
  _OnShowOnlyWFHClick() {
    this.showOnlyWorkFromHomeUsers = true;
    const filteredData = this.freeUsersList.filter((user: any) => user?.login_capture_data?.isWfo === false);
    this.dataSource = new MatTableDataSource(filteredData);
    this.totalRecordsCount = filteredData?.length || 0;
  }
  _removeFilterWFHOnly() {
    this.showOnlyWorkFromHomeUsers = false;
    this.dataSource = new MatTableDataSource(this.freeUsersList);
    this.totalRecordsCount = this.freeUsersList?.length || 0;
  }
  //#endregion
}
