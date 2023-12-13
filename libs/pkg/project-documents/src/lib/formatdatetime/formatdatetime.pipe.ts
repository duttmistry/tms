import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'formatdatetime',
})
export class FormatdatetimePipe implements PipeTransform {
 transform(date: string | Date): string {
    if (date && typeof date == 'string') {
    
      return moment(date).format('DD/MM/YYYY, h:mm a')
    }else {
      return '';
    }
  }
}
