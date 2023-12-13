import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import { Encryption } from '@tms-workspace/encryption';
import { UUID } from 'angular2-uuid';
import { GlobalService } from '../../../core/services/common/global.service';

@Component({
  selector: 'main-app-mat-chips',
  templateUrl: './mat-chips.component.html',
  styleUrls: ['./mat-chips.component.scss'],
})
export class MatChipsComponent implements OnDestroy, AfterViewInit {
  //#region for Variable declaration

  @Input() data!: any;
  @Input() isCloseButton!: boolean;
  @Input() disabledTeam!: boolean;
  @Input() showOrangeChip!: boolean;
  @Output() chipClosed = new EventEmitter<void>();
  @Input() viewAvatarOnly = false;
  @Input() stopViewFullProfileOption = true;
  @Input() viewTooltip = false;
  @Input() indicateUserWorkingLocation = false;
  baseUrl = environment.base_url;
  // This veriable used for popup model
  public loading = false;
  public userDetails: any;
  public showPopup = false;
  public timeoutId: any;
  public innerTimeOut: any;
  public isRedirectToProfile!: boolean;

  //#endregion

  //#region for Component Structure Methods

  constructor(private router: Router, private cdref: ChangeDetectorRef, private globalService: GlobalService) {}

  ngAfterViewInit(): void {
    this.data.uid = UUID.UUID();
    this.cdref.detectChanges();
  }

  ngOnDestroy(): void {
    this.showPopup = false;
  }

  //#endregion

  //#region for Basic All methods

  public closeChip(): void {
    this.chipClosed.emit();
  }

  //This method used for the redirect to perticular user profile
  public redirectToProfile(userId: any) {
    this.router.navigate(['users', 'profile', Encryption._doEncrypt(userId.toString())]);
  }

  //Open dialog popup
  openDialog(userData: any) {
    if (!this.stopViewFullProfileOption) {
      this.globalService.getPermissionProfile(userData?.id.toString()).subscribe((res: any) => {
        this.isRedirectToProfile = res?.success;
      });
      if (!this.showPopup) {
        this.timeoutId = setTimeout(() => {
          this.loading = true;
          this.innerTimeOut = setTimeout(() => {
            this.showPopup = true;
            this.userDetails = userData;
            this.loading = false;
          }, 1000);
        }, 1000);
      }
    }
  }

  // This method used for close dialog
  closeDialog(): void {
    clearTimeout(this.timeoutId);
    clearTimeout(this.innerTimeOut);
    this.loading = false;
    this.showPopup = false;
  }

  //#endregion
}
