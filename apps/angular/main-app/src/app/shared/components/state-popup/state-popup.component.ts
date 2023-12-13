import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, startWith, map } from 'rxjs';
import { StatusModel } from '../../../core/model/task/task.model';
import { Utility } from '../../../core/utilities/utility';

@Component({
  selector: 'main-app-state-popup',
  templateUrl: './state-popup.component.html',
  styleUrls: ['./state-popup.component.scss'],
})
export class StatePopupComponent implements OnInit {
  //#region properties
  isStateDialogOpen = false;
  filteredData!: Observable<any[]>;
  searchControl = new FormControl();
  @Output() selectionEmmiter: EventEmitter<any> = new EventEmitter();

  @Input()
  currentState: any;
  @Input() listInput: any;

  ngOnInit(): void {
    this.filteredData = this.searchControl.valueChanges.pipe(
      startWith(null),
      map((item: string | null) => {
        return item ? this._filter(item) : this.listInput?.slice();
      })
    );
  }

  selected(item: any) {
    this.selectionEmmiter.emit(item);
  }

  openStateDialog() {
    this.isStateDialogOpen = true;
  }

  private _filter(value: any): any[] {
    const filterValue = value.toLowerCase();

    return this.listInput.filter((item: any) => item.name.toLowerCase().indexOf(filterValue) >= 0);
  }
}
