import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/module/users/users.service';
import { StorageService } from '../../../core/services/common/storage.service';
import { STORAGE_CONSTANTS } from '../../../core/services/common/constants';

@Component({
  selector: 'main-app-unauthorized-access',
  templateUrl: './unauthorized-access.component.html',
  styleUrls: ['./unauthorized-access.component.scss'],
})
export class UnauthorizedAccessComponent {
  constructor(private userService: UserService, private router: Router, private storageService: StorageService) {
    this.checkIfUserIsLoggedIn();
  }

  checkIfUserIsLoggedIn() {
    const user = this.userService.getUserDataFromLS();
    if (!user) {
      this.router.navigate(['/login']);
    }
    // else {
    //   let reloadCounts: string | number = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.RELOAD_COUNTS) || '';
    //   if (reloadCounts) {
    //     reloadCounts = +reloadCounts + 1;
    //   } else {
    //     reloadCounts = 1;
    //   }
    //   this.storageService.setIntoLocalStorage(STORAGE_CONSTANTS.RELOAD_COUNTS, reloadCounts + '');
    //   if (reloadCounts == 2) {
    //     this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.RELOAD_COUNTS);
    //     const visitedPage = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.VISITED_PAGES);
    //     if (visitedPage) {
    //       this.router.navigate([visitedPage]);
    //     }
    //   }
    // }
  }
}
