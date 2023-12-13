import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatChipEditedEvent, MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { TagsService } from '../../../core/services/module/settings/tags/tags.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { StorageService } from '../../../core/services/common/storage.service';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { ACTION_CONSTANTS, PERMISSION_CONSTANTS } from '../../../core/services/common/constants';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';

@Component({
  selector: 'main-app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss'],
})
export class TagsComponent implements OnInit {
  //#region Data member
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;
  public addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  public displayedColumns: string[] = ['id', 'title', 'action'];
  searchTag = new FormControl('', [Validators.minLength(2), Validators.maxLength(20), Validators.pattern(/^([\w.&\-#]+(?:\s[\w.&\-#]+)*)$/)]);
  public pageSizeOptions = [5, 10, 25, 100];
  public totalRecords: any;
  public limit = 10;
  public currentPage = 1;
  public addTags: any[] = [];
  public tagsList: any[] = [];
  public tags = new MatTableDataSource();
  emptyData = new MatTableDataSource([{ empty: 'row' }]);
  private isSnackBarOpen = false;
  @ViewChild('tagInput', { static: false }) tagInput!: ElementRef;

  public allowDelete!: boolean;
  public allowEdit!: boolean;
  public allowAdd!: boolean;

  isTagEdit = false;
  editTagControl = new FormControl('', Validators.required);
  @ViewChild('editTagInput', { static: false }) editTagInput!: ElementRef<HTMLInputElement>;
  editableTag: any;
  isSameTagOnEdit = false;
  isCancelButtonClicked = false;
  showSpinner = true;
  tagControl = new FormControl('', Validators.required);
  //#endregion

  //#region Component Structure Methods

  constructor(
    private _snackBar: MatSnackBar,
    private dialog: MatDialog,
    private tagsService: TagsService,
    private storageService: StorageService,
    private permissionService: PermissionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getTagsList();
    this.checkForActionPermission();
    if (!this.allowDelete || !this.allowEdit) {
      this.displayedColumns = ['id', 'title'];
    }
  }

  onPageSelectionChange(event: any) {
    this.limit = event?.pageSize;
    this.currentPage = event.pageIndex + 1;
    this.getTagsList();
  }
  onSearch() {
    if (this.searchTag.valid) {
      this.limit = 10;
      this.currentPage = 1;
      this.getTagsList();
    }
  }
  onSearchKeyUp(event: any) {
    if (event?.target && !event?.target?.value) {
      this.onSearch();
    }
  }

  validateAndSearch() {
    this.searchTag.updateValueAndValidity();
    this.searchTag.markAsTouched();
    if (this.searchTag.valid) {
      // Perform search action
      this.onSearch();
    }
  }

  resetSearch(event: MouseEvent) {
    event.stopPropagation();
    this.searchTag.reset();
  }

  //#endregion

  //#region Member Functiom

  public getTagsList() {
    this.showSpinner = true;
    this.tagsService
      .getTagsList({
        limit: this.limit,
        page: this.currentPage,
        search: this.searchTag.value?.trim() || '',
      })
      .subscribe(
        (res: any) => {
          if (res) {
            if (res.data && res.data.length == 0) {
              this.tagsList = [];
              this.tags = new MatTableDataSource<any>(this.tagsList);
              this.showSpinner = false;
              return;
            }
            this.tagsList = res.data.list;
            this.limit = res.data.limit;
            this.currentPage = res.data.currentPage;
            this.totalRecords = res.data.totalRecords;
            this.tags = new MatTableDataSource<any>(this.tagsList);
            this.showSpinner = false;
          }
        },
        (err: any) => {
          this.showSpinner = false;
        }
      );
  }

  // This methos used for add tags
  public add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our tags
    if (!value) {
      return;
    }
    if (value.length < 2 || value.length > 15) {
      this.checkLengthValidator();
      return;
    }
    if (!/^[a-zA-Z0-9\s&.\-#]+$/.test(value)) {
      this.checkAlphaNumericValidator();
      return;
    }
    if (this.addTags.some((el) => el.title === value)) {
      this.showExistingTagMessage();
      return;
    }

    this.addTags.push({ title: value });

    // Clear the input value
    event.chipInput.clear();
  }

  // This used for remove tags
  public remove(tag: any): void {
    const index = this.addTags.indexOf(tag);
    if (index >= 0) {
      this.addTags.splice(index, 1);
    }
  }

  //This method used for edit existing tags
  public edit(tag: any, event: MatChipEditedEvent) {
    const value = event.value.trim();

    if (!value) {
      this.remove(tag);
      return;
    }

    // Add your custom validation rules for edit mode here
    if (value.length < 2 || value.length > 15) {
      this.checkLengthValidator();
      return;
    }

    if (!/^[a-zA-Z0-9\s&.\-#]+$/.test(value)) {
      this.checkAlphaNumericValidator();
      return;
    }

    // Edit existing tags
    const index = this.addTags.indexOf(tag);
    if (index >= 0) {
      this.addTags[index].title = value;
    }
  }

  //This method used for delete data from the server
  onDeleteTag(id: number, name: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: `Are you sure you want to delete ${name} ?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (this.currentPage !== 1 && this.tags.data.length == 1) {
          this.currentPage--;
        }
        this.tagsService.deleteTag(id).subscribe((res: any) => {
          this.getTagsList();
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: res.message },
          });
        });
      }
    });
  }

  //This methos used for clear all the tags
  onCancel() {
    this.addTags = [];
    if (!this.isTagEdit) {
      this.tagInput.nativeElement.value = '';
    }
    this.isTagEdit = false;
    this.editTagControl.reset();
    this.isSameTagOnEdit = false;
    // Set the flag to true when the cancel button is clicked
    this.isCancelButtonClicked = true;
    this.tagControl.reset();
  }

  // This method used for save the tags from to the server
  public onSave() {
    if (this.tagControl.valid) {
      const tags = {
        tags:[{title:this.tagControl.getRawValue()}],
      };
      this.tagsService.addTags(tags).subscribe(
        (res: any) => {
          if (res) {
            if (res.success) {
              this._snackBar.openFromComponent(SnackbarComponent, {
                data: { message: res.message },
              });
              this.getTagsList();
            } else {
              this._snackBar.openFromComponent(SnackbarComponent, {
                data: { message: res.message },
                duration: 45000,
              });
            }
          }
          this.tagControl.reset();
          this.addTags = [];
        },
        (error) => {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: error.message },
            duration: 45000,
          });
        }
      );
    } else {
      this.checkEmptyValueMessage();
      return;
    }
  }

  public checkForActionPermission() {
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.allowAdd = this.permissionService.getModuleActionPermission(permission, 'site_settings.tags', ACTION_CONSTANTS.CREATE);
      this.allowEdit = this.permissionService.getModuleActionPermission(permission, 'site_settings.tags', ACTION_CONSTANTS.EDIT);
      this.allowDelete = this.permissionService.getModuleActionPermission(permission, 'site_settings.tags', ACTION_CONSTANTS.DELETE);
    } else {
      this.router.navigate(['unauthorized-access']);
    }
  }

  //#endregion

  //#region Edit Tags
  onEditTag(tag: any) {
    this.editableTag = tag;
    this.isTagEdit = true;
    this.isCancelButtonClicked = false;
    this.editTagControl.setValue(tag.title);
    setTimeout(() => {
      const inputElement = this.editTagInput.nativeElement;
      inputElement.focus();
      const inputValueLength = inputElement.value.length;
      inputElement.setSelectionRange(inputValueLength, inputValueLength);
      //  this.editTagInput.nativeElement.focus();
    });
  }

  onUpdateTags() {
    const tagValue = this.editTagControl?.value?.trim();
    this.isSameTagOnEdit = this.editableTag.title === this.editTagControl.value;

    //  Check for the validation rules
    if (this.isSameTagOnEdit) {
      this.showExistingTagMessage();
      return;
    }

    if (!tagValue || tagValue.length < 2 || tagValue.length > 15) {
      this.checkLengthValidator();
      return;
    }

    if (!/^[a-zA-Z0-9\s&.\-#]+$/.test(tagValue)) {
      this.checkAlphaNumericValidator();
      return;
    }

    if (this.editTagControl.valid && !this.isSameTagOnEdit) {
      const reqBody = {
        id: this.editableTag.id || null,
        title: this.editTagControl.value || '',
      };
      this.tagsService.updateTags(reqBody).subscribe((res: any) => {
        if (res && res.data) {
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: res.message },
          });
          this.getTagsList();
          this.editTagControl.reset();
          this.isTagEdit = false;
          this.isSameTagOnEdit = false;
          this.isCancelButtonClicked = true;
        }
      });
    }
  }
  //#region for validtion method
  public checkEmptyValueMessage() {
    if (!this.isSnackBarOpen) {
      this.isSnackBarOpen = true;
      this._snackBar
        .openFromComponent(SnackbarComponent, {
          data: { message: 'Please provide a value.' },
          duration: 45000,
        })
        .afterDismissed()
        .subscribe(() => {
          this.isSnackBarOpen = false;
        });
    }
  }

  public checkLengthValidator() {
    if (!this.isSnackBarOpen) {
      this.isSnackBarOpen = true;
      this._snackBar
        .openFromComponent(SnackbarComponent, {
          data: { message: 'Tags should be between 2 and 15 characters in length.' },
          duration: 45000,
        })
        .afterDismissed()
        .subscribe(() => {
          this.isSnackBarOpen = false;
        });
    }
  }

  public checkAlphaNumericValidator() {
    if (!this.isSnackBarOpen) {
      this.isSnackBarOpen = true;
      this._snackBar
        .openFromComponent(SnackbarComponent, {
          data: { message: 'Only alphanumeric characters are permitted for tags.' },
          duration: 45000,
        })
        .afterDismissed()
        .subscribe(() => {
          this.isSnackBarOpen = false;
        });
    }
  }
  //#endregion

  //#region for used common method

  public showExistingTagMessage() {
    if (!this.isSnackBarOpen) {
      this.isSnackBarOpen = true;
      this._snackBar
        .openFromComponent(SnackbarComponent, {
          data: { message: 'This tag already exists.' },
          duration: 45000,
        })
        .afterDismissed()
        .subscribe(() => {
          this.isSnackBarOpen = false;
        });
    }
  }
  //#endregion

  //#endregion
}
