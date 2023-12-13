import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpinnerService {
  //#region properties
  private showSpinnerStatus = new BehaviorSubject<boolean>(false);
  private _isSpinnerVisible = this.showSpinnerStatus.asObservable();
  //#endregion
  constructor() {
    // empty constructor
  }

  getSpinnerStatus(): Observable<boolean> {
    return this._isSpinnerVisible;
  }

  setSpinnerStatus(visibility: boolean) {
    this.showSpinnerStatus.next(visibility);
  }

  showSpinner() {
    this.setSpinnerStatus(true);
  }

  hideSpinner() {
    this.setSpinnerStatus(false);
  }
}
