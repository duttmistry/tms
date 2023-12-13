import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { Subscription } from 'rxjs';
import { StatusRequestModel } from '../../../../core/model/projects/status.model';
import { SpinnerService } from '../../../../core/services/common/spinner.service';
import { StatusService } from '../../../../core/services/module/projects/status.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SnackbarComponent } from '../../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { GlobalService } from '../../../../core/services/common/global.service';
import { Utility } from '../../../../core/utilities/utility';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss'],
})
export class StatusComponent implements OnInit, OnDestroy {
  projectId!: string;
  projectStatusResData: any = [];
  projectStatusAllData: any = [];
  statusForm!: FormGroup;

  showAddMoreStatusField = false;
  defaultColor = '#800101';
  projectState = Utility.stateList;
  presetColors: string[] = [];
  toggle = false;
  subscriptions: Subscription[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public dialog: MatDialog,
    private spinnerService: SpinnerService,
    private statusService: StatusService,
    private _snackBar: MatSnackBar,
    private globalService: GlobalService
  ) {
    this.presetColors = this.globalService.presetColors;
    this.initializeStatusForm();
  }

  ngOnInit(): void {
    // console.log('status component initialized');

    let id = this.activatedRoute.snapshot.paramMap.get('id');

    if (id) {
      this.projectId = Encryption._doDecrypt(id) as string;
      this.getAllState(this.projectId);
      this.getProjectStatusDataById(this.projectId);
    }
  }

  initializeStatusForm() {
    this.statusForm = this.formBuilder.group({
      statusArray: this.formBuilder.array([]),
    });
  }

