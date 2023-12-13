import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SiteSettingService } from '../../../core/services/common/site-setting.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '@tms-workspace/material-controls';
import { UserService } from '../../../core/services/module/users/users.service';

@Component({
  selector: 'tms-workspace-ceo-profile',
  templateUrl: './ceo-profile.component.html',
  styleUrls: ['./ceo-profile.component.scss'],
})
export class CeoProfileComponent {
  profileForm: FormGroup;
  profilePhoto: any;
  teamMembersList = [];
  selected = -1;
  showSpinner = true;
  leaveResponsiblePersons: any = [];
  isSelectedPersonData: any;
  assigneeSelectionTaskId = null;
  showError = true;
  module = 'CEOProfile';
  constructor(
    private siteSettingsService: SiteSettingService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private userService: UserService
  ) {
    this.profileForm = this.formBuilder.group({
      text: ['', Validators.required],
      photo: [null, Validators.required], // Added a form control for the profile photo
    });
  }

  ngOnInit(): void {
    // You can perform additional initialization in ngOnInit if needed
    this.getTeamMembersData();
    this.getCeoProfile();
  }

  getCeoProfile() {
    const id = 1;
    this.siteSettingsService.getCEOProfile(id).subscribe(
      (res: any) => {
        if (res) {
          // this.ceoProfileData = res;
          this.leaveResponsiblePersons = [res?.user_id];
        }
      },
      (error) => {
        //  console.log('error: ', error);
      }
    );
  }
  getTeamMembersData() {
    this.showSpinner = true;
    // this.spinnerService.showSpinner();
    this.userService.getAllUsers({ sortBy: 'first_name', orderBy: 'asc' }).subscribe(
      (response: any) => {
        // this.spinnerService.hideSpinner();
        if (response) {
          const responseData = response.data || '';
          if (responseData && responseData.list && responseData.list.length > 0) {
            this.teamMembersList = responseData.list || [];
          }
        }
        this.showSpinner = false;
      },
      (error) => {
        // this.spinnerService.hideSpinner();
        this.showSpinner = false;
        console.log('error', error);
      }
    );
  }
  onCancel() {
    this.getTeamMembersData();
  }
  onSubmit() {
    // Handle form submission, e.g., send data to the server
    if (this.leaveResponsiblePersons?.length > 0) {
      this.showError = true;
      const id = this.leaveResponsiblePersons[0];
      // const id = 1;
      this.siteSettingsService.setCEOProfile(id).subscribe(
        (res: any) => {
          if (res) {
            // console.log('res.data: ', res);
            this.snackBar.openFromComponent(SnackbarComponent, {
              data: { message: 'CEO profile has been updated successfully.' },
              duration: 4000,
            });
            // this.profileForm.reset();
            // this.removeProfilePhoto();
          }
        },
        (error) => {
          // console.log('error: ', error);
        }
      );
    } else {
      this.showError = false;
    }
  }

  // openFileInput() {
  //   // Trigger the file input field
  //   const fileInput: any = document.querySelector('input[type="file"]');
  //   fileInput.click();
  // }

  // onFileSelected(event: any) {
  //   const file = event.target.files[0];
  //   if (file) {
  //     this.profileForm.get('photo')?.setValue(file); // Set the photo form control value to the selected file
  //     // Handle the selected file, e.g., display it as a preview
  //     const reader = new FileReader();
  //     reader.onload = (e: any) => {
  //       this.profilePhoto = e.target.result;
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // }

  // removeProfilePhoto() {
  //   // Implement the logic to remove the profile photo
  //   this.profileForm.get('photo')?.setValue(null); // Clear the photo form control value
  //   this.profilePhoto = null;
  //   // Clear the file input to allow reuploads
  //   const fileInput: any = document.querySelector('input[type="file"]');
  //   fileInput.value = '';
  // }
  selectLeaveresponsiblePerson(event: any) {
    this.leaveResponsiblePersons = [];
    this.isSelectedPersonData = this.leaveResponsiblePersons.push(event.id);
  }

  deleteLeaveResponsiblePerson(event: any) {
    this.leaveResponsiblePersons = [];
    // this.leaveResponsiblePersons = this.leaveResponsiblePersons.filter((userId: any) => userId !== event.id);
  }
}
