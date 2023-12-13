import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replaceh',
})
export class replaceHPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace('h', ' Hours').replace('m', ' Minutes');
  }
}
