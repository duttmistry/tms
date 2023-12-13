import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { StorageService } from '../../common/storage.service';
import { STORAGE_CONSTANTS } from '../../common/constants';
import { Encryption } from '@tms-workspace/encryption';

@Injectable({
  providedIn: 'root'
})
export class IspreferenceGuard implements CanActivate {
  constructor(
    private storageService: StorageService,
    private router: Router,
  ) {

  }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const preference: any = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE);
    const _is_preference = Encryption._doDecrypt(preference);
    console.log('_is_preference: ', _is_preference);
    let is_preference: any = true;
    if (preference) {
      is_preference = JSON.parse(_is_preference);
    }
    // console.log('is_break_time: ', is_break_time);
    if (is_preference) {
      this.router.navigate(['dashboard']);
      return false;
    } else {
      return true
    }
  }
}
