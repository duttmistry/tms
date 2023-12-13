/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { TaskListTableService } from './task-list-table.service';

describe('Service: TaskListTable', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskListTableService]
    });
  });

  it('should ...', inject([TaskListTableService], (service: TaskListTableService) => {
    expect(service).toBeTruthy();
  }));
});
