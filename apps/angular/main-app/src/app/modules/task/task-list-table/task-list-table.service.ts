import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TaskListTableService {
  columnSettings: any[] = [];

  getTableConfigSetting() {
    return this.columnSettings;
  }

  setTableConfigSetting(settings: any[]) {
    this.columnSettings = settings;
  }
}
