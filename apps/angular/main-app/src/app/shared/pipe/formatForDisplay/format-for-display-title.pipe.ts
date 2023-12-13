import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatForDisplayTitle',
})

//This pipe used for the convert the name to lowercase and remove underscore
export class FormatForDisplayTitlePipe implements PipeTransform {
  transform(value: string): string {
    if (value) {
      const lowercaseValue = value.replace(/_/g, ' ').toLowerCase();
      // Check for the special case
      // Handle specific cases
      if (lowercaseValue === 'back from break') {
        return 'Back from Break';
      } else if (lowercaseValue === 'break time') {
        return 'Break Time';
      } else if (lowercaseValue == 'manual time add') {
        return 'Manual Worked Hours Addition';
      } else if (lowercaseValue == 'manual time remove') {
        return 'Manual Worked Hours Deduction';
      }
      return lowercaseValue.charAt(0).toUpperCase() + lowercaseValue.slice(1);
    }
    return value;
  }
}
