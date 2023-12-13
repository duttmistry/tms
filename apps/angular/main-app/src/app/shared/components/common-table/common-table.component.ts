import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import printJS from 'print-js';
import { ACTION_COLUMN } from '../../../core/services/common/constants';
import { UserService } from '../../../core/services/module/users/users.service';

@Component({
  selector: 'main-app-tms-workspace-common-table',
  templateUrl: './common-table.component.html',
  styleUrls: ['./common-table.component.scss'],
})
export class CommonTableComponent implements OnChanges {
  //#region properties
  @Input() listToBind: any;
  @Input() columns: any;
  @Input() totalRecords!: number;
  @Input() limit!: any;
  @Input() currentPage!: any;
  @Input() actionColumn: any;
  @Input() canDelete!: boolean;
  @Output() emmitData: EventEmitter<any> = new EventEmitter();
  @Output() editRecordEmitter: EventEmitter<any> = new EventEmitter();
  @Output() deleteRecordEmitter: EventEmitter<any> = new EventEmitter();
  loggedInUserId: number;
  list = new MatTableDataSource();
  columnsToBind: any = [];
  emptyData = new MatTableDataSource([{ empty: 'row' }]);
  //#endregion

  constructor(private userService: UserService) {
    this.loggedInUserId = this.userService.getLoggedInUserId();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes) {
      if (changes['listToBind'] && changes['listToBind'].currentValue) {
        this.list = new MatTableDataSource(changes['listToBind'].currentValue);
      }
      if (changes['columns'] && changes['columns'].currentValue) {
        this.columnsToBind = changes['columns'].currentValue;
        if (this.columnsToBind.includes('Action')) {
          const indexOfAction = this.columnsToBind.indexOf('Action');
          if (indexOfAction > -1) {
            this.columnsToBind.splice(indexOfAction, 1);
          }
        }
      }
      if (changes['actionColumn'] && changes['actionColumn'].currentValue) {
        this.columnsToBind.push(changes['actionColumn'].currentValue);
      }
    }

    console.log(this.listToBind, 'listToBind');
  }

  onPaginatorChangeEvent(event: any) {
    this.emmitData.emit({
      page: event.pageIndex + 1,
      pageSize: event.pageSize || 5,
    });
  }

  onEditRecord(data: any) {
    if (data) {
      this.editRecordEmitter.emit({ record: data });
    }
  }

  onDeleteRecord(data: any) {
    this.deleteRecordEmitter.emit({ recordId: data._id });
  }
  printTableRecords(listToPrint: any) {
    printJS({
      printable: listToPrint,
      properties: ['User', 'Start time', 'End time', 'Total time'],
      type: 'json',
      documentTitle: 'Work Time History',
    });
  }
}
