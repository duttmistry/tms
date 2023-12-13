import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'main-app-work-report',
  templateUrl: './work-report.component.html',
  styleUrls: ['./work-report.component.scss'],
})
export class WorkReportComponent {
  constructor(private router: Router) {
    // console.log();
  }
  redirectToAdministration() {
    this.router.navigate(['administration']);
  }
}
