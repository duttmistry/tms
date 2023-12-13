import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable()
export class CustomMatPaginator extends MatPaginatorIntl {
  constructor() {
    super();

    this.nextPageLabel = 'Next Page';
    this.previousPageLabel = 'Privious Page';
    this.firstPageLabel = 'First Page';
    this.itemsPerPageLabel = 'Items per page';
    this.lastPageLabel = 'Last Page';
  }
}
