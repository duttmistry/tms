import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from './../../../../environments/environment';
import { Subscription } from 'rxjs';
import { UserRole } from '../../../core/model/project-settings/project-settings.model';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { RoleService } from '../../../core/services/module/settings/role/role.service';
import { UserRoleService } from '../../../core/services/module/settings/user-role/user-role.service';
import { UserService } from '../../../core/services/module/users/users.service';
import { SelectionModel } from '@angular/cdk/collections';
import { StorageService } from '../../../core/services/common/storage.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { ACTION_CONSTANTS, PERMISSION_CONSTANTS } from '../../../core/services/common/constants';

@Component({
  selector: 'main-app-user-permissions',
  templateUrl: './user-role.component.html',
  styleUrls: ['./user-role.component.scss'],
})
export class UserRoleComponent implements OnInit, OnDestroy, AfterViewInit {
  //#region properties
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('inputSearch') inputSearch!: ElementRef;
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  imageBaseURL = environment.base_url;
  isSubmit = false;
  pageEvent!: PageEvent;
  searchTeamForm!: FormGroup;
  subscriptions: Subscription[] = [];
  requestObject = {
    page: 1,
    limit: 10,
    sortBy: 'first_name',
    orderBy: 'asc',
    search: '',
    role_id: '',
  };
  responseData: any = {};
  userList: any = new MatTableDataSource();
  userRoleList: UserRole[] = [];
  displayedColumns: string[] = ['name', 'employee_id', 'Role'];
  dataSource = new MatTableDataSource();
  emptyData = new MatTableDataSource([{ empty: 'row' }]);
  selection = new SelectionModel<any>(true, []); // your selection model
  selectedUerRoleId = null;
  sortByControl = new FormControl();
  public allowEdit!: boolean;
  showSpinner = true;
  //#endregion

  constructor(
    private userRoleService: UserRoleService,
    private roleService: RoleService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    private _liveAnnouncer: LiveAnnouncer,
    private spinnerService: SpinnerService,
    private storageService: StorageService,
    private permissionService: PermissionService,
    private router: Router,
    private renderer: Renderer2
  ) {
    this.initializeFormControls();
  }

  ngOnInit(): void {
    window.scroll(0, 0);
    this.getUsersList();
    this.getUserRoles();
    this.checkForActionPermission();
  }

  ngAfterViewInit() {
    // console.log();
    // setTimeout(() => {
    //   const paginatorIntl = this.paginator?._intl;
    //   paginatorIntl.nextPageLabel = 'Next Page';
    //   paginatorIntl.previousPageLabel = 'Previous Page';
    //   paginatorIntl.firstPageLabel = 'First Page';
    //   paginatorIntl.itemsPerPageLabel = 'Items per page';
    //   paginatorIntl.lastPageLabel = 'Last Page';
    // }, 500);
  }
  initializeFormControls() {
    this.searchTeamForm = this.formBuilder.group({
      searchTeam: ['', Validators.compose([Validators.minLength(3), Validators.maxLength(50)])],
    });
  }

  get getSearchTeam() {
    return this.searchTeamForm.controls;
  }

  // get list of users
  getUsersList() {
    this.showSpinner = true;
    this.subscriptions.push(
      this.userService.getUsersList(this.requestObject).subscribe(
        (response: any) => {
          if (response) {
            this.responseData = response.data || {};
            if (this.responseData && this.responseData.list && this.responseData.list.length > 0) {
              this.userList = this.responseData.list || [];
              this.userList = this.userList.filter((userObject: any) => userObject.is_active == true);
              this.userList.map((userObject: any) => {
                const id = userObject.id || '';
                let name = userObject.first_name || '';
                name = name + ' ' + userObject.last_name || '';
                const roleId = userObject.user_with_role.role_id || '';
                const userImage = userObject.employee_image || '';
                const employee_id = userObject.employee_id || '';
                Object.keys(userObject).forEach((key) => delete userObject[key]);
                userObject.id = id;
                userObject.name = name;
                userObject.role_id = roleId;
                userObject.userImage = userImage;
                userObject.employee_id = employee_id;
                userObject.selectedOption = roleId;
                userObject.isSelected = this.manageSelectedUsers(userObject) || false;
              });
              this.dataSource = new MatTableDataSource(this.userList);
              this.dataSource.sort = this.sort;
            } else {
              this.userList = [];
              this.dataSource = new MatTableDataSource(this.userList);
            }
          }
          this.spinnerService.hideSpinner();
          this.showSpinner = false;
        },
        (error) => {
          console.log('error:', error);
          this.spinnerService.hideSpinner();
          this.showSpinner = false;
        }
      )
    );
  }

  manageSelectedUsers(userObject: any) {
    if (this.selection.selected.length) {
      return this.selection.selected.some((elm) => elm.id == userObject.id);
    } else {
      return false;
    }
  }

