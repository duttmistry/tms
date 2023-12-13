import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replaceDot',
})
export class ReplaceDotPipe implements PipeTransform {
  // check if string (value) includes a dot, then replace it with ' > '
  transform(value: string, ...args: unknown[]): unknown {
    //   if (value && value.includes('.')) {
    //     value = value.replace('.', ' > ');
    //   }
    //   return value ? value : null;
    // }

    if (value) {
      // Replace dots with greater-than signs
      value = value.replace(/\./g, ' > ');

      // Capitalize the first letter of each word
      value = value
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return value ? value : null;
  }
}
