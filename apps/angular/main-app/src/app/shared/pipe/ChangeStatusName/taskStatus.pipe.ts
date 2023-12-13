import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'taskStatus',
})
export class TaskStatusPipe implements PipeTransform {
  transform(value: string): string {
    switch (value) {
      case 'task state':
        return 'Task Status';
      case 'task status':
        return 'Task Sub-Status';
      default:
        return value
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  }
}
