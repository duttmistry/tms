import { MatSnackBar } from '@angular/material/snack-bar';
import { Encryption } from '@tms-workspace/encryption';
import { ActivatedRoute } from '@angular/router';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { UUID } from 'angular2-uuid';
import { ProjectsService } from '../../../../core/services/module/projects/projects.service';
import { SpinnerService } from '../../../../core/services/common/spinner.service';
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-custom-fields',
  templateUrl: './custom-fields.component.html',
  styleUrls: ['./custom-fields.component.scss'],
})
export class CustomFieldsComponent implements OnInit {
  itemsRight: any = [];
  itemsLeft: any = [];
  formControlList: any = [
    {
      label: 'Short text',
      type: 'input-text',
      inputType: 'text',
      placeholder: null,
      is_required: false,
      icon: 'a-icon',
    },
    {
      label: 'Paragraph',
      type: 'textarea',
      inputType: 'textarea',
      placeholder: null,
      is_required: false,
      icon: 'paragraph',
    },
    {
      label: 'Date',
      type: 'date',
      inputType: 'date',
      is_required: false,
      icon: 'calendar1',
    },
    {
      label: 'Number',
      type: 'input-number',
      inputType: 'number',
      placeholder: null,
      is_required: false,
      icon: 'number',
    },
    {
      label: 'Dropdown',
      type: 'dropdown',
      inputType: 'select',
      is_required: false,
      icon: 'dropdown',
      options: [],
    },
    {
      label: 'Checkbox',
      type: 'checkbox',
      inputType: 'checkbox',
      icon: 'checkbox',
      isChecked: false,
    },
    {
      label: 'Radio',
      type: 'radio-btn',
      inputType: 'radio-btn',
      is_required: false,
      icon: 'radio',
      options: [],
    },
    {
      label: 'URL',
      type: 'input-url',
      inputType: 'url',
      placeholder: null,
      is_required: false,
      icon: 'url',
    },
  ];

  customFieldForm = new FormGroup({
    customFieldFormArray: new FormArray([]),
  });
  inputPlaceholder = new FormControl();
  inputTextLabel = new FormControl();
  inputOptions = new FormControl();

  updatePlaceholder = new FormControl();
  updateTextLabel = new FormControl();
  addOptionControl = new FormControl();

  sameOptionError = false;
  showAddControlSection = false;
  showUpdateDescriptionControlSection = false;
  showUpdateContextControlSection = false;
  formControlData: any;

  //params
  currentPage: any = 1;
  limit: any = 100;
  totalPage: any;
  totalRecords: any;
  sortBy = 'id';
  orderBy = 'asc';
  projectId: any;
  customFieldList: any = [];
  filteredFields: any = [];
  updateField: any;
  updateOptionArray: any;
  isFieldEdited = false;
  constructor(
    private projectService: ProjectsService,
    private activatedRoute: ActivatedRoute,
    private _snackBar: MatSnackBar,
    private spinnerService: SpinnerService,
    private fb: FormBuilder
  ) {
    this.projectId = this.activatedRoute.snapshot.paramMap.get('id');
    if (this.projectId) {
      this.projectId = Encryption._doDecrypt(this.projectId) as string;
    }
  }
  ngOnInit(): void {
    this.getAllCustomFieldsList();
  }

