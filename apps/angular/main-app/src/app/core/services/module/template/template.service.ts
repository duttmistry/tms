import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  _base_url = environment.base_url;
  _template_url = environment.template;
  _getTemplateById_url = 'templateById';
  _variable_url = 'instanceVariable';
  constructor(private http: HttpClient) {}

  getTemplatesList() {
    return this.http.get(this._base_url + this._template_url);
  }

  createTemplate(body: any) {
    return this.http.post(this._base_url + this._template_url, body);
  }

  updateTemplate(body: any, id: any) {
    return this.http.put(this._base_url + this._template_url, body, {
      headers: {
        id: id.toString(),
      },
    });
  }

  getTemplateById(id: any) {
    return this.http.get(this._base_url + this._getTemplateById_url, {
      headers: { id: id.toString() },
    });
  }

  deleteTemplate(id: any) {
    return this.http.delete(this._base_url + this._template_url, {
      headers: {
        id: id.toString(),
      },
    });
  }

  getVariableList() {
    return this.http.get(this._base_url + this._variable_url);
  }
}
