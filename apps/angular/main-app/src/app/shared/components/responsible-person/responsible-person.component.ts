import { Component, OnInit, ViewChild, ElementRef, Input, EventEmitter, Output, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { MatAutocomplete, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';

import { ITeamMembersData } from '../../../core/model/projects/project.model';
import { environment } from '../../../../environments/environment';
import { log } from 'console';

@Component({
  selector: 'responsible-person',
  templateUrl: './responsible-person.component.html',
  styleUrls: ['./responsible-person.component.scss'],
})
// https://stackblitz.com/angular/dnbdkokmnelo?file=app%2Fchips-autocomplete-example.html
// https://blog.angular-university.io/angular-custom-form-controls/
export class ResponsiblePersonComponent implements OnInit, OnChanges {
  visible = true;

  baseUrl = environment.base_url;
  removable = true;
  opened = false;
  touched = false;
  disabled = false;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  dataCtrl = new FormControl();
  filteredData!: Observable<ITeamMembersData[]>;
  data: ITeamMembersData | undefined;
  allData!: ITeamMembersData[];

  @Input() dataId: any;
  @Input() placeholder!: string;
  @Input() teammembersList: any;
  @Input() isDisabledInputControl!: boolean;
  @Output() emmitSelectedTeamMates: EventEmitter<ITeamMembersData> = new EventEmitter();
  @Output() emmitTeamMembersTouched: EventEmitter<Object> = new EventEmitter();
  @ViewChild('dataInput') dataInput!: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete!: MatAutocomplete;
  @ViewChild('autocompleteTrigger') matACTrigger!: MatAutocompleteTrigger;
  @Input() placeHolderLabel = 'Responsible Person';
  @Input() viewAvatarOnly = false;
  @Input() showHtmlContentAsPlaceHolder = false;
  @Input() placeHolderHtml = '<i class="fa fa-plus"></i>';

  constructor() {}
  ngOnInit(): void {
    this.setTeamMembersData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['isDisabledInputControl']) {
      this.isDisabledInputControl = changes['isDisabledInputControl'].currentValue;
    }
  }
  setTeamMembersData() {
    this.allData = this.teammembersList.map((item: any) => ({
      id: item.id,
      name: item.first_name + ' ' + item.last_name,
      avatar: item.employee_image || item.avatar,
      designation: item.designation,
    }));
    this.filteredData = this.dataCtrl.valueChanges.pipe(
      startWith(null),
      map((item: string | null) => {
        return item ? this._filter(item) : this.allData?.slice();
      })
    );
    if (this.dataId) {
      this.data = this.allData.find((item) => item.id == this.dataId);
    }
  }

  getTeamData() {
    return this.data;
  }

  selectedRP(id: number) {
    this.data = this.allData.find((data) => data.id == id);
    this.emmitSelectedTeamMates.emit(this.data);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    // console.log(this.dataInput.nativeElement);
    this.dataInput.nativeElement.blur();
    const newValue = event.option.value;

    this.data = newValue;
    this.data ? (this.data.manuallySelected = true) : '';
    this.emmitSelectedTeamMates.emit(this.data);

    this.dataInput.nativeElement.value = '';
    this.dataCtrl.setValue(null);

    // keep the autocomplete opened after each item is picked.
  }

  private _filter(value: any): any {
    if (!value?.id) {
      const filterValue = value.toLowerCase();

      return this.allData.filter((item: ITeamMembersData) => item.name.toLowerCase().indexOf(filterValue) >= 0);
    }
  }

  writeValue() {
    // console.log();
  }

  registerOnChange(onChange: any) {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: any) {
    this.onTouched = onTouched;
  }

  markAsTouched() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
      this.emmitTeamMembersTouched.emit({ isTouched: this.touched });
    }
  }

  onChange = () => {
    // console.log();
  };

  onTouched = () => {
    // console.log();
  };
}
