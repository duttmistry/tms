import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ReportsService } from '../../../../core/services/module/reports/reports.service';
import { Encryption } from '@tms-workspace/encryption';
import { MatDialog } from '@angular/material/dialog';
import { UserDetailsComponent } from '../../../../shared/components/user-details/user-details.component';
import { Subscription } from 'rxjs';
@Component({
  selector: 'main-app-tms-workspace-logged-out-user-list',
  templateUrl: './logged-out-user-list.component.html',
  styleUrls: ['./logged-out-user-list.component.scss'],
})
export class LoggedOutUserListComponent implements OnInit, OnDestroy {
  //#region For Data member
  public loggedOutUsersList: any = [];
  public displayedColumns: string[] = ['user', 'tl', 'todaytotalwork', 'todayloginat', 'todaylogoutat'];
  public dataSource = new MatTableDataSource<any>();
  public emptyData = new MatTableDataSource([{ empty: 'row' }]);
  public showSpinner = true;
  public refetchDataFlag = false;
  public userId: any;
  public subscriptions: Subscription[] = [];
  //#endregion

  //#region For Component Structure
  constructor(private reportsService: ReportsService, private dialog: MatDialog) {
    this.reportsService.getLogoutUserData().subscribe(
      (res) => {
        if (res) {
          this.loggedOutUsersList = res;
          this.dataSource = new MatTableDataSource(this.loggedOutUsersList);
          this.showSpinner = false;
        } else {
          this.loggedOutUsersList = [];
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
        if (response && response.flag === true && response.componentName === 'logoutuser') {
          this.refetchDataFlag = true;
          this.openTaskDetails(response?.userId);
        } else {
          this.refetchDataFlag = false;
        }
      })
    );
  }

  //#endregion

  //#region Member Functiom
  //This method used for show task details
  public openTaskDetails(userId: any) {
    const userObj = {
      flag: false,
      componentName: 'logoutuser',
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
  //#endregion
}
