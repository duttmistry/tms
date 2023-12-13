import { Component, Input, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
interface IUsersData {
  id: number;
  name: string;
  avatar: string;
  designation: string;
}
@Component({
  selector: 'user-filter',
  templateUrl: './user-filter.component.html',
  styleUrls: ['./user-filter.component.scss'],
})
// https://stackblitz.com/angular/dnbdkokmnelo?file=app%2Fchips-autocomplete-example.html
// https://blog.angular-university.io/angular-custom-form-controls/
export class UserFilterComponent implements AfterViewInit {
  ngAfterViewInit(): void {}
  userSearchControl = new FormControl('');

  @Input()
  label = '';
  @Input()
  allSelected: boolean = false;
  @Input()
  allUsersList: any = [];
  @Output()
  getSelectedUsers = new EventEmitter();
  filteredUsersList: any = [];

  selectedUsers: any = [];
  userFormControl: any = new FormControl([]);

  ngOnInit(): void {
    this.filteredUsersList = [...this.allUsersList];
    if (this.allSelected) {
      this.selectedUsers = [...this.filteredUsersList];
      this.userFormControl.patchValue(this.filteredUsersList);
    }
  }

  onUserCheckChangeOption(checkUser: any) {
    const index = this.selectedUsers.findIndex((user: any) => user.id === checkUser.id);
    if (index !== -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(checkUser);
    }
    this.userFormControl.patchValue([...this.selectedUsers]);
  }
  clearAssigneeFilter() {
    this.selectedUsers = [];
    this.userFormControl.patchValue([...this.selectedUsers]);
    this.getSelectedUsers.emit(this.selectedUsers);
  }

  filterList(eventArgs: any) {
    eventArgs.stopPropagation();
    this.filteredUsersList = this.allUsersList.filter((user: any) => user.name.toLowerCase().includes(eventArgs.target.value.toLowerCase()));
    this.userFormControl.patchValue([...this.selectedUsers]);
  }

  selectAllAsignee() {
    const additionalItems = this.filteredUsersList.filter((user: any) => this.selectedUsers.findIndex((_user: any) => _user.id === user.id) === -1);
    this.selectedUsers = [...this.selectedUsers, ...additionalItems];

    this.userFormControl.patchValue([...this.selectedUsers]);
  }

  unselcteAllAsignee() {
    const itemsAfterRemoved = this.selectedUsers.filter((user: any) => this.filteredUsersList.findIndex((_user: any) => _user.id === user.id) === -1);
    this.selectedUsers = [...itemsAfterRemoved];

    this.userFormControl.patchValue([...this.selectedUsers]);

    //this.getProjectidsWiseTaskList();
  }

  onPanelClose(eventArg: any) {
    console.log('onPanelClose', eventArg);
    if (!eventArg) {
      this.getSelectedUsers.emit(this.selectedUsers);
    }
  }

  // @Input()
  // allUsersList: IUsersData[] = [];
  // selectedUsers: IUsersData[] = [];
  // userSearchInputCtrl = new FormControl('');
  // userCtrl = new FormControl('');
  // filteredUsersList$: any;
  // @ViewChild('userSearchInput') userSearchInput!: ElementRef<HTMLInputElement>;
  // _base_url = environment.base_url;
  // @Output() emmitSelectedUser: EventEmitter<ITeamMembersData> = new EventEmitter();
  // @Output() emmitSaveUser: EventEmitter<ITeamMembersData[]> = new EventEmitter();
  // @Output() emmitDeletedUser: EventEmitter<ITeamMembersData> = new EventEmitter();

  // ngOnInit(): void {}
  // ngAfterViewInit(): void {
  //   this.filteredUsersList$ = this.userSearchInputCtrl.valueChanges.pipe(
  //     startWith(null),
  //     map((item: string | null) => {
  //       return item ? this._filterUsers(item) : this.allUsersList.slice();
  //     })
  //   );
  // }
  // openAuto(trigger: MatAutocompleteTrigger) {
  //   trigger.openPanel();
  //   this.userSearchInput.nativeElement.focus();
  // }
  // checkSelectedItem(item: IUsersData) {
  //   return this.selectedUsers.find((res: any) => res.id == item.id) ? true : false;
  // }

  // private _filterUsers(value: any): any {
  //   if (!value?.id) {
  //     const filterValue = value.toLowerCase();

  //     return this.allUsersList.filter((item: ITeamMembersData) => item.name.toLowerCase().indexOf(filterValue) >= 0);
  //   }
  // }

  // selected(value: IUsersData): void {
  //   const newValue = value;

  //   if (this.selectedUsers.find((user: any) => user.id == newValue.id)) {
  //     this.selectedUsers = [...this.selectedUsers.filter((user: any) => user.id !== newValue.id)];
  //     this.emmitDeletedUser.emit(newValue);
  //   } else {
  //     this.selectedUsers.push(newValue);
  //     this.emmitSelectedUser.emit(newValue);
  //   }

  //   this.userSearchInput.nativeElement.value = '';
  //   this.userSearchInputCtrl.setValue(null);
  // }

  // onSave() {
  //   this.emmitSaveUser.emit(this.selectedUsers);
  // }
}
