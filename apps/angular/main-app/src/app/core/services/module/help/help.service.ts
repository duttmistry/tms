import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../../src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HelpService {
  _base_url = environment.base_url;
  _get_help_details = environment.get_help_details;
  constructor(private httpClient: HttpClient) {}

  getHelpsDetails() {
    return this.httpClient.get(this._base_url + this._get_help_details, {
      // headers: {
      //   category: tabName ? tabName.toUpperCase() : '',
      // },
    });
  }
}
