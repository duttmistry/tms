import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';

@Component({
  selector: 'tms-workspace-multi-user-selection-popup',
  templateUrl: './multi-user-selection-popup.component.html',
  styleUrls: ['./multi-user-selection-popup.component.scss'],
})
export class MultiUserSelectionPopupComponent implements OnInit {
  //#region properties
  searchControl = new FormControl();
  filteredItems!: Observable<any>;
  @Input() selectedList!: any[];
  @Input() listInput!: any[];
  @Output() emitList: EventEmitter<any> = new EventEmitter();
  //#endregion

  ngOnInit(): void {
    this.filteredItems = this.searchControl.valueChanges.pipe(
      startWith(null),
      map((item: any) => (item ? this._filter(item) : this.listInput.slice()))
    );
  }

  // emit event on check/uncheck
  selected(item: any) {
    this.emitList.emit(item);
  }

  // return boolean value based on already selected item or not
  checkSelectedItem(item: any) {
    let flag = false;
    if (this.selectedList && this.selectedList.length > 0) {
      flag = this.selectedList.find((res) => res && res.id == item.id) ? true : false;
    }
    return flag;
  }

  private _filter(value: any): any {
    if (!value.id) {
      const filterValue = value.toLowerCase();
      return this.listInput.filter((itemObject: any) => itemObject.name.toLowerCase().includes(filterValue));
    } else {
      const filterValue = value.title.toLowerCase();

      return this.listInput.filter((listObject: any) => listObject.name.toLowerCase().includes(filterValue));
    }
  }
}
