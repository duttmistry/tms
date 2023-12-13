import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

@Pipe({
  name: 'hmFormat',
})
export class hmFormatPipe implements PipeTransform {
  constructor() {}

  transform(value: string): string {
    return (value.split(':')[0] == '00' ? '' : +value.split(':')[0] + 'h ') + (value.split(':')[1] == '00' ? '' : +value.split(':')[1] + 'm') || '0h';
  }
}
