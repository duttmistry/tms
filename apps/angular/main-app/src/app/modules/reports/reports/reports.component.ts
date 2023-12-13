import { Router } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'main-app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent {
  constructor(private router: Router) {
    // console.log();
  }
  redirectToAdministration() {
    this.router.navigate(['reports']);
  }
}
