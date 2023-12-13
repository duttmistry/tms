import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavigationStart, Router } from '@angular/router';

import { Observable, catchError, finalize, throwError } from 'rxjs';
import { StorageService } from '../common/storage.service';
import { LoginService } from '../login/login.service';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { PERMISSION_CONSTANTS, STORAGE_CONSTANTS } from '../common/constants';

@Injectable()
export class interceptorService implements HttpInterceptor {
  constructor(private storageService: StorageService, private router: Router, private loginService: LoginService, private _snackBar: MatSnackBar) { }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = req.url.split('/').pop();
    let newReq = req;
    // const access_token = this.storageService.getFromLocalStorage('accessToken') || '';
    // const jwtPayload = JSON.parse(window.atob(access_token.split('.')[1]));
    // console.log('jwtPayload:', jwtPayload);
    // console.log('access_token:', access_token);
    if (req.url == 'http://api.ipify.org/?format=json') {
      return next.handle(newReq);
    }
    if (url == 'login') {
      newReq = req.clone({
        setHeaders: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': '*',
        },
      });
      return next
        .handle(newReq)
        .pipe(
          catchError((error) => {
            if (error.error && error.error.message) {
              this._snackBar.openFromComponent(SnackbarComponent, {
                data: { message: error.error.message },
                duration: 45000,
              });
            }

            return throwError(() => error);
          })
        )
        .pipe(
          finalize(() => {
            this.router.events.subscribe((event) => {
              if (event instanceof NavigationStart) {
                // Close the snack-bar when navigating to a different page
                this._snackBar.dismiss();
              }
            });
          })
        );
    } else if (url == 'logout') {
      const access_token = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.ACCESS_TOKEN);
      const session_id = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.SESSION_ID);
      newReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${access_token}`,
          sessionId: session_id || '',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': '*',
        },
      });
      return next.handle(newReq).pipe(
        catchError((error) => {
          this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.ACCESS_TOKEN);
          this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.USER_DATA);
          this.storageService.removeFromLocalStorage(PERMISSION_CONSTANTS.PERMISSION);
          this.storageService.removeFromLocalStorage(STORAGE_CONSTANTS.SESSION_ID);

          this.router.navigate(['login']);
          return throwError(() => 'access denied');
        })
      );
    } else {
      const access_token = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.ACCESS_TOKEN);
      const session_id = this.storageService.getFromLocalStorage(STORAGE_CONSTANTS.SESSION_ID);
      newReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${access_token}`,
          sessionId: session_id || '',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': '*',
        },
      });

      return next
        .handle(newReq)
        .pipe(
          catchError((error) => {
            if (error?.error?.status == 401) {
              // console.log('yes');
              this.loginService.logout();
            } else if (error?.error?.status == 403) {
              this.router.navigate(['/unauthorized-access']);
            }
            if (error.error && error.error.message) {
              this._snackBar.openFromComponent(SnackbarComponent, {
                data: { message: error.error.message },
                duration: 45000,
              });
            }

            return throwError(() => error);
          })
        )
        .pipe(
          finalize(() => {
            this.router.events.subscribe((event) => {
              if (event instanceof NavigationStart) {
                // Close the snack-bar when navigating to a different page
                this._snackBar.dismiss();
              }
            });
          })
        );
    }
  }
}
