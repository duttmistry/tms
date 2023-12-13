import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'apps/angular/main-app/src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TagsService {
  _base_url = environment.base_url;
  _get_tags_url = environment.tags_url;
  _get_tag_url = environment.tag_url;

  constructor(private httpClient: HttpClient) {}

  // To get all the users from the server
  getTagsList(params: any) {
    return this.httpClient.get(this._base_url + this._get_tags_url + '/list', {
      params,
    });
  }
  getAllTags() {
    return this.httpClient.get(this._base_url + this._get_tags_url);
  }

  addTags(tags: any) {
    return this.httpClient.post(this._base_url + this._get_tags_url, tags);
  }

  deleteTag(id: number) {
    return this.httpClient.delete(this._base_url + this._get_tag_url, {
      headers: {
        id: id.toString(),
      },
    });
  }

  updateTags(data: any) {
    const reqBody = {
      title: data.title,
    };
    return this.httpClient.put(this._base_url + this._get_tag_url, reqBody, {
      headers: {
        id: data.id.toString(),
      },
    });
  }
}
