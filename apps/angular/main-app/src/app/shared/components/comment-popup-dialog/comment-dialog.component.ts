import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-comment-dialog',
  templateUrl: './comment-dialog.component.html',
  styleUrls: ['./comment-dialog.component.scss'],
})
export class CommentDialogComponent implements OnInit {
  comment: FormControl;
  isSubmitted = false;
  constructor(public dialogRef: MatDialogRef<CommentDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    if (this.data.comment_required) {
      this.comment = new FormControl('', [Validators.required, Validators.minLength(3)]);
    } else {
      this.comment = new FormControl('');
    }
  }

  onClose(data: string) {
    if (data === 'Yes') {
      if (this.comment.valid) {
        this.dialogRef.close({
          confirm: true,
          comment: this.comment.value ? this.comment.value.trim() : '',
        });
      }
    } else {
      this.dialogRef.close({
        confirm: false,
        comment: this.comment.value ? this.comment.value.trim() : '',
      });
    }
  }
  ngOnInit(): void {}
}
