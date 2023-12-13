import { Component } from '@angular/core';
import { UserService } from '../../../core/services/module/users/users.service';
import { Router } from '@angular/router';

@Component({
  selector: 'main-app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss'],
})
export class PageNotFoundComponent {
  constructor(private userService: UserService, private router: Router) {
    this.checkIfUserIsLoggedIn();
  }

  checkIfUserIsLoggedIn() {
    const user = this.userService.getUserDataFromLS();
    if (!user) {
      this.router.navigate(['/login']);
    }
  }
}