  // get project status by project id
  getProjectStatusDataById(projectId: string) {
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.statusService.getAllStatuses(projectId).subscribe(
        (response: any) => {
          if (response) {
            if (response.data && response.data.length > 0) {
              this.projectStatusResData = response.data || [];
              this.projectStatusAllData = response.data || [];
              this.initializeDataIntoForm();
            }
            this.spinnerService.hideSpinner();
          }
        },
        (error) => {
          this.spinnerService.hideSpinner();
          console.log('error:', error);
        }
      )
    );
  }

  // once data is fetched, add in to Form Array
  initializeDataIntoForm() {
    if (this.projectStatusResData && this.projectStatusResData.length > 0) {
      // console.log('projectStatusResData', this.projectStatusResData);

      this.projectStatusResData.forEach((item: any) => {
        (this.statusForm.controls['statusArray'] as FormArray).push(
          this.formBuilder.group({
            state: [item.state],
            status: [item.title, Validators.required],
            id: [item.id],
          })
        );
      });
    }

    // console.log('initializeDataIntoForm', this.statusForm.value);
  }

  get _statusForm(): any {
    return this.statusForm.get('statusArray') as FormArray;
  }

  getAllState(projectId: string) {
    this.statusService.getAllState(projectId).subscribe((res: any) => {
      this.projectState.forEach((state) => {
        let obj = res.data && res.data.find((item: any) => item.state == state.value);
        // if (obj) {
        //   state.color = obj.color;
        // }
      });
    });
  }

  // make update API call on color change
  onColorPickerChange(stateValue: any, event: string) {
    // console.log('onColorPickerChange', event);

    this.statusService
      .updateStateColor({
        project_id: this.projectId,
        state: stateValue,
        color: event,
      })
      .subscribe((res: any) => {
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: { message: res.message || 'The state color has been updated successfully.' },
          duration: 45000,
        });
        let index = this.projectState.findIndex((state) => state.value == stateValue);
        // this.projectState[index].color = event;
      });

    // formGroup.get('color').setValue(event);
    // const formValue = formGroup.getRawValue();
    // const body: StatusRequestModel = {
    //   color: formValue.color || '',
    //   state: this.selectedState.toLocaleLowerCase().replace(' ', '') || '',
    //   title: formValue.status || '',
    // };
    // this.updateStatus(formValue.id.toString() || '', body);
  }

  // set value for add form selected color
  // onAddColorChange(event: string, control: any) {
  //   control.setValue(event);
  //   this.toggle = false;
  // }

  // state change event
  // selectState(event: any) {
  //   this.selectedState = event.tab.textLabel;
  //   this.tempStatusResData = this.projectSubStatusResData.filter(
  //     (statusObject: any) => statusObject.state == this.selectedState.toLocaleLowerCase().replace(' ', '')
  //   );
  //   this.initializeDataIntoForm();
  //   // on state change hide add status form
  //   this.showAddMoreStatusField = false;
  // }

  // toggle show more with Save and close button when row is being edited
  // onEdit(data: HTMLInputElement, elementData: any) {
  //   data.disabled = false;
  //   data.focus();
  // }

  // on add form blur event
  // addOnBlur(id: number) {
  //   const index = this.projectStatusResData.findIndex((item: any) => item.id == id);
  //   const statusValue = this.statusForm.controls['statusArray'].value;
  //   this.projectStatusResData[index] = statusValue.find((item: any) => item.id == id);
  // }

  // call update status API
  onStatusAddOrUpdate(formGroup: FormGroup) {
    let formValue = formGroup.getRawValue();
    formValue.status = formValue?.status?.trim();
    formGroup.setValue(formValue);
    if (formGroup.valid) {
      if (formValue.id) {
        const object = this.projectStatusAllData.find((item: any) => item.id == formValue.id);
        if (object?.title?.trim() != formValue?.status?.trim()) {
          const body: any = {
            state: formValue.state,
            title: formValue.status || '',
          };

          this.updateStatus(formValue.id.toString(), body, formGroup);
        }
      } else {
        const body: any = {
          state: formValue.state,
          title: formValue.status || '',
        };
        this.addStatus(body, formGroup);
      }
    }
  }

  // toggle show more when edited row is cancelled
  onCancelStatus(formGroup: FormGroup, index: number) {
    this._statusForm.removeAt(index);
  }

  // delete status
  openDeleteStatusDialog(event: any, formGroupObject: any) {
    event.stopPropagation();

    let stateData = this.projectStatusResData.filter((item: any) => item.state == formGroupObject.get('state').value);
    if (stateData && stateData.length > 1) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '500px',
        data: {
          title: `Are you sure you want to delete?`,
        },
      });

      this.subscriptions.push(
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.deleteStatusControl(formGroupObject.get('id').value);
          }
        })
      );
    } else {
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'This status can not be deleted.' },
      });
    }
  }

  deleteIconDisabled(formGroupObject: any) {
    let stateData = this.projectStatusResData.filter((item: any) => item.state == formGroupObject.get('state').value);
    if (stateData && stateData.length <= 1) {
      return true;
    } else {
      return false;
    }
  }

  // show add status form
  onAddMoreStatusClick(state: string) {
    // this.showAddMoreStatusField = true;
    // this.addStatusForm.reset();

    let formGroup = this.formBuilder.group({
      status: ['', Validators.required],
      state: state,
      id: null,
    });

    this._statusForm.push(formGroup);
  }

  // call update status API to update status
  updateStatus(statusId: string, body: StatusRequestModel, formGroup: FormGroup) {
    if (body && body.title) {
      this.spinnerService.showSpinner();
      this.subscriptions.push(
        this.statusService.updateStatus(this.projectId, statusId, body).subscribe(
          (response: any) => {
            if (response) {
              this.spinnerService.hideSpinner();
              if (response.status === 200) {
                this._snackBar.openFromComponent(SnackbarComponent, {
                  data: { message: response.message || 'The status has been updated successfully.' },
                });
                const changeStatus = this.projectStatusAllData?.findIndex((item: any) => item.id == response?.data?.id);
                this.projectStatusAllData[changeStatus] = response.data;

                if (formGroup) {
                  // set value in temporary array and also in form group to keep it updated,
                  // in case user starts editing and cancels status, it will take value from temporary array
                  // const findIndex = this.tempStatusResData.findIndex((statusObject: any) => statusObject.id == formGroup.controls['id'].value);
                  // if (findIndex > -1) {
                  //   this.tempStatusResData[findIndex].title = response.data.title || '';
                  //   this.tempStatusResData[findIndex].color = response.data.color || '';
                  // }
                  formGroup.controls['status']?.setValue(response.data.title || '');
                  formGroup.controls['color']?.setValue(response.data.color || '');
                }
              }
            }
          },
          (error) => {
            this.spinnerService.hideSpinner();
            if (error.error && error.error.message == 'A Project Status with this Title already exists.') {
              formGroup.controls['status'].setErrors({
                alreadyExists: true,
              });
            }
            console.log('error:', error);
          }
        )
      );
    } else {
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: 'Please fill in required fields with correct information.' },
        duration: 45000,
      });
      // this._snackBar.open('Please fill required and correct data');
    }
  }

  // call delete status API
  deleteStatusControl(id: number) {
    this.spinnerService.showSpinner();
    this.subscriptions.push(
      this.statusService.deleteStatus(id.toString()).subscribe(
        (response: any) => {
          if (response) {
            this.spinnerService.hideSpinner();
            if (response.status === 200) {
              const statusArray = this.statusForm.controls['statusArray'] as FormArray;
              const values = statusArray.value;
              const index = values.findIndex((item: any) => item.id == id);

              statusArray.removeAt(index);
              this.projectStatusResData = this.projectStatusResData.filter((item: any) => item.id !== id);
            }
          }
        },
        (error) => {
          this.spinnerService.hideSpinner();
          console.log('error:', error);
        }
      )
    );
  }

  // call Create Status API call
  addStatus(body: any, formGroup: any) {
    this.spinnerService.showSpinner();

    this.subscriptions.push(
      this.statusService.createStatus(this.projectId, body).subscribe(
        (response: any) => {
          if (response) {
            if (response.status === 201) {
              this._snackBar.openFromComponent(SnackbarComponent, {
                data: { message: response.message || 'Project status has been created successfully.' },
              });
              if (response.data) {
                const changeStatus = this.projectStatusAllData?.findIndex((item: any) => item.id == response?.data?.id);
                this.projectStatusAllData[changeStatus] = response.data;

                // statusArray.push(
                //   this.formBuilder.group({
                //     status: new FormControl({ value: response.data.title || '' }, Validators.required),
                //     id: [response.data.id],
                //     state: response.data.state,
                //   })
                // );

                formGroup.controls['id'].setValue(response.data.id);
                this.projectStatusResData.push(response.data);
                // this.tempStatusResData.push(response.data);
              }
            }
            this.spinnerService.hideSpinner();
          }
        },
        (error) => {
          this.spinnerService.hideSpinner();
          if (error.error && error.error.message == 'A Project Status with this title already exists.') {
            formGroup.controls['status'].setErrors({
              alreadyExists: true,
            });
          }
          console.log('error:', error);
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
