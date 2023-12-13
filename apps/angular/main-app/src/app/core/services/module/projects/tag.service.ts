import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TagService {
  _base_url = environment.base_url;
  _tags_url = environment.tags_url;
  constructor(private httpClient: HttpClient) {}

  getAllTagData() {
    return this.httpClient.get(this._base_url + this._tags_url);
  }
}
