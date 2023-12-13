import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { StorageService } from '../../common/storage.service';
import { Encryption } from '@tms-workspace/encryption';
import { STORAGE_CONSTANTS } from '../../common/constants';

@Injectable({
  providedIn: 'root'
})
export class BackFromBackGuard implements CanActivate {
  constructor(private storageService: StorageService, private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
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
      return true
    }
  }

}
