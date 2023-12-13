import { Pipe, PipeTransform } from '@angular/core';
import { Encryption } from '@tms-workspace/encryption';

@Pipe({
  name: 'decrypt',
})
export class DecryptPipe implements PipeTransform {
  constructor() {}

  transform(value: string): string {
    return Encryption._doEncrypt(value);
  }
}
