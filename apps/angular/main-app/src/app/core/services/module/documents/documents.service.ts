import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'apps/angular/main-app/src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DocumentsService {
  _base_url = environment.base_url;
  _document_url = environment.document_url;
  constructor(private httpClient: HttpClient) {}

  addUpdateDocuments(body: any, type: string, id: string) {
    return this.httpClient.post(this._base_url + this._document_url, body, {
      headers: {
        type: type,
        id: id.toString(),
      },
    });
  }

  getDocumentFile(file_path: string) {
    return this.httpClient.get(this._base_url + file_path, {
      responseType: 'blob',
    });
  }
}
