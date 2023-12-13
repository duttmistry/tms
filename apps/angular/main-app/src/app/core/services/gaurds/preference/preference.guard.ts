import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree, CanLoad } from '@angular/router';
import { Observable } from 'rxjs';
import { StorageService } from '../../common/storage.service';
import { Encryption } from '@tms-workspace/encryption';
import { STORAGE_CONSTANTS } from '../../common/constants';

@Injectable({
  providedIn: 'root'
})
export class PreferenceGuard implements CanActivate, CanLoad {
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
    // console.log('_is_preference: ', _is_preference);
    let is_preference: any = true;
    if (preference) {
      is_preference = JSON.parse(_is_preference);
      // console.log('is_preference: ', is_preference);
    }
    // console.log('is_break_time: ', is_break_time);
    if (!is_preference) {
      this.router.navigate(['setpreferences']);
      return false;
    } else {
      return true
    }
  }
  canLoad(route: Route, segments: UrlSegment[]): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    const preference: any = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.SET_PREFERENCE);
    const _is_preference = Encryption._doDecrypt(preference);
    let is_preference: any = true;
    if (preference) {
      is_preference = JSON.parse(_is_preference);
      // console.log('is_preference: ', !is_preference);
    }
    // console.log('is_break_time: ', is_break_time);
    if (!is_preference) {
      this.router.navigate(['setpreferences']);
      return false;
    } else {
      return true
    }
  }
}
