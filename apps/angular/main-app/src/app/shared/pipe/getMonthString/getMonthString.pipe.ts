import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

@Pipe({
  name: 'getMonthString',
})
export class getMonthStringPipe implements PipeTransform {
  constructor() {}

  transform(value: number): string {
    return moment().month(value).format('MMMM');
  }
}