  // get list of user roles
  getUserRoles() {
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.roleService.getAllRoles().subscribe(
        (response: any) => {
          if (response) {
            this.spinnerService.hideSpinner();
            if (response.data && response.data.length > 0) {
              this.userRoleList = response.data.sort((a: any, b: any) => a.title.localeCompare(b.title));
            }
          }
        },
        (error: any) => {
          this.spinnerService.hideSpinner();
          console.log('error:', error);
        }
      )
    );
  }

  getServerData(event: any) {
    this.requestObject.page = event.pageIndex + 1;
    this.requestObject.limit = event.pageSize || 10;
    this.getUsersList();
  }

  // return selected value true for default selected
  getSelectedValue(element: any) {
    return this.userRoleList.find((role) => role.id === element.role_id)?.title;
  }

  // handle user role change event
  onUserRoleChange(event: any, user: any) {
    if (this.allowEdit) {
      const eventValue = event.value;
      const role = this.userRoleList.find((role) => role.id == eventValue);
      if (role && role.id) {
        const body = {
          role_id: role?.id,
        };
        this.updateUserRole(body, user.id);
      }
    }
  }

  // update user role
  updateUserRole(body: any, userId: number) {
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.userRoleService.updateUserRole(body, userId).subscribe(
        (response: any) => {
          if (response) {
            this.spinnerService.hideSpinner();
            this.snackBar.open(response.message);
          }
        },
        (error) => {
          this.spinnerService.hideSpinner();
          console.log('error:', error);
        }
      )
    );
  }

  // search based on search term
  onSearch() {
    this.isSubmit = true;
    this.getSearchTeam?.['searchTeam'].markAsTouched();
    this.getSearchTeam?.['searchTeam'].updateValueAndValidity();

    if (this.searchTeamForm.valid && this.searchTeamForm?.controls['searchTeam'].value !== '') {
      const formValue = this.searchTeamForm.getRawValue();
      this.requestObject.search = formValue.searchTeam.trim() || '';
      this.requestObject.page = 1;
      this.getUsersList();
    }
  }

  // check if textbox is made empty, then call API
  onSearchKeyUp(event: any) {
    if (event?.target && !event?.target?.value) {
      this.requestObject.search = '';
      this.requestObject.page = 1;
      this.getUsersList();
    }
  }
  resetSearch() {
    this.getSearchTeam?.['searchTeam'].reset();
    this.getSearchTeam?.['searchTeam'].markAsUntouched();
    this.requestObject.search = '';
    this.requestObject.page = 1;
    this.getUsersList();
  }

  // built-in method to sort data
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  orderByName(sort: any) {
    const direction = sort._direction;
    const orderBy = sort.active === 'name' ? 'first_name' : sort.active;
    this.requestObject.sortBy = orderBy;
    this.requestObject.orderBy = sort._direction ? sort._direction : 'asc';
    if (direction == '') {
      sort._direction = 'asc';
    }
    this.getUsersList();
  }

  orderbyEmployeeId(sort: any) {
    const direction = sort.direction;
    const orderBy = sort.active;
    if (orderBy === this.requestObject.sortBy) {
      this.requestObject.orderBy = this.requestObject.orderBy === 'asc' ? 'desc' : 'asc';
    } else {
      this.requestObject.sortBy = orderBy;
      this.requestObject.orderBy = 'asc';
    }
    this.getUsersList();
    // const direction = sort._direction;
    // const orderBy = sort.active;
    // this.requestObject.sortBy = orderBy;
    // this.requestObject.orderBy = sort._direction ? sort._direction : 'asc';
    // if (direction == '') {
    //   sort._direction = 'asc';
    // }
    // this.getUsersList();
  }

  onSelectUserRole(event: any) {
    this.selectedUerRoleId = event.value || null;
  }

  // row select
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataSource?.data.forEach((row) => this.selection.select(row));
  }

  updateMultipleEmpRole() {
    this.spinnerService.showSpinner();
    if (this.selection && this.selection?.selected.length && this.selectedUerRoleId !== null) {
      const id = this.selection.selected.map((el) => el.id);
      this.userRoleService.updateMultipleUsersRole(id, this.selectedUerRoleId)?.subscribe(
        (res: any) => {
          this.snackBar.open(res.message);
          this.selection.clear();
          this.selectedUerRoleId = null;
          this.getUsersList();
        },
        (err) => {
          this.spinnerService.hideSpinner();
        }
      );
    } else {
      this.spinnerService.hideSpinner();
      this.snackBar.open('Please select user role');
    }
  }

  onSelectRow(evt: any, row: any) {
    evt ? this.selection.toggle(row) : null;
    row.isSelected = this.selection.isSelected(row);
  }

  isRowSelected(row: any) {
    return this.selection.isSelected(row);
  }

  onSortByRole(event: any) {
    if (event instanceof PointerEvent) {
      event.stopPropagation();
    }
    this.requestObject.role_id = this.sortByControl.value && this.sortByControl.value?.length ? this.sortByControl.value.map((m: any) => m.id) : '';

    this.requestObject.page = 1;
    this.getUsersList();
  }

  public checkForActionPermission() {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.allowEdit = this.permissionService.getModuleActionPermission(permission, 'permissions.users', ACTION_CONSTANTS.EDIT);
    } else {
      this.router.navigate(['unauthorized-access']);
    }
  }

  cancelMultipleEmpRoleUpdate() {
    const newList = this.userList.map((p: any) => (p.isSelected === true ? { ...p, isSelected: false } : p));
    this.dataSource = new MatTableDataSource(newList);
    this.selection.clear();
    this.selectedUerRoleId = null;
  }

  //Open Profile
  OpenProfile(element: any) {
    if (element?.id) {
      const id = Encryption._doEncrypt(element?.id.toString());
      this.router.navigate(['/users/profile', id], {
        queryParams: { r_url: 'list' },
      });
    }
  }
}
