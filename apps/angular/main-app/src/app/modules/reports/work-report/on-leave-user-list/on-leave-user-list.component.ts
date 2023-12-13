import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../../../core/services/module/tasks/task.service';
import { SpinnerService } from '../../../../core/services/common/spinner.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'main-app-tms-workspace-on-leave-user-list',
  templateUrl: './on-leave-user-list.component.html',
  styleUrls: ['./on-leave-user-list.component.scss'],
})
export class OnLeaveUserListComponent implements OnInit {
  //#region For Data member
  onLeaveUsersList: any = [];
  displayedColumns: string[] = ['user', 'tl', 'todaySlot', 'startDate', 'endDate'];
  dataSource = new MatTableDataSource<any>();
  emptyData = new MatTableDataSource([{ empty: 'row' }]);
  showSpinner = true;
  //#endregion

  //#region For Component Structure
  constructor(private taskService: TaskService, private spinnerService: SpinnerService) {}

  ngOnInit(): void {
    this.getOnLeaveUsersList();
  }

  //#endregion

  //#region Member Functiom

  // Get on leave users list
  public getOnLeaveUsersList() {
    this.showSpinner = true;
    this.spinnerService.showSpinner();
    this.taskService.getOnLeaveUsersList().subscribe(
      (response: any) => {
        if (response && response.data) {
          this.spinnerService.hideSpinner();
          this.onLeaveUsersList = response.data;
          this.dataSource = new MatTableDataSource(this.onLeaveUsersList);
        }
        this.showSpinner = false;
      },
      (err: any) => {
        this.showSpinner = false;
      }
    );
  }

  //#endregion
}
