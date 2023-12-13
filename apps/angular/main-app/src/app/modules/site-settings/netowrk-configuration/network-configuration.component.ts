import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { SpinnerService } from '../../../core/services/common/spinner.service';
import { SiteSettingService } from '../../../core/services/common/site-setting.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { PERMISSION_CONSTANTS } from '../../../core/services/common/constants';
import { Encryption } from '@tms-workspace/encryption';
import { PermissionService } from '../../../core/services/module/settings/permission/permission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '@tms-workspace/material-controls';

@Component({
  selector: 'main-app-network-configuration',
  templateUrl: './network-configuration.component.html',
  styleUrls: ['./network-configuration.component.scss'],
})
export class NetworkConfigurationComponent implements OnInit {
  networkConfigformGroup = new FormGroup({
    officeIp: new FormControl('', [
      Validators.required,
      Validators.pattern('^(([0-9]{1,3}|x|X)\\.([0-9]{1,3}|x|X)\\.([0-9]{1,3}|x|X)\\.([0-9]{1,3}|x|X))$'),
    ]),
  });
  officeIP = new FormControl('', Validators.required);
  isAllowedToUpdate = false;
  fieldDetails: any = null;
  MODULE_NAME = 'network';
  OFFICE_IP = 'Office Ip';
  officeIpControl = new FormControl('');
  selectedIpsForm: FormGroup
  WHITELISTED_IPS = 'Whitelisted IP'
  constructor(
    private siteSettingsService: SiteSettingService,
    private formBuilder: FormBuilder,
    private spinnerService: SpinnerService,
    private storageService: StorageService,
    private permissionService: PermissionService,
    private siteSettingService: SiteSettingService,
    private _snackBar: MatSnackBar
  ) {
    this.selectedIpsForm = this.formBuilder.group({
      fixed: this.formBuilder.array([
        // this.formBuilder.group({
        //   ip: ['', [Validators.required,Validators.pattern('^(([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3}))$'),]],
        // }),
      ]),
      pattern: this.formBuilder.array([
        // this.formBuilder.group({
        //   ip: ['', [Validators.required,Validators.pattern('^(([0-9]{1,3}|x|X)\\.([0-9]{1,3}|x|X)\\.([0-9]{1,3}|x|X)\\.([0-9]{1,3}|x|X))$'),]],
        // }),
      ]),
    })
  }

