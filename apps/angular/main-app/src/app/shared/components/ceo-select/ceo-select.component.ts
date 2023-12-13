import { Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { environment } from 'apps/angular/main-app/src/environments/environment';
import { Observable, map, startWith } from 'rxjs';
import { ITeamMembersData } from '../../../core/model/projects/project.model';
import { SiteSettingService } from '../../../core/services/common/site-setting.service';


@Component({
  selector: 'tms-workspace-ceo-select',
  templateUrl: './ceo-select.component.html',
  styleUrls: ['./ceo-select.component.scss'],
})
export class CeoSelectComponent {
  isDialogOpen = false;
  baseUrl = environment.base_url;
  searchControl = new FormControl();
  filteredData!: Observable<ITeamMembersData[]>;
  data: any[] = [];
  select = -1;
  allData!: ITeamMembersData[];
  disabledTeam: boolean = false;
  selectedMember: any; // To keep track of the selected member
  @Input() showLabel = false;
  @Input() disableSuperAdminUsers: boolean = false;
  @Input() teamMembersList: any;
  @Input() dataId: any;
  @Input() isDisabledTeam: any;
  @Input() responsiblePerson: any;
  @Input() module: any;
  selectedCheckbox = -1;
  @Output() emmitSelectedTeamMates: EventEmitter<ITeamMembersData> = new EventEmitter();

  @Output() emmitDeletedTeamMates: EventEmitter<ITeamMembersData> = new EventEmitter();

  @Input() currentUser: any;

  @ViewChild('searchInputRef') searchInputRef!: ElementRef;

  constructor(private siteSettingsService: SiteSettingService) {}

  ngOnInit(): void {
    this.setTeamMembersData();
    if(this.module == 'CEOProfile') {
      this.getCeoProfile();
    }
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
  getCeoProfile() {
    const id = 1;
    this.siteSettingsService.getCEOProfile(id).subscribe(
      (res: any) => {
        if (res) {
          // this.ceoProfileData = res;
          this.data = [
            {
              id: res?.user_id,
              name: res?.name,
              avatar: res?.profile,
            },
          ];
        }
      },
      (error) => {
        //  console.log('error: ', error);
      }
    );
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
      role_id: item.user_with_role.role_id,
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
      let d = this.allData.find((data) => data.id == id);
      if (d) {
        this.data.push(d);
        this.emmitSelectedTeamMates.emit(d);
      }
    });
  }

  getTeamData() {
    return this.data;
  }

  remove(id: number): void {
    const index = this.data.findIndex((res) => res.id == id);
    let m = this.data[index] as any;
    this.data.splice(index, 1);
    this.emmitDeletedTeamMates.emit(m);
  }

  checkSelectedItem(item: ITeamMembersData) {
    return this.data.find((res) => res.id == item.id) ? true : false;
  }

  selected(item: any): void {
    // console.log('newValue: ', item);
    if (item && this.currentUser && item.id != this.currentUser.user.id) {
      const newValue = item;

      if (this.data.find((res) => res.id == newValue.id)) {
        // this.data = [...this.data.filter((item) => item.id !== newValue.id)];
        this.data = [item];
        // console.log('this.data: ', this.data);
        
        this.emmitDeletedTeamMates.emit(newValue);
        this.searchControl.reset();
      } else {
        this.data.push(newValue);
        this.emmitSelectedTeamMates.emit(newValue);
        this.searchControl.reset();
      }
    } else {
      if (!this.currentUser) {
        if (item && item.id !== this.responsiblePerson && !(this.disableSuperAdminUsers && item.role_id == 1)) {
          const newValue = item;

          if (this.data.find((res) => res.id == newValue.id)) {
            // this.data = [...this.data.filter((item) => item.id !== newValue.id)];
            this.data = [];
            this.emmitDeletedTeamMates.emit(newValue);
            this.searchControl.reset();
          } else {
            newValue.isShowCloseButton = true;
            // this.data.push(newValue);
            this.data = [item];
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
