import { FormControl } from '@angular/forms';

interface ITask {
  id: string;
  content: string;
  labelName: string;
  checkBoxName: string;
}

export class Column {
  constructor(
    public control: FormControl,
    public id: string,
    public task: ITask[]
  ) {}
}
