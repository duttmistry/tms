import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { catchError, map, throwError } from 'rxjs';
import { StorageService } from '../../common/storage.service';

@Injectable({
  providedIn: 'root',
})
export class HolidayService {
  _base_url = environment.base_url;
  _holiday_url = environment.holiday_url;
  constructor(private httpClient: HttpClient) {}

  getAllHoliday(params: any) {
    return this.httpClient
      .get<any>(this._base_url + this._holiday_url, {
        params,
      })
      .pipe(map((res) => res.data));
  }
  getUpcommingHoliday(params: any) {
    return this.httpClient
      .get<any>(this._base_url + this._holiday_url + '/upcomming', {
        params,
      })
      .pipe(map((res) => res.data));
  }

  getHolidayById(id: string) {
    return this.httpClient.get(this._base_url + this._holiday_url + '/single', {
      headers: {
        id,
      },
    });
  }

  addHoliday(body: any) {
    return this.httpClient.post<any>(this._base_url + this._holiday_url, body);
  }

  updateHoliday(body: any, id: string) {
    return this.httpClient.put(this._base_url + this._holiday_url, body, {
      headers: {
        id,
      },
    });
  }

  deleteHoliday(id: string) {
    const _id = JSON.stringify(id);
    return this.httpClient.delete(this._base_url + this._holiday_url, {
      headers: {
        id: _id,
      },
    });
  }
}
