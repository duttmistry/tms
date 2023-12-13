import { Encryption } from '@tms-workspace/encryption';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { StorageService } from '../../common/storage.service';
import { STORAGE_CONSTANTS } from '../../common/constants';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanLoad, CanActivate {
  constructor(private storageService: StorageService, private router: Router) { }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    const accessToken = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.ACCESS_TOKEN);
    if (accessToken) {
      if (this.isTokenExpired(accessToken)) {
        return true;
      } else {
        this.router.navigate(['dashboard']);
        return false;
      }
    } else {
      return true;
    }
  }
  // check if access_token is not available then navigate to login page else return true
  canLoad(route: Route, segments: UrlSegment[]): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    const accessToken = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.ACCESS_TOKEN);
    if (accessToken) {
      if (this.isTokenExpired(accessToken)) {
        this.router.navigate(['login']);
        return false;
      } else {
        const break_time: any = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.IS_BREAK_TIME);
        const _is_break_time = Encryption._doDecrypt(break_time);
        let is_break_time: any = false;
        if (break_time) {
          is_break_time = JSON.parse(_is_break_time);
        }
        // console.log('is_break_time: ', is_break_time);
        if (!is_break_time) {
          return true;
        } else {
          this.router.navigate(['breaktime']);
          return false
        }
      }
    } else {
      this.router.navigate(['login']);
      return false;
    }
  }

  isTokenExpired(accessToken: string) {
    // temporary commented isTokenExpired logic to check different leave balance cases
    return false;
    // const expiry = JSON.parse(atob(accessToken.split('.')[1])).exp;
    // console.log(Math.floor(new Date().getTime() / 1000), expiry);
    // return Math.floor(new Date().getTime() / 1000) >= expiry;
  }
}
