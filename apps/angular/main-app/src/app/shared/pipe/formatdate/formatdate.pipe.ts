import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'formatdate',
})
export class FormatdatePipe implements PipeTransform {
  month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  transform(date: string | Date): string {
    if (date && typeof date == 'string') {
      const d = date.split('T')[0].split('-');
      const year = d[0];

      const month = d[1];
      const day = d[2];
      return `${day}/${month}/${year}`;
    } else if (date && date instanceof Date) {
      return moment(date).format('DD/MM/YYYY');
    } else {
      return '';
    }
  }
}