  ngOnInit(): void {
    // console.log('call');
    let permission = this.storageService.getFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
    if (permission) {
      permission = JSON.parse(Encryption._doDecrypt(permission));
      this.isAllowedToUpdate = this.permissionService.getModuleActionPermission(permission, 'site_settings.network_configuration', 'update');
      if (!this.isAllowedToUpdate) {
        this._networkConfigformGroup['officeIp'].disable();
      }
    }
    this.getModuleWiseSiteSettingsData();
  }
  get _networkConfigformGroup() {
    return this.networkConfigformGroup.controls;
  }
  getModuleWiseSiteSettingsData() {
    this.spinnerService.showSpinner();

    this.siteSettingService.getModuleWiseSiteSettingsData(this.MODULE_NAME).subscribe(
      (res: any) => {
        this.spinnerService.hideSpinner();
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          this.fieldDetails = res.data;
          const officeIp = this.fieldDetails?.find((field: any) => field.name === this.OFFICE_IP);
          const whiteListedIps = this.fieldDetails?.find((field: any) => field.name === this.WHITELISTED_IPS)
          // console.log('%c  whiteListedIps:', 'color: #0e93e0;background: #aaefe5;', whiteListedIps);
          if (officeIp && officeIp?.value) {
            this._networkConfigformGroup['officeIp'].patchValue(officeIp?.value);
          }
          if (whiteListedIps && whiteListedIps?.value) {
            const whiteListedIpsArray = whiteListedIps.value.fixed;
            // console.log('%c  whiteListedIpsArray:', 'color: #0e93e0;background: #aaefe5;', whiteListedIpsArray);
            whiteListedIpsArray.forEach((ip: any) => {
              const ipExists = (this.selectedIpsForm.get('fixed') as FormArray).controls.some((control) => {
                return control.get('ip')?.value === ip;
              });
              if (!ipExists) {
                (this.selectedIpsForm.get('fixed') as FormArray).push(
                  this.formBuilder.group({
                    ip: [ip, [Validators.required, Validators.pattern('^(([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3}))$')]]
                  })
                );
              }
            });
            const whiteListedIpsPatternArray = whiteListedIps.value.pattern;
            // console.log('%c  whiteListedIpsPatternArray:', 'color: #0e93e0;background: #aaefe5;', whiteListedIpsPatternArray);
            // console.log('%c  (this.selectedIpsForm.get(pattern) as FormArray).controls:', 'color: #0e93e0;background: #aaefe5;', (this.selectedIpsForm.get('pattern') as FormArray).controls);
            whiteListedIpsPatternArray.forEach((ip: any) => {
              const ipExists = (this.selectedIpsForm.get('pattern') as FormArray).controls.some((control) => {
                return (control.get('ip')?.value).toUpperCase() === ip;
              });
              if (!ipExists) {
                (this.selectedIpsForm.get('pattern') as FormArray).push(
                  this.formBuilder.group({
                    ip: [ip, [Validators.required, Validators.pattern('^(([0-9]{1,3}|x|X)\\.([0-9]{1,3}|x|X)\\.([0-9]{1,3}|x|X)\\.([0-9]{1,3}|x|X))$')]]
                  })
                );
              }
            });
          }
          // console.log(res.data)
        } else {
          this.fieldDetails = [];
          this._networkConfigformGroup['officeIp'].reset();
        }
      },
      (error) => {
        this.spinnerService.hideSpinner();
      }
    );
  }
  _onSave() {
    // console.log('%c  this.selectedIpsForm.valid:', 'color: #0e93e0;background: #aaefe5;', this.selectedIpsForm.valid);
    if (this.networkConfigformGroup.valid && this.selectedIpsForm.valid) {
      if (this.fieldDetails && this.fieldDetails.length > 0) {
        const officeIp = this.fieldDetails?.find((field: any) => field.name === this.OFFICE_IP);
        const whiteListedIps = this.fieldDetails?.find((field: any) => field.name === this.WHITELISTED_IPS)
        if (officeIp) {
          officeIp['value'] = this._networkConfigformGroup['officeIp'].value;
        } else {
          this.fieldDetails = [];
          this.fieldDetails.push({
            default_value: null,
            description: 'NA',
            field_type: 'string',
            id: null,
            identifier: 'office_ip',
            module: 'network',
            name: 'Office Ip',
            value: this._networkConfigformGroup['officeIp'].value,
          });
        }
        if (whiteListedIps) {
          // console.log('%c  whiteListedIps:', 'color: #0e93e0;background: #aaefe5;', whiteListedIps);
          whiteListedIps['value'].fixed = this.selectedIpsForm.value.fixed.map((ele: any) => ele.ip);
          whiteListedIps['value'].pattern = this.selectedIpsForm.value.pattern.map((ele: any) => ele.ip.toUpperCase());
          console.log('%c   whiteListedIps[value]:', 'color: #0e93e0;background: #aaefe5;', whiteListedIps['value'].pattern);
        } else {
          this.fieldDetails = [];
          this.fieldDetails.push({
            default_value: null,
            description: 'NA',
            field_type: 'json',
            id: null,
            identifier: 'whitelisted_IP',
            module: 'network',
            name: this.WHITELISTED_IPS,
            value: this.selectedIpsForm.value,
          });
        }
      } else {
        this.fieldDetails = [];
        this.fieldDetails.push({
          default_value: null,
          description: 'NA',
          field_type: 'string',
          id: null,
          identifier: 'office_ip',
          module: 'network',
          name: 'Office Ip',
          value: this._networkConfigformGroup['officeIp'].value,
        });
      }

      const body = {
        module: this.MODULE_NAME,
        fields: this.fieldDetails,
      };
      // console.log('%c  body:', 'color: #0e93e0;background: #aaefe5;', body);
      this.siteSettingService.setModuleWiseSiteSettingsData(body).subscribe(
        (res: any) => {
          if(res.success){
            this.spinnerService.hideSpinner();
            this._snackBar.openFromComponent(SnackbarComponent, {
              data: { message: res.message },
              duration: 45000,
            });
            this.getModuleWiseSiteSettingsData();
          }
        },
        (error) => {
          this.spinnerService.hideSpinner();
          this._snackBar.openFromComponent(SnackbarComponent, {
            data: { message: 'An error occured while saving network configuration' },
            duration: 45000,
          });
        }
      );
    }else{
      this.selectedIpsForm.markAllAsTouched();
      this.networkConfigformGroup.markAllAsTouched();
      // this._snackBar.openFromComponent(SnackbarComponent, {
      //   data: { message: 'Please fill all the required fields' },
      //   duration: 45000,
      // });
    }

  }
  onCancel() {
    this.getModuleWiseSiteSettingsData();
  }

  get fixedIps() {
    return this.selectedIpsForm.get('fixed') as FormArray
  }
  get IpPatterns() {
    return this.selectedIpsForm.get('pattern') as FormArray
  }
  addIp() {
    const ipFormGroup = this.formBuilder.group({
      ip: ['', [Validators.required, Validators.pattern('^(([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3}))$'),]],
    });
    this.fixedIps.push(ipFormGroup);
    // console.log('%c  this.fixedIps:', 'color: #0e93e0;background: #aaefe5;', this.fixedIps);
  }

  removeIp(index: number) {
    this.fixedIps.removeAt(index);
  }
  addIpPattern() {
    const patternFormGroup = this.formBuilder.group({
      ip: ['', [Validators.required, Validators.pattern('^(([0-9]{1,3}|x|X)\\.([0-9]{1,3}|x|X)\\.([0-9]{1,3}|x|X)\\.([0-9]{1,3}|x|X))$'),]],
    });

    this.IpPatterns.push(patternFormGroup);
    // console.log('%c  this.pattern:', 'color: #0e93e0;background: #aaefe5;', this.IpPatterns);
  }

  removeIpPattern(index: number) {
    this.IpPatterns.removeAt(index);
  }
}
