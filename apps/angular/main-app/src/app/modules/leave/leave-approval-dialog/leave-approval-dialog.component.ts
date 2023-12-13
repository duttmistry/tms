import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-leave-approval-dialog',
  templateUrl: './leave-approval-dialog.component.html',
  styleUrls: ['./leave-approval-dialog.component.scss'],
})
export class LeaveApprovalDialogComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<LeaveApprovalDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {}

  comment = new FormControl('');
  isSubmited = false
  ngOnInit(): void {}

  onApproveOrReject() {

    if (!this.comment.value && this.data.status == 'REJECTED') {
      this.isSubmited = true
      this.comment.markAsTouched();
    } else {
      this.dialogRef.close(this.comment.value);
    }
  }
}
