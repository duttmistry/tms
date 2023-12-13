import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, interval } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { SpinnerService } from '../../services/common/spinner.service';
import { StorageService } from '../../services/common/storage.service';
import { LoginService } from '../../services/login/login.service';
import { NavigationEnd, Router } from '@angular/router';
import { STORAGE_CONSTANTS, UNAUTHORIZED_PAGE_NAME } from '../../services/common/constants';
import { LoadingBarService } from '@ngx-loading-bar/core';
import { Encryption } from '@tms-workspace/encryption';
import { MessagingService } from '../../services/firebase/messaging.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit, OnDestroy {
  ip = '192.168.0.122';
  isShowSpinner = false;
  subscriptions: Subscription[] = [];
  showPreference = true;
  preferenceSubscription!: Subscription;

  //#region properties

  //#endregion
  constructor(
    private storageService: StorageService,
    private spinnerService: SpinnerService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private loadingBar: LoadingBarService,
    private messagingService: MessagingService
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const currentUrl = event.urlAfterRedirects || event.url;
        if (currentUrl && !currentUrl.includes(UNAUTHORIZED_PAGE_NAME)) {
          this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.VISITED_PAGES, currentUrl);
        }
      }
    });
  }

  ngOnInit(): void {
    // subscribe to spinner observable to toggle spinner
    this.loadingBar.start();
    this.subscriptions.push(
      this.spinnerService.getSpinnerStatus().subscribe((response: boolean) => {
        if (response == true) {
          this.loadingBar.start();
          document.body.style.pointerEvents = 'none';
        } else {
          this.loadingBar.complete();
          document.body.style.pointerEvents = 'auto';
        }
        this.isShowSpinner = response || false;
        this.cd.detectChanges();
      })
    );
    // this.preferenceSubscription = interval(1000).subscribe(() => {
    //   const showPreference = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE) || '';
    //   const encrytedData = Encryption._doDecrypt(showPreference);
    //   this.showPreference = encrytedData ? JSON.parse(encrytedData) : '';
    //   this.cd.detectChanges();
    // });
  }

  ngOnDestroy(): void {
    // unsubscribe  observables
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    // this.preferenceSubscription.unsubscribe();
  }
}
