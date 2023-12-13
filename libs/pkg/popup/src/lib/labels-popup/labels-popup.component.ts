import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';

@Component({
  selector: 'tms-workspace-labels-popup',
  templateUrl: './labels-popup.component.html',
  styleUrls: ['./labels-popup.component.scss'],
})
export class LabelsPopupComponent implements OnInit, OnChanges {
  //#region  properties
  isShowCreateLabelTemplate = false;
  filteredItems!: Observable<any>;
  labelFormControl = new FormControl('', Validators.maxLength(25));
  labelToPass!: string;
  @Input() listInput: any;
  @Input() messageToCreateNewItem!: string;
  @Output() itemEmmiter: EventEmitter<any> = new EventEmitter();
  @Input() placeHolder = 'Search Section';
  @Input() isIntaskList = false;
  @Input() hasSelctedLables = false;
  //#endregion

  ngOnInit(): void {
    this.filteredItems = this.labelFormControl.valueChanges.pipe(
      startWith(null),
      map((item: any) => (item ? this._filter(item) : this.listInput.slice()))
    );

    // check if label does not exist then show create label template
    this.filteredItems.subscribe((filtered: any) => {
      if (filtered && filtered.length == 0) {
        this.isShowCreateLabelTemplate = true;
      } else {
        this.isShowCreateLabelTemplate = false;
      }
    });

    this.filteredItems.subscribe((response: any) => {
      this.labelToPass = response;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('changes', changes);
    this.listInput = changes['listInput']?.currentValue;
    this.hasSelctedLables = changes['hasSelctedLables']?.currentValue || this.hasSelctedLables;
    this.labelFormControl.patchValue(this.labelFormControl.value);
  }

  onSelectItem(item?: any) {
    let valueToEmit = '';
    if (this.labelToPass && this.labelToPass.length > 0) {
      if (item) {
        valueToEmit = item;
      } else if (this.labelToPass[0]) {
        valueToEmit = this.labelToPass[0];
      } else if (this.labelFormControl.value && this.labelFormControl.valid) {
        valueToEmit = this.labelFormControl.value;
      }
    } else if (this.labelFormControl.value && this.labelFormControl.valid) {
      valueToEmit = this.labelFormControl.value;
    }
    if (valueToEmit) {
      this.itemEmmiter.emit(valueToEmit);
      this.labelFormControl.patchValue('');
    }
  }

  private _filter(value: any): any {
    if (!value.id) {
      const filterValue = value.toLowerCase();
      return this.listInput.filter((itemObject: any) => itemObject.title.toLowerCase().includes(filterValue));
    } else {
      const filterValue = value.title.toLowerCase();

      return this.listInput.filter((listObject: any) => listObject.title.toLowerCase().includes(filterValue));
    }
  }
}
