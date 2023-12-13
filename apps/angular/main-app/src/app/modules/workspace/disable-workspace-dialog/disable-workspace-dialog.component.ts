import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-disable-workspace-dialog',
  templateUrl: './disable-workspace-dialog.component.html',
  styleUrls: ['./disable-workspace-dialog.component.scss'],
})
export class DisableWorkspaceDialogComponent implements OnInit {
  typeDisable = '';
  errorMsg = '';
  constructor(public dialogRef: MatDialogRef<DisableWorkspaceDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {}

  onConfirm() {
    if ((this.data.is_active && this.typeDisable == 'DISABLE') || (!this.data.is_active && this.typeDisable == 'ENABLE')) {
      this.dialogRef.close(true);
    } else {
      this.errorMsg = `Please type ${this.data.is_active ? 'DISABLE' : 'ENABLE'} to confirm.`;
    }
  }
}
