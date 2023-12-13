import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  //#region properties
  projectsForTasksKey = 'projectsForTasks';
  //#endregion
  constructor() {}

  // return data from localstorage based on key
  getFromLocalStorage(key: string) {
    return localStorage.getItem(key);
  }

  // set data into localstorage according to key
  setIntoLocalStorage(key: string, value: string) {
    localStorage.setItem(key, value);
  }

  // remove from localstorage based on key
  removeFromLocalStorage(key: string) {
    localStorage.removeItem(key);
  }

  // return data from session storage based on key
  getFromSessionStorage(key: string) {
    return sessionStorage.getItem(key);
  }

  // set data into session storage according to key
  setIntoSessionStorage(key: string, value: string) {
    sessionStorage.setItem(key, value);
  }

  // remove from session storage based on key
  removeFromSessionStorage(key: string) {
    sessionStorage.removeItem(key);
  }
}
