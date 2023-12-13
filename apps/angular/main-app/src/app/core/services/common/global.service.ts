import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../../../../../../../../libs/ui/material-controls/src/lib/snackbar/snackbar.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../src/environments/environment';
import { ProjectTeamMember } from '../../model/task/task.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class GlobalService {
  expectedDocumentsFileTypes: string[] = ['jpg', 'jpeg', 'png', 'gif', 'txt', 'doc', 'docx', 'pdf', 'xls', 'xlsx', 'json', 'ppt', 'pptx'];
  projectUploadDocumentFileTypes: string[] = ['doc', 'pdf', 'docx', 'ppt', 'pptx'];
  expectedAvatarFileTypes: string[] = ['jpg', 'jpeg', 'png', 'gif'];
  leaveDocumentsFileTypes: string[] = ['jpg', 'jpeg', 'png', 'gif', 'doc', 'pdf', 'docx', 'xls', 'xlsx'];
  presetColors = [
    '#282828',
    '#800101',
    '#E50101',
    '#FF4081',
    '#FF7FAB',
    '#F901EA',
    '#EA80FC',
    '#BF55EC',
    '#9B59B6',
    '#7C4DFF',
    '#0231E8',
    '#5E68C8',
    '#3397DD',
    '#3082B7',
    '#04A9F4',
    '#02BCD4',
    '#1BBC9C',
    '#2ECD6F',
    '#F9D901',
    '#AF7E2E',
    '#FF7801',
    '#E65101',
    '#60B158',
    '#81B1FF',
    '#FF9933',
  ];
  URLRegEx =
    '(https://www.|http://www.|https://|http://)?[a-zA-Z]{2,}(.[a-zA-Z]{2,})(.[a-zA-Z]{2,})?/[a-zA-Z0-9]{2,}|((https://www.|http://www.|https://|http://)?[a-zA-Z]{2,}(.[a-zA-Z]{2,})(.[a-zA-Z]{2,})?)|(https://www.|http://www.|https://|http://)?[a-zA-Z0-9]{2,}.[a-zA-Z0-9]{2,}.[a-zA-Z0-9]{2,}(.[a-zA-Z0-9]{2,})?';
  //'(https://www.|http://www.|https://|http://)?[a-zA-Z0-9]{2,}(.[a-zA-Z0-9]{2,})(.[a-zA-Z0-9]{2,})?';

  // '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?';

  _base_url = environment.base_url;
  _user_profile_url = environment.user_profile_url;

  // jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|pdf|PDF|doc|DOC|DOCX|docx|xls|xlsx|XLS|XLSX

  constructor(private _snackBar: MatSnackBar, private httpClient: HttpClient, private router: Router) {}

  // function used to check file type
  checkFileType(file: File, expectedFileTypes: string[]): boolean {
    // console.log(file);

    const fileTypeArray = file.name.split('.');
    if (fileTypeArray && fileTypeArray.length > 0) {
      const fileType = fileTypeArray[fileTypeArray.length - 1];
      // console.log(fileTypeArray, fileType);
      if (fileType && expectedFileTypes.includes(fileType.toLocaleLowerCase())) {
        return true;
      } else {
        this._snackBar.openFromComponent(SnackbarComponent, {
          data: { message: `${expectedFileTypes.join(', ')} extensions are allowed only.` },
          duration: 45000,
        });

        return false;
      }
    } else {
      return false;
    }
  }

  checkFileSize(file: File, max_size: number): boolean {
    if (Math.floor(file.size / 1024 / 1024) < max_size) return true;
    else {
      this._snackBar.openFromComponent(SnackbarComponent, {
        data: { message: `File size should not be more than ${max_size}  mb` },
        duration: 45000,
      });

      return false;
    }
  }

  // urlify(text: string) {
  //   console.log('urlify fuc', text.toString());

  //   let urlRegex =
  //     /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(.[a-zA-Z]{2,})(.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(.[a-zA-Z]{2,})(.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}.[a-zA-Z0-9]{2,}.[a-zA-Z0-9]{2,}(.[a-zA-Z0-9]{2,})?/;

  //   //  /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/;

  //   return text.replace(urlRegex, (url: any) => {
  //     console.log('url', url);

  //     return '<a href="' + url + '">' + url + '</a>';
  //   });
  //   // or alternatively
  //   // return text.replace(urlRegex, '<a href="$1">$1</a>')
  // }

  public getPermissionProfile(id: any) {
    return this.httpClient.get(this._base_url + this._user_profile_url, {
      headers: {
        id,
      },
    });
  }

  // return full name
  getFullName(first_name: string, last_name: string): string {
    return `${first_name ? first_name : ''} ${last_name ? last_name : ''}`;
  }

  // return date with ISO format
  convertToISO(dateString: string) {
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    const isoString = date.toISOString();
    return isoString;
  }

  // set team members in mention user list
  setMentionUsersList(projectTeamMemberList: ProjectTeamMember[]): { id: number; value: string }[] {
    const mentionList: { id: number; value: string }[] = [];
    projectTeamMemberList.forEach((teamMember: ProjectTeamMember) => {
      mentionList.push({
        id: teamMember.id,
        value: teamMember.name || '',
      });
    });
    return mentionList;
  }

  // This method will navigate to the unauthorized page
  navigateToUnAuthorizedPage() {
    this.router.navigate(['/unauthorized-access']);
  }
}
