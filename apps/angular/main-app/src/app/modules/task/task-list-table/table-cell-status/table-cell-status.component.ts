import { Component, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { DynamicMatTableComponent, IDynamicCell, TableField, IRowEvent } from 'dynamic-mat-table';
@Component({
  selector: 'main-app-table-cell-status',
  templateUrl: './table-cell-status.component.html',
  styleUrls: ['./table-cell-status.component.scss'],
})
export class TableCellStatusComponent {
  @Input() onRowEvent!: EventEmitter<IRowEvent>;
  @Input() row: any;
  @Input() column!: TableField<any>;
  @Input() parent!: DynamicMatTableComponent<any>;
  currentState: any;
  public items = [
    { id: 1, name: 'To Do' },
    { id: 2, name: 'In Progress' },
    { id: 3, name: 'Development Done' },
    { id: 4, name: 'Query' },
    { id: 5, name: 'On Hold' },
    { id: 6, name: 'Deployed In Staging' },
    { id: 7, name: 'Deployed In Prod' },
    { id: 8, name: 'Resumbmitted' },
    { id: 9, name: 'Ready For Qa' },
    { id: 10, name: 'Complete' },
  ];


}
