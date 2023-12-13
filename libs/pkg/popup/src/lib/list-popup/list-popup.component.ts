import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, startWith, map } from 'rxjs';

@Component({
  selector: 'tms-workspace-list-popup',
  templateUrl: './list-popup.component.html',
  styleUrls: ['./list-popup.component.scss'],
})
export class ListPopupComponent implements OnInit, OnChanges {
  isDialogOpen = false;
  searchControl = new FormControl();
  filteredData!: Observable<any[]>;
  data: any[] = [];
  allData!: any[];
  @Input()
  shareIconColor: any;
  @Input() loggedInUserId: any;
  @Input() showLabel = false;
  @Input() teamMembersList: any;
  @Input() dataId: any;
  @Input() authorizedUsers: any;
  @Output() emmitSelectedTeamMates: EventEmitter<any> = new EventEmitter();
  @Output() emmitDeletedTeamMates: EventEmitter<any> = new EventEmitter();
  @Output() emitIfPopupCancelled: EventEmitter<any> = new EventEmitter();
  @Input() currentUser: any;
  @Input() isDisplayUsers = false;
  @Input() createdBy: any;
  @ViewChild('searchInputRef') searchInputRef!: ElementRef;
  loggedInUserIdProperty: any;
  createdByProperty: any;
  isSelectAllChecked = false;
  isShowSelectAll = true;

  constructor(private _snackBar: MatSnackBar) {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['teamMembersList']) {
      this.setTeamMembersData();
    }
    if (changes['authorizedUsers'] && changes['authorizedUsers'].currentValue) {
      this.authorizedUsers = changes['authorizedUsers'].currentValue;
      this.setTeamMembersData();
    }
    if (changes) {
      if (changes['createdBy'] && changes['createdBy'].currentValue) {
        this.createdByProperty = changes['createdBy'].currentValue;
      }
      if (changes['loggedInUserId'] && changes['loggedInUserId'].currentValue) {
        this.loggedInUserIdProperty = changes['loggedInUserId'].currentValue;
      }
    }
  }

  ngOnInit(): void {
    this.setTeamMembersData();
  }

  setTeamMembersData() {
    if (this.teamMembersList && this.teamMembersList.length > 0) {
      this.allData = this.teamMembersList.map((item: any) => ({
        id: item.user.id,
        name: item.user.name,
        avatar: item.user.avatar,
      }));
      this.filteredData = this.searchControl.valueChanges.pipe(
        startWith(null),
        map((item: string | null) => {
          return item ? this._filter(item) : this.allData?.slice();
        })
      );
      // check if search control has any value then hide select all checkbox, else show it
      this.searchControl.valueChanges.subscribe((response: any) => {
        if (response) {
          this.isShowSelectAll = false;
        } else {
          this.isShowSelectAll = true;
        }
      });

      if (this.authorizedUsers && this.authorizedUsers.length > 0) {
        if (typeof this.authorizedUsers === 'string') {
          this.authorizedUsers = JSON.parse(this.authorizedUsers);
        }
        if (this.authorizedUsers && this.authorizedUsers.length > 0) {
          this.data = this.authorizedUsers.map((id: any) => {
            return this.allData.find((item: any) => {
              if (item.id === id) {
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
    }

    // check if data array and teammembers are of the same length, then set isSelectAllChecked = true, otherwise false
    if (
      this.data &&
      this.data.length > 0 &&
      this.teamMembersList &&
      this.teamMembersList.length > 0 &&
      this.data.length == this.teamMembersList.length
    ) {
      this.isSelectAllChecked = true;
    } else {
      this.isSelectAllChecked = false;
    }
  }

  openTeamDialog() {
    if (this.teamMembersList && this.teamMembersList.length > 0) {
      this.isDialogOpen = true;
      this.searchControl.reset();
    } else {
      this._snackBar.open('No team members available to share document with', '', {
        duration: 45000,
      });
    }
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
  checkSelectedItem(item: any) {
    let flag = false;
    if (this.data && this.data.length > 0) {
      flag = this.data.find((res) => res && res.id == item.id) ? true : false;
    }
    return flag;
  }
  selected(item: any): void {
    if (item && this.currentUser && item.id != this.currentUser.user.id) {
      const newValue = item;

      if (this.data.find((res) => res.id == newValue.id)) {
        this.data = [...this.data.filter((item) => item.id !== newValue.id)];

        // this.emmitDeletedTeamMates.emit(newValue);
      } else {
        this.data.push(newValue);
        // this.emmitSelectedTeamMates.emit(newValue);
      }
    } else {
      if (!this.currentUser) {
        const newValue = item;

        if (this.data.find((res) => res && res.id == newValue.id)) {
          this.data = [...this.data.filter((item) => item && item.id !== newValue.id)];
          this.emmitDeletedTeamMates.emit(newValue);
        } else {
          this.data.push(newValue);
          // this.emmitSelectedTeamMates.emit(newValue);
        }
      }
    }
    if (this.data.length > 0 && this.teamMembersList.length > 0 && this.data.length == this.teamMembersList.length) {
      this.onToggleSelectAll();
    } else {
      this.isSelectAllChecked = false;
    }
  }

  private _filter(value: any): any[] {
    const filterValue = value.toLowerCase();

    return this.allData.filter((item: any) => item.name.toLowerCase().indexOf(filterValue) >= 0);
  }

  // this method is used to toggle all team members based on 'select All' checkbox
  // if logged in user is not owner of of document, he/she can not toggle team members
  onToggleSelectAll() {
    // check if createdByProperty exists which means edit document mode
    if (this.createdByProperty) {
      if (this.loggedInUserIdProperty && this.createdByProperty && this.loggedInUserIdProperty == this.createdByProperty) {
        this.isSelectAllChecked = !this.isSelectAllChecked;
        const selectedTeamList: any = [];
        if (this.isSelectAllChecked) {
          if (this.teamMembersList && this.teamMembersList.length > 0) {
            this.teamMembersList.forEach((item: any) => {
              selectedTeamList.push(item.user);
            });
            this.data = selectedTeamList;
          }
        } else {
          this.data = [];
        }
      }
    } else {
      // no need to check if createdBy or logged in user is same or not
      this.isSelectAllChecked = !this.isSelectAllChecked;
      const selectedTeamList: any = [];
      if (this.isSelectAllChecked) {
        if (this.teamMembersList && this.teamMembersList.length > 0) {
          this.teamMembersList.forEach((item: any) => {
            selectedTeamList.push(item.user);
          });
          this.data = selectedTeamList;
        }
      } else {
        this.data = [];
      }
    }
  }

  onSaveSharedDocument() {
    this.emmitSelectedTeamMates.emit(this.data);
    this.isDialogOpen = false;
  }

  // this will emit isPopupCancelled = true to reinitialize the popup
  resetTeamData() {
    this.isDialogOpen = false;
    this.emitIfPopupCancelled.emit({ isPopupCancelled: true });
  }
}