  drop(event: CdkDragDrop<FormArray[]>) {
    this.isFieldEdited = true;
    this.showAddControlSection = false;
    this.showUpdateContextControlSection = false;
    this.showUpdateDescriptionControlSection = false;
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      const targetContainerId = event.container.id;
      if (targetContainerId === 'descriptionContainer') {
        this.itemsLeft = this.itemsLeft.map((m: any) => (m.fieldType === 'context' ? { ...m, fieldType: 'descriptive' } : m));
      } else if (targetContainerId === 'contextContainer') {
        this.itemsRight = this.itemsRight.map((m: any) => (m.fieldType === 'descriptive' ? { ...m, fieldType: 'context' } : m));
      }
    }
  }

  onCancelDialog() {
    // this.dialog.closeAll();
    this.showAddControlSection = false;
  }

  async onClickFormControl(item: any) {
    this.showAddControlSection = true;
    this.showUpdateContextControlSection = false;
    this.showUpdateDescriptionControlSection = false;
    const selectedControl = { ...item };
    if (selectedControl && selectedControl.options) {
      selectedControl.options = [];
      this.inputOptions.reset();
    }
    selectedControl.id = UUID.UUID();
    selectedControl.identifier = selectedControl.id;
    this.formControlData = selectedControl;
    this.inputPlaceholder.reset();
    this.inputTextLabel.reset();
  }

  get getCustomFieldFormArray(): FormArray {
    return this.customFieldForm.get('customFieldFormArray') as FormArray;
  }

  onClickRequire(event: any, item: any) {
    item.is_required = event.checked;
    this.isFieldEdited = true;
  }

  onClickAdd(data: any) {
    if ((data.type == 'radio-btn' || data.type == 'dropdown') && !data.options.length) {
      this.inputOptions.setErrors({ minimumOption: true });
    } else {
      const placeholderText = this.inputPlaceholder.value;
      const inputTextLabel = this.inputTextLabel.value;
      if ((placeholderText && placeholderText !== undefined) || (inputTextLabel && inputTextLabel !== undefined)) {
        data.placeholder = placeholderText;
        data.label = inputTextLabel;
        delete data.id;
        this.itemsLeft.push(data);
        const formArrayLength = this.getCustomFieldFormArray.controls.length + 1;
        this.getCustomFieldFormArray.push(new FormControl(data.label + '-' + formArrayLength));
        this.showAddControlSection = false;
        this.onAddNewFields();
      } else {
        // console.log('unable to add label or text >>');
      }
    }
  }

  onClickAddOption(data: any) {
    const optionValue = this.inputOptions.value;
    const optionsLength = data.options.length;
    if (optionValue !== null) {
      const found = data.options.some((el: any) => el.value === optionValue);
      if (!found) {
        const obj = {
          id: optionsLength + 1,
          value: optionValue,
        };
        data.options.push(obj);
        this.inputOptions.reset();
      } else {
        this.sameOptionError = true;
        this.inputOptions.setErrors({ sameOption: true });
      }
    }
  }

  onCheckboxChange(event: any, data: any) {
    data.isChecked = event.checked;
  }

  getAllCustomFieldsList() {
    this.spinnerService.showSpinner();
    const filterParams = {
      page: this.currentPage,
      limit: this.limit,
      sortBy: this.sortBy || '',
      orderBy: this.orderBy || '',
    };
    this.projectService.getAllCustomFields(filterParams).subscribe(
      (response: any) => {
        if (response.data && response?.data?.list) {
          const { customFields } = response.data.list;
          customFields.map((m: any) => {
            if (m.projects && !m.projects.includes(+this.projectId)) {
              m.icon =
                m.type === 'input-text'
                  ? 'a-icon'
                  : m.type === 'textarea'
                  ? 'paragraph'
                  : m.type === 'date'
                  ? 'calendar1'
                  : m.type === 'input-number'
                  ? 'number'
                  : m.type === 'dropdown'
                  ? 'dropdown'
                  : m.type === 'checkbox'
                  ? 'checkbox'
                  : m.type === 'radio-btn'
                  ? 'radio'
                  : m.type === 'input-url'
                  ? 'url'
                  : 'a-icon';
              this.customFieldList.push(m);
            } else {
              m.fieldType == 'context' ? this.itemsRight.push(m) : this.itemsLeft.push(m);
            }
          });
          this.filteredFields = this.customFieldList;
        }
        this.spinnerService.hideSpinner();
      },
      (err: any) => {
        this.spinnerService.hideSpinner();
        console.log('error getAllCustomFields List =>>', err);
      }
    );
  }

  async onAddNewFields() {
    if (this.getCustomFieldFormArray && this.getCustomFieldFormArray.controls.length) {
      let descriptionFields = [];
      let contextFields = [];
      if (this.itemsLeft && this.itemsLeft.length) {
        descriptionFields = this.itemsLeft.map((elm: any) => ({
          fieldType: 'descriptive',
          id: elm.id || null,
          label: elm.label,
          identifier: elm.identifier,
          type: elm.type,
          options: elm.options || null,
          is_required: elm.is_required || false,
          is_active: elm.isActive || false,
          projects: elm.projects || [],
        }));
      }
      if (this.itemsRight && this.itemsRight.length) {
        contextFields = this.itemsRight.map((elm: any) => ({
          fieldType: 'context',
          id: elm.id || null,
          label: elm.label,
          identifier: elm.identifier,
          type: elm.type,
          options: elm.options || null,
          is_required: elm.is_required || false,
          is_active: elm.isActive || false,
          projects: elm.projects || [],
        }));
      }
      const requestBody = {
        project_id: this.projectId,
        custom_fields: [...descriptionFields, ...contextFields],
      };
      await this.createCustomFields(requestBody);
    } else {
      const editedReqBody = {
        project_id: this.projectId,
        custom_fields: [...this.itemsLeft, ...this.itemsRight],
      };
      if (editedReqBody?.custom_fields && editedReqBody?.custom_fields.length !== 0) {
        this.createCustomFields(editedReqBody);
      } else {
        // console.log('unable to get any form control');
      }
    }
  }

  createCustomFields(body: any) {
    this.projectService.createCustomFields(body).subscribe(
      (response: any) => {
        if (response && response.success == true) {
          this._snackBar.open(response?.message);
          this.customFieldList = [];
          this.resetData();
          this.getAllCustomFieldsList();
        } else {
          // console.log('unable to get response of create custom field');
        }
      },
      (err: any) => {
        console.log('get error onButtonClickSave=>>', err);
      }
    );
  }

  resetData() {
    this.itemsLeft = [];
    this.itemsRight = [];
    this.getCustomFieldFormArray.controls = [];
    this.showAddControlSection = false;
    this.showUpdateContextControlSection = false;
    this.showUpdateDescriptionControlSection = false;
  }

  searchAvailableField(event: any) {
    const searchTerm = event.target.value;
    if (searchTerm.length && searchTerm.length > 2) {
      this.filteredFields = this.customFieldList.filter((item: any) => item.label.toLowerCase().includes(searchTerm.toLowerCase()));
    } else {
      this.filteredFields = this.customFieldList;
      return;
    }
  }

  onClickSuggestedField(item: any) {
    item.fieldType == 'context' ? this.itemsRight.push(item) : this.itemsLeft.push(item);
    this.showAddControlSection = false;
    const formArrayLength = this.getCustomFieldFormArray.controls.length + 1;
    this.getCustomFieldFormArray.push(new FormControl(item.label + '-' + formArrayLength));
  }

  editField(field: any) {
    field?.fieldType === 'context'
      ? ((this.showUpdateContextControlSection = true), (this.showUpdateDescriptionControlSection = false), (this.showAddControlSection = false))
      : ((this.showUpdateDescriptionControlSection = true), (this.showUpdateContextControlSection = false), (this.showAddControlSection = false));
    this.updateField = field || {};
    this.updateOptionArray = this.fb.array([]);
    if (this.updateField && this.updateField.options) {
      this.updateField.options.forEach((elm: any) => {
        let optionControlName = this.removeSpaceFromString(elm.value) + elm.id;
        optionControlName = new FormControl(elm.value, Validators.required);
        this.updateOptionArray.push(optionControlName);
      });
    }

    this.updateTextLabel.patchValue(field.label);
  }

  /**
   *  remove option on update option of dropdown and radio button
   * @param opt
   */
  onClickRemoveOption(opt: any) {
    const removeOptionIndex = this.updateOptionArray?.value.indexOf(opt.value);
    if (removeOptionIndex > -1) {
      this.updateOptionArray.controls.splice(removeOptionIndex, 1);
      this.updateOptionArray.value.splice(removeOptionIndex, 1);
    }
  }

  /**
   * method call on update option add new option
   */
  onClickAddNewOption() {
    if (this.addOptionControl.valid && this.addOptionControl.value !== null) {
      const newOption = this.addOptionControl.value;
      const newOptionController = new FormControl(newOption, Validators.required);
      // check same option validation
      if (this.updateOptionArray.value.find((m: any) => m === this.addOptionControl.value)) {
        this.addOptionControl.setErrors({ sameOption: true });
      } else {
        this.updateOptionArray.push(newOptionController);
        this.addOptionControl.reset();
      }
    } else {
      this.addOptionControl.setErrors({ requiredValue: true });
    }
  }

  /**
   * method call on update options
   */
  onClickUpdate() {
    this.updateField.label = this.updateTextLabel.value;
    const updatedOptions = this.updateOptionArray?.value.map((m: any, ind: any) => ({ id: ind + 1, value: m }));
    this.updateField.options = updatedOptions;
    if (this.updateField.id && this.updateField.id !== null) {
      this.spinnerService.showSpinner();
      this.projectService.updateCustomFields(this.updateField).subscribe(
        (response: any) => {
          if (response && response.success == true) {
            this._snackBar.open(response?.message);
            this.customFieldList = [];
            this.resetData();
            this.getAllCustomFieldsList();
            this.spinnerService.hideSpinner();
            this.showUpdateContextControlSection = false;
            this.showUpdateDescriptionControlSection = false;
            this.showAddControlSection = false;
          } else {
            this.spinnerService.hideSpinner();
            this.showUpdateContextControlSection = false;
            this.showUpdateDescriptionControlSection = false;
            this.showAddControlSection = false;
            // console.log('unable to get response of update custom field');
          }
        },
        (err: any) => {
          this.spinnerService.hideSpinner();
          console.log('get error onClickUpdate=>>', err);
        }
      );
    } else {
      this.showUpdateContextControlSection = false;
      this.showUpdateDescriptionControlSection = false;
      this.showAddControlSection = false;
      this.onAddNewFields();
    }
  }

  onCancelUpdate() {
    this.showUpdateDescriptionControlSection = false;
    this.showUpdateContextControlSection = false;
  }

  removeSpaceFromString(str: any) {
    return str.replace(/\s/g, '');
  }
}
