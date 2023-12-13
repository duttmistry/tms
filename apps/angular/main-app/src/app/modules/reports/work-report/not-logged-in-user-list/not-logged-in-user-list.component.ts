import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ReportsService } from '../../../../core/services/module/reports/reports.service';
import { Encryption } from '@tms-workspace/encryption';
import { Router } from '@angular/router';
import { UserDetailsComponent } from '../../../../shared/components/user-details/user-details.component';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'main-app-tms-workspace-not-logged-in-user-list',
  templateUrl: './not-logged-in-user-list.component.html',
  styleUrls: ['./not-logged-in-user-list.component.scss'],
})
export class NotLoggedInUserListComponent implements OnInit, OnDestroy {
  //#region For Data member

  public notLoggedInUsersList: any = [];
  public displayedColumns: string[] = ['user', 'tl', 'reason', 'action'];
  public dataSource = new MatTableDataSource<any>();
  public emptyData = new MatTableDataSource([{ empty: 'row' }]);
  public showSpinner = true;
  public refetchDataFlag = false;
  public userId: any;
  public subscriptions: Subscription[] = [];
  //#endregion

  //#region For Component Structure

  constructor(private reportsService: ReportsService, private router: Router, private dialog: MatDialog) {
    this.reportsService.getNotLogInUserData().subscribe(
      (res) => {
        if (res) {
          this.notLoggedInUsersList = res;
          this.dataSource = new MatTableDataSource(this.notLoggedInUsersList);
          this.showSpinner = false;
        } else {
          this.notLoggedInUsersList = [];
          this.showSpinner = false;
        }
      },
      (erro: any) => {
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
        if (response && response.flag === true && response.componentName === 'notloginuser') {
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

  // This method used for navigate to add leave page
  navigateToAddLeavePage(userId: any) {
    if (userId) {
      userId = Encryption._doEncrypt(userId.toString());
      this.router.navigate(['/leave/add'], { queryParams: { rb: 'true', user_id: userId } });
    }
  }

  //This method used for show task details
  public openTaskDetails(userId: any) {
    const userObj = {
      flag: false,
      componentName: 'notloginuser',
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
