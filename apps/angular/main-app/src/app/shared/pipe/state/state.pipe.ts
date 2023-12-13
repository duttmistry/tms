import { Pipe, PipeTransform } from '@angular/core';
import { Encryption } from '@tms-workspace/encryption';
import { Utility } from '../../../core/utilities/utility';
@Pipe({
  name: 'stateText',
})
export class StatePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return '-';
    }
    return Utility.stateList.find((state) => state.value === value)?.title || value;
  }
}
