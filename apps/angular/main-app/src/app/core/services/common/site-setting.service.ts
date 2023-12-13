import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SiteSettingService {
  _base_url = environment.base_url;
  _site_setting_url = environment.site_setting_url;
  constructor(private httpClient: HttpClient) {}

  getPermissionTemplate() {
    return this.httpClient.get(this._base_url + this._site_setting_url, {
      headers: {
        name: 'permission_object',
      },
    });
  }

  getModuleWiseSiteSettingsData(name: string) {
    return this.httpClient.get(this._base_url + 'getByModule', {
      headers: {
        module: name,
      },
    });
  }

  setModuleWiseSiteSettingsData(body: any) {
    return this.httpClient.post(this._base_url + 'setModulewiseField', body);
  }
  setCEOProfile(id: any) {
    return this.httpClient.put(this._base_url + 'ceo',{}, {
      headers: {
        user_id: id.toString(),
      },
    });
  }
  getCEOProfile(id:any) {
    return this.httpClient.get(this._base_url + 'ceo', {
      headers: {
        id: id.toString(),
      },
    });
  }
  getLateArrivalThreshold() {
    return this.httpClient.get(this._base_url + this._site_setting_url, {
      headers: {
        name: 'Late Arrival Threshold',
      },
    });
  }
}
