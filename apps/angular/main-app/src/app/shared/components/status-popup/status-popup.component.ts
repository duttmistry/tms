import { AfterViewInit, Component, EventEmitter, OnInit, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { StatusModel } from '../../../core/model/task/task.model';
import { StatusService } from '../../../core/services/module/projects/status.service';
import { Utility } from '../../../core/utilities/utility';

@Component({
  selector: 'main-app-status-popup',
  templateUrl: './status-popup.component.html',
  styleUrls: ['./status-popup.component.scss'],
})
export class StatusPopupComponent implements OnInit {
  //#region properties

  isDialogOpen = false;
  searchControl = new FormControl();
  @Output() statusEmmiter: EventEmitter<any> = new EventEmitter();
  filteredData!: Observable<any[]>;
  @Input()
  currentStatus: any;
  @Input()
  allStatusList: any;
  @Input() listInput: any;
  @Input() placeholder: any = 'Search Status';

  constructor(private statusService: StatusService) {}

  //#endregion

  ngOnInit(): void {
    this.listInput = this.listInput
      ?.sort((item1: any, item2: any) => {
        const valItem1 = Utility.stateList.findIndex((item: any) => item?.value === item1?.state);
        const valItem2 = Utility.stateList.findIndex((item: any) => item?.value === item2?.state);
        if (valItem1 < valItem2) {
          return -1;
        }
        if (valItem1 > valItem2) {
          return 1;
        }
        return 0;
        
      })
      ?.map((item: any) => {
        const state = Utility.stateList.find((_item: any) => _item?.value === item?.state) || null;
        return {
          ...item,
          groupColor: state?.color || '',
          stateName: state?.title || '',
        };
      });
      //console.log(this.listInput);
    this.filteredData = this.searchControl.valueChanges.pipe(
      startWith(null),
      map((item: string | null) => {
        return item ? this._filter(item) : this.listInput?.slice();
      })
    );
  }

  openTeamDialog() {
    this.isDialogOpen = true;
    this.searchControl.reset();
  }

  selected(item: any) {
    console.log('item: ', item);
    this.statusEmmiter.emit(item);
    this.isDialogOpen = false;
  }

  private _filter(value: any): any[] {
    const filterValue = value.toLowerCase();

    return this.listInput.filter((item: any) => item.name.toLowerCase().indexOf(filterValue) >= 0);
  }
}
