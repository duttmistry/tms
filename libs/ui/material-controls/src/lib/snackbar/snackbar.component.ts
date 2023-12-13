import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  selector: 'main-app-snackbar',
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss'],
})
export class SnackbarComponent {
  //#region for Variable declaration

  public message!: string;

  //#endregion

  //#region for Component Structure Methods

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any, public snackBarRef: MatSnackBarRef<SnackbarComponent>) {
    this.message = data.message;
  }

  //#endregion

  //#region for Basic All methods

  dismiss(): void {
    this.snackBarRef.dismiss();
  }

  //#endregion
}
