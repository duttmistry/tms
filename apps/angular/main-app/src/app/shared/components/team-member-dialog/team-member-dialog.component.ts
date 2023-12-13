import { Component, OnInit, ViewChild, SimpleChanges, ElementRef, Input, OnChanges, EventEmitter, Output, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ITeamMembersData } from '../../../core/model/projects/project.model';

@Component({
  selector: 'team-member-dialog',
  templateUrl: './team-member-dialog.component.html',
  styleUrls: ['./team-member-dialog.component.scss'],
})
// https://stackblitz.com/angular/dnbdkokmnelo?file=app%2Fchips-autocomplete-example.html
// https://blog.angular-university.io/angular-custom-form-controls/
export class TeamMemberDialogComponent implements OnInit, OnChanges {
  isDialogOpen = false;
  baseUrl = environment.base_url;
  searchControl = new FormControl();
  filteredData!: Observable<ITeamMembersData[]>;
  data: ITeamMembersData[] = [];
  allData!: ITeamMembersData[];
  disabledTeam: boolean = false;

  @Input() showLabel = false;
  @Input() disableSuperAdminUsers: boolean = false;
  @Input() teamMembersList: any;
  @Input() dataId: any;
  @Input() isDisabledTeam: any;
  @Input() responsiblePerson: any;

  @Output() emmitSelectedTeamMates: EventEmitter<ITeamMembersData> = new EventEmitter();

  @Output() emmitDeletedTeamMates: EventEmitter<ITeamMembersData> = new EventEmitter();

  @Input() currentUser: any;

  @ViewChild('searchInputRef') searchInputRef!: ElementRef;

  constructor() {}

  ngOnInit(): void {
    this.setTeamMembersData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['dataId']) {
      this.dataId = changes['dataId'].currentValue;

      if (this.dataId && this.dataId.length > 0) {
        if (this.allData && this.allData.length > 0) {
          this.data = this.dataId.map((id: any) => {
            return this.allData.find((item) => {
              if (item.id == id) {
                return true;
              } else {
                return false;
              }
            });
          });
        }
      } else {
        this.data = [];
      }
    }
    if (changes && changes['isDisabledTeam']) {
      this.disabledTeam = changes['isDisabledTeam'].currentValue;
    }
    if (changes && changes['responsiblePerson']) {
      if (changes['responsiblePerson'].currentValue) {
        if (this.data && this.data.length > 0) {
          this.data.forEach((personObject: any) => {
            if (personObject.id === changes['responsiblePerson'].currentValue) {
              personObject.isShowCloseButton = false;
            } else {
              personObject.isShowCloseButton = true;
            }
          });
        }
      }
    }

    // if (changes && changes['createdbyUserId']) {
    //   if (changes['createdbyUserId'].currentValue) {
    //     if (this.data && this.data.length > 0) {
    //       this.data.forEach((personObject: any) => {
    //         if (personObject.id === changes['createdbyUserId'].currentValue || personObject.id == this.responsiblePerson) {
    //           personObject.isShowCloseButton = false;
    //         } else {
    //           personObject.isShowCloseButton = true;
    //         }
    //       });
    //     }
    //   }
    // }
  }

  onattach() {
    // console.log(this.searchControl.i);
  }

  setTeamMembersData() {
    this.allData = this.teamMembersList.map((item: any) => ({
      id: item.id,
      name: item.first_name + ' ' + item.last_name,
      avatar: item.employee_image,
      designation: item.designation,
      role_id: item.user_with_role ? item.user_with_role?.role_id : '',
      teamLead: item.team_lead_name,
      projectManager: item.project_manager_name,
    }));

    this.filteredData = this.searchControl.valueChanges.pipe(
      startWith(null),
      map((item: string | null) => {
        return item ? this._filter(item) : this.allData?.slice();
      })
    );
    if (this.dataId && this.dataId.length > 0) {
      this.data = this.dataId.map((id: any) => {
        return this.allData.find((item) => {
          if (item.id == id) {
            return true;
          } else {
            return false;
          }
        });
      });
    } else {
      this.data = [];
    }
  }

  openTeamDialog() {
    this.isDialogOpen = true;
    document.querySelector('#scrollable-container')?.addEventListener('wheel', this.preventScroll, { passive: false });

    this.searchControl.reset();
  }

  preventScroll(e: any) {
    e.preventDefault();
    e.stopPropagation();

    return false;
  }

  onClosePopup() {
    this.isDialogOpen = false;
    document.querySelector('#scrollable-container')?.removeEventListener('wheel', this.preventScroll);
  }
  selectedTeamMembers(ids: number[]) {
    ids.forEach((id) => {
      if (!this.data.find((user) => user.id == id)) {
        let d = this.allData.find((data) => data.id == id);
        if (d) {
          this.data.push(d);
          this.emmitSelectedTeamMates.emit(d);
        }
      }
    });
  }

  getTeamData() {
    return this.data;
  }

  remove(id: number): void {
    const index = this.data.findIndex((res) => res?.id == id);
    let m = this.data[index] as any;
    this.data.splice(index, 1);
    m.manuallySelected = true;
    this.emmitDeletedTeamMates.emit(m);
  }

  checkSelectedItem(item: ITeamMembersData) {
    return this.data.find((res) => res?.id == item?.id) ? true : false;
  }

  selected(item: any): void {
    if (item && this.currentUser && item.id != this.currentUser.user.id) {
      const newValue = item;

      if (this.data.find((res) => res.id == newValue.id)) {
        this.data = [...this.data.filter((item) => item.id !== newValue.id)];
        newValue.manuallySelected = true;
        this.emmitDeletedTeamMates.emit(newValue);
        this.searchControl.reset();
      } else {
        this.data.push(newValue);
        newValue.manuallySelected = true;

        this.emmitSelectedTeamMates.emit(newValue);
        this.searchControl.reset();
      }
    } else {
      if (!this.currentUser) {
        if (item && item.id !== this.responsiblePerson && !(this.disableSuperAdminUsers && item.role_id == 1)) {
          const newValue = item;

          if (this.data.find((res) => res?.id == newValue?.id)) {
            this.data = [...this.data.filter((item) => item?.id !== newValue?.id)];
            newValue.manuallySelected = true;
            this.emmitDeletedTeamMates.emit(newValue);
            this.searchControl.reset();
          } else {
            newValue.isShowCloseButton = true;
            this.data.push(newValue);
            newValue.manuallySelected = true;
            this.emmitSelectedTeamMates.emit(newValue);
            this.searchControl.reset();
          }
        }
      }
    }
  }

  private _filter(value: any): ITeamMembersData[] {
    const filterValue = value.toLowerCase();

    return this.allData.filter((item: ITeamMembersData) => item.name.toLowerCase().indexOf(filterValue) >= 0);
  }
}
