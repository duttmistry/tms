import { Component, HostListener, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { StorageService } from '../../services/common/storage.service';
import { LoginService } from '../../services/login/login.service';
import { PERMISSION_CONSTANTS, STORAGE_CONSTANTS } from '../../services/common/constants';
import { MessagingService } from '../../services/firebase/messaging.service';
import { OwlOptions } from 'ngx-owl-carousel-o';
import * as moment from 'moment';
import { environment } from '../../../../environments/environment';
import { DashboardService } from '../../services/module/dashboard/dashboard.service';
import { MatDialog } from '@angular/material/dialog';
import { SiteSettingService } from '../../../core/services/common/site-setting.service';
import { ProjectsService } from '../../services/module/projects/projects.service';
import { DeviceDetectorService } from 'ngx-device-detector';
@Component({
  selector: 'main-app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent implements OnInit {
  //#region properties
  loginForm: FormGroup;
  showLoginSpinner = false;
  hide = true;
  bannerData: any[] = [];
  _base_url = environment.base_url;
  customOptions: OwlOptions = {
    items: 1,
    loop: false,
    autoplay: true,
    autoWidth: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: true,
    margin: 2,
    // nav: true,
    navSpeed: 1000,
    autoplayTimeout: 3000,
    // navText: ['', ''],
  };
  public greetingMessage: any;
  public birthdayMessage =
    'Wishing you a year filled with success, joy, and great accomplishments. Your dedication to our company is truly appreciated. Enjoy your special day.';
  public anniversaryMessage = `Your dedication and hard work are truly appreciated. Thank you for being an essential part of our team. Here's to many more successful years together!`;
  showSpinner = true;
  reason = new FormControl('', [Validators.required, Validators.minLength(5), this.notOnlyWhitespace,]);
  // reason = new FormControl('',[Validators.required,Validators.pattern('^[a-zA-Z0-9;!@#$%^&*]+( [a-zA-Z0-9;!@#$%^&*]+)*$'),Validators.minLength(5)]);
  isSubmitted = false
  isDialogOpen: boolean = false;
  credentials: any
  deviceInfo: any;
  // lateArrivalThreshold: any;
  @ViewChild('dialogContent') dialogContent!: TemplateRef<any>;
  // @HostListener('window:beforeunload', ['$event'])
  // unloadHandler() {
  //   if (this.isDialogOpen && this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.ACCOUNT)) {
  //     console.log('%c  this.isDialogOpen:', 'color: #0e93e0;background: #aaefe5;', this.isDialogOpen);
  //     // const encryptedData = Encryption._doEncrypt(JSON.stringify(this.loginForm.getRawValue()));
  //     // this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.ACCOUNT, encryptedData);

  //     this.loginService.setDialogOpen(true);
  //   }else {
  //     this.loginService.setDialogOpen(false);
  //   }
  // }

  //#endregion

  constructor(
    private messagingService: MessagingService,
    private storageService: StorageService,
    private router: Router,
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private dashboardService: DashboardService,
    private dialog: MatDialog,
    private siteSettingService: SiteSettingService,
    private projectService: ProjectsService,
    private deviceService: DeviceDetectorService
  ) {
    this.loginForm = this.initializeFormControls();
    this.getDeviceInfo();
  }

  ngOnInit(): void {
    this.getSliderData();
    this.loginService.getGreetingMessage().subscribe((response: any) => {
      if (response && response.length > 0) {
        this.greetingMessage = response[0]?.content;
      } else {
        this.greetingMessage = 'As you log in today, remember that every task you complete is a step towards our shared goals.';
      }
    });
    // this.siteSettingService.getLateArrivalThreshold().subscribe((res: any) => {
    //   // console.log("RESPONSE OF LATE ARRIVAL",res)
    //   if (res && res.status == 200 && res.data) {
    //     this.lateArrivalThreshold = res?.data?.value;
    //   }
    // });
    this.isDialogOpen = this.loginService.isDialogOpen();
    const tempData = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.ACCOUNT);
    if (tempData && this.isDialogOpen) {
      // console.log('%c  tempData:', 'color: #0e93e0;background: #aaefe5;', tempData);
      this.credentials = JSON.parse(Encryption._doDecrypt(tempData));
      // console.log('%c  this.credentials:', 'color: #0e93e0;background: #aaefe5;', this.credentials);
      this.loginForm.patchValue(this.credentials)
      // console.log('%c  this.loginForm:', 'color: #0e93e0;background: #aaefe5;', this.loginForm);
    } else if (!tempData) {
      this.isDialogOpen = false;
      this.loginService.setDialogOpen(false);
    }

    // console.log('%c  STORAGE_CONSTANTS.ACCOUNT:', 'color: #0e93e0;background: #aaefe5;', STORAGE_CONSTANTS.ACCOUNT);
    // console.log('%c  this.credentials:', 'color: #0e93e0;background: #aaefe5;', this.credentials);
    // console.log('%c  this.isDialogOpen:', 'color: #0e93e0;background: #aaefe5;', this.isDialogOpen);

    // console.log("reason",this.reason.value)
  }
  ngAfterViewInit(): void {
    // console.log('%c  this.isDialogOpen:', 'color: #0e93e0;background: #aaefe5;', this.isDialogOpen);

    if (this.isDialogOpen) {
      // console.log("this.isDialogOpen ",this.isDialogOpen )
      this.openDialogWithTemplateRef();
    }
  }

  // Initialize Login Form
  initializeFormControls() {
    return this.formBuilder.group({
      accountId: [
        '',
        Validators.compose([
          Validators.required,
          // Validators.pattern(Utility.emailRegEx),
          // Validators.minLength(4),
          Validators.maxLength(64),
          this.emailOrUsernameValidator,
        ]),
      ],
      password: [
        '',
        Validators.compose([
          Validators.required,
          // Validators.pattern(Utility.passwordRegEx),
          Validators.maxLength(16),
        ]),
      ],
    });
  }

  get _loginForm() {
    return this.loginForm.controls;
  }

  submitLoginForm() {
    if (this.loginForm.valid && !this.showLoginSpinner) {
      this.showLoginSpinner = true;
      const formValue = this.loginForm.getRawValue();
      const encryptedData = Encryption._doEncrypt(JSON.stringify(formValue));
      this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.ACCOUNT, encryptedData);
      // console.log('%c  formValue:', 'color: #0e93e0;background: #aaefe5;', formValue);
      // this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.ACCOUNT, Encryption._doEncrypt(JSON.stringify(formValue)));
      this.loginService.login(formValue.accountId, formValue.password, this.reason.value?.trim(), this.deviceInfo).subscribe({
        next: (res: any) => {
          if (res.status == 200 && res.success) {
            if (res?.data && res?.data?.previousSession !== null) {
              this.loginService.setPreviousSessionMessage(res?.data?.previousSession);
            }
            // console.log("IN 2000")
            this.dashboardService.setShowMyTeamTask(res.data.reporer);
            this.storageService.setIntoLocalStorage(
              STORAGE_CONSTANTS.REPORTER_STATUS,
              Encryption._doEncrypt(JSON.stringify(res.data.reporer || false))
            );
            this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.ACCESS_TOKEN, res.data.accessToken);
            this.storageService.setIntoLocalStorage(PERMISSION_CONSTANTS.PERMISSION, Encryption._doEncrypt(JSON.stringify(res.data.permission)));
            this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.SESSION_ID, res.data.sessionId || '');
            this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.USER_DATA, Encryption._doEncrypt(JSON.stringify(res.data.userData)));
            const rmtime = { todayRemainingTime: res.data.todayRemainingTime, weeklyRemainingTime: res.data.weeklyRemainingTime };
            this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.REMAINING_TIME, Encryption._doEncrypt(JSON.stringify(rmtime)));
            this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.IS_BREAK_TIME, Encryption._doEncrypt(JSON.stringify(false)));
            this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE, Encryption._doEncrypt(JSON.stringify(res?.data?.preference)));
            this.messagingService.requestPermission();
            if (!(res?.data?.preference)) {
              this.projectService.getAllProjects().subscribe((response: any) => {
                if (response?.length == 0) {
                  this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE, Encryption._doEncrypt(JSON.stringify(true)));
                  // this.showLoginSpinner = false;
                  this.router.navigate(['/']);
                }
                else if (response?.list?.length > 0) {
                  // this.showLoginSpinner = false;
                  this.router.navigate(['/setpreferences']);
                }
              });
            } else {
              // this.showLoginSpinner = false;
              this.router.navigate(['/']);
            }
          } else if (res?.status == 200 && !res?.success && res?.data?.lateArrival) {
            this.showLoginSpinner = false
            this.openDialogWithTemplateRef();
          } else {
            this.showLoginSpinner = false
          }
        }, error: (err: any) => {
          // console.log('error=>>', err);
          this.showLoginSpinner = false;
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  togglePassword(event: any): void {
    event.stopPropagation();
    this.hide = !this.hide;
  }

  getSliderData() {
    this.loginService.getBannerData().subscribe(
      (res: any) => {
        if (res && res?.data) {
          if (res?.data && res?.data?.list) {
            this.bannerData = res?.data?.list;
            this.bannerData.length > 1 ? (this.customOptions.loop = true) : (this.customOptions.loop = false);
            this.showSpinner = false;
          } else {
            this.bannerData = [];
            this.showSpinner = false;
          }
        } else {
          this.bannerData = [];
          this.showSpinner = false;
        }
      },

      (err: any) => {
        console.log('error=>>', err);
        this.showSpinner = false;
      }
    );
  }

  calculateAnniversary(data: any) {
    data.production_date = moment(data?.production_date).format('YYYY-MM-DD');
    data.eventDate = moment(data?.eventDate).format('YYYY-MM-DD');
    const productionDate = moment(data.production_date);
    const currentDate = moment(data.eventDate);
    const yearsSinceProduction = currentDate.diff(productionDate, 'years');
    if (yearsSinceProduction === 0) {
      return '';
    } else {
      const yearWithSuffix = ' ' + yearsSinceProduction + this.setYearSuffix(yearsSinceProduction);
      return yearWithSuffix;
    }
  }

  setYearSuffix(number: any) {
    if (number >= 11 && number <= 13) {
      return 'th';
    }

    const lastDigit = number % 10;
    switch (lastDigit) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }
  trimInput(): any {
    const accountIdControl: any = this.loginForm.get('accountId');
    if (accountIdControl.value && typeof accountIdControl.value === 'string') {
      // Remove leading and trailing white spaces from the value
      const trimmedValue = accountIdControl.value.trim();
      // Update the FormControl value
      accountIdControl.setValue(trimmedValue);
    } else if (this.reason.value && typeof this.reason.value === 'string') {
      // Remove leading and trailing white spaces from the value
      const trimmedValue = this.reason.value.trim();
      // Update the FormControl value
      this.reason.setValue(trimmedValue);
    }
  }

  public emailOrUsernameValidator(control: AbstractControl): { [key: string]: any } | null {
    // Regular expression for valid email format
    const emailRegEx = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // Regular expression for valid username (alphanumeric characters only)
    const usernameRegEx = /^[a-zA-Z0-9]+$/;

    const value = control.value;

    // Check if the input value is a valid email address
    if (emailRegEx.test(value)) {
      return null; // Valid email
    }

    // Check if the input value is a valid username
    if (usernameRegEx.test(value)) {
      return null; // Valid username
    }

    // If neither email nor username pattern matches, return an error
    return { invalidInput: true };
  }
  openDialogWithTemplateRef() {
    this.loginService.setDialogOpen(true);
    this.isDialogOpen = this.loginService.isDialogOpen();
    console.log('CLCL function');
    const dialogRef = this.dialog.open(this.dialogContent, {
      hasBackdrop: true,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(() => {
      this.loginService.setDialogOpen(false);
    });
  }
  confirmLateLogin() {
    if (this.reason.valid && this.reason.value) {
      this.submitLoginForm();
      this.loginService.setDialogOpen(false);
      this.dialog.closeAll();
    }
    // if (!this.reason.value) {
    //   this.isSubmitted = true
    //   this.loginService.setDialogOpen(false);

    // } else {
    //   this.dialog.close(this.reason.value);
    // }
  }
  notOnlyWhitespace(control: AbstractControl): any {
    const value = control.value;
    if (value && value.trim() === '') {
      return { notOnlyWhitespace: true };
    }
    return null;
  }
  getDeviceInfo() {
    try {
      this.deviceInfo = this.deviceService.getDeviceInfo();
    } catch (error) {
      console.error("Error fetching device information:", error);

    }
  }

}
