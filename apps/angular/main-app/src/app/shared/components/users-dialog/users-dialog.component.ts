import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { ITeamMembersData } from '../../../core/model/projects/project.model';
import { FormControl } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { UserService } from '../../../core/services/module/users/users.service';

@Component({
  selector: 'main-app-user-dialog',
  templateUrl: './users-dialog.component.html',
  styleUrls: ['./users-dialog.component.scss'],
})
export class UserDialogComponent implements OnInit {
  // #region properties
  @Input() searchText: any;
  @Input() listInput: any;
  @Input() isShowSearchBox!: boolean;
  @Output() emmitSelectedUser: EventEmitter<ITeamMembersData> = new EventEmitter();
  searchControl = new FormControl();
  filteredData!: Observable<ITeamMembersData[]>;
  nameToPass!: string;
  loggedInUser: any;
  @Input() isUsers = false;
  //#endregion

  constructor(private userService: UserService) {}
  ngOnInit(): void {
    // Find the logged-in user in the listInput
    const loggedInUserId = this.userService.getLoggedInUserId();
    this.loggedInUser = this.listInput.find((user: any) => user.id === loggedInUserId);

    // this.filteredData = this.searchControl.valueChanges.pipe(
    //   startWith(null),
    //   map((item: string | null) => {
    //     return item ? this._filter(item) : this.listInput?.slice();
    //   })
    // );
    this.filteredData = this.searchControl.valueChanges.pipe(
      startWith(null),
      map((item: string | null) => {
        const filteredList = item ? this._filter(item) : this.listInput?.slice();
        // Move the loggedInUser to the top of the list if it exists
        if (this.loggedInUser && this.isUsers) {
          const loggedInUserIndex = filteredList.findIndex((user: any) => user.id === this.loggedInUser.id);
          if (loggedInUserIndex > -1) {
            const [loggedInUser] = filteredList.splice(loggedInUserIndex, 1);
            filteredList.unshift(loggedInUser);
          }
        }
        return filteredList;
      })
    );
    this.filteredData.subscribe((response: any) => {
      this.nameToPass = response;
    });
  }

  private _filter(value: any): ITeamMembersData[] {
    const filterValue = value.toLowerCase();

    return this.listInput.filter((item: ITeamMembersData) => item.name.toLowerCase().indexOf(filterValue) >= 0);
  }

  onSelectUser(user?: any) {
    let valueToEmit: any;
    if (this.nameToPass && this.nameToPass.length > 0) {
      if (user) {
        valueToEmit = user;
      } else if (this.nameToPass[0]) {
        valueToEmit = this.nameToPass[0];
      } else if (this.searchControl.value) {
        valueToEmit = this.searchControl.value;
      }
    }
    this.emmitSelectedUser.emit(valueToEmit);
  }
}
