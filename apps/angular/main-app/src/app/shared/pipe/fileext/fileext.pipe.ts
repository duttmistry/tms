import { Pipe, PipeTransform } from '@angular/core';
const iconList = [
  { type: 'jpg', icon: 'fa fa-file-image-o' },
  { type: 'JPG', icon: 'fa fa-file-image-o' },
  { type: 'jpeg', icon: 'fa fa-file-image-o' },
  { type: 'JPEG', icon: 'fa fa-file-image-o' },
  { type: 'png', icon: 'fa fa-file-image-o' },
  { type: 'PNG', icon: 'fa fa-file-image-o' },
  { type: 'gif', icon: 'fa fa-file-image-o' },
  { type: 'GIF', icon: 'fa fa-file-image-o' },
  { type: 'pdf', icon: 'fa fa-file-pdf-o' },
  { type: 'PDF', icon: 'fa fa-file-pdf-o' },
  { type: 'doc', icon: 'fa fa-file-doc-o' },
  { type: 'DOC', icon: 'fa fa-file-doc-o' },
  { type: 'DOCX', icon: 'fa fa-file-doc-o' },
  { type: 'docx', icon: 'fa fa-file-doc-o' },
  { type: 'xls', icon: 'fa fa-file-excel-o' },
  { type: 'xlsx', icon: 'fa fa-file-excel-o' },
  { type: 'XLS', icon: 'fa fa-file-excel-o' },
  { type: 'XLSX', icon: 'fa fa-file-excel-o' },
];
@Pipe({
  name: 'FileExtension',
})
export class FileExtensionPipe implements PipeTransform {
  transform(value: any, ...args: any[]) {
    let ext = value.split('.').pop();
    let obj = iconList.filter((row) => {
      if (row.type === ext) {
        return true;
      } else {
        return false;
      }
    });
    if (obj.length > 0) {
      let icon = obj[0].icon;
      return icon;
    } else {
      return '';
    }
  }
}
