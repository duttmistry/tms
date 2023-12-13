import { Component, OnInit } from '@angular/core';
import { HelpService } from '../../../core/services/module/help/help.service';

@Component({
  selector: 'main-app-tms-workspace-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
})
export class HelpComponent implements OnInit {
  //#region Data member
  public helpVideos: any;
  public showSpinner = true;

  //#endregion

  //#region Component Structure Methods
  constructor(private helpSerice: HelpService) {}
  ngOnInit(): void {
    this.gethelpVideo();
  }
  //#endregion

  //#region For member function

  //This method used for get help videos
  gethelpVideo() {
    this.showSpinner = true;

    this.helpSerice.getHelpsDetails().subscribe(
      (response: any) => {
        if (response) {
          if (response?.data && response.data[0]?.videos && response.data[0]?.videos.length > 0) {
            this.helpVideos = response?.data[0]?.videos;
          } else {
            this.helpVideos = [];
          }
        } else {
          this.helpVideos = [];
        }
        this.showSpinner = false;
      },
      (err: any) => {
        this.showSpinner = false;
      }
    );
  }

  // gethelpVideo(tabName: string) {
  //   this.showSpinner = true;

  //   let dataProperty: 'developerDetails' | 'hrDetails' | 'adminDetails' = 'developerDetails';
  //   switch (tabName) {
  //     case 'developers':
  //       dataProperty = 'developerDetails';
  //       break;
  //     case 'hr':
  //       dataProperty = 'hrDetails';
  //       break;
  //     case 'admin':
  //       dataProperty = 'adminDetails';
  //       break;
  //     default:
  //       break;
  //   }
  //   if (dataProperty) {
  //     this.helpSerice.getHelpsDetails(tabName).subscribe(
  //       (response: any) => {
  //         if (response) {
  //           if (response?.data && response.data[0]?.videos && response.data[0]?.videos.length > 0) {
  //             //  this[dataProperty] = response?.data[0]?.videos;
  //             this[dataProperty] = [
  //               {
  //                 id: 1,
  //                 url: 'https://example.com/dev1',
  //                 title: 'Developer help 1',
  //                 imageUrl: 'https://drive.google.com/uc?id=1F-x88y20gcDCyLZxUlAiWJMWbgFmkNv9',
  //                 description: `Workspace: How workspace works?	In this video, we'll dive into the fundamental concept of workspaces. Discover how to create new workspaces. Explore the access control and permission settings available in workspaces. Understand how to grant and manage permissions for team members to control who can see and edit content.`,
  //               },
  //               {
  //                 id: 2,
  //                 url: 'https://example.com/dev2',
  //                 title: 'Developer help 2',
  //                 imageUrl: 'https://drive.google.com/uc?id=1F-x88y20gcDCyLZxUlAiWJMWbgFmkNv9',
  //                 description: `Workspace: How workspace works?	In this video, we'll dive into the fundamental concept of workspaces. Discover how to create new workspaces. Explore the access control and permission settings available in workspaces. Understand how to grant and manage permissions for team members to control who can see and edit content.`,
  //               },
  //             ];
  //             // this[dataProperty] = this[dataProperty].map((item: any) => {
  //             //   // Assuming the imageUrl is in the format: https://drive.google.com/uc?id=FILE_ID
  //             //   const fileID = item.imageUrl.split('id=')[1];
  //             //   // Construct the direct link for previewing the image
  //             //   item.imageUrl = `https://drive.google.com/uc?id=${fileID}`;
  //             //   return item;
  //             // });
  //           } else {
  //             this[dataProperty] = [];
  //           }
  //         } else {
  //           this[dataProperty] = [];
  //         }
  //         this.showSpinner = false;
  //       },
  //       (err: any) => {
  //         this.showSpinner = false;
  //       }
  //     );
  //   } else {
  //     // Handle the case when tabName is not recognized
  //     this.showSpinner = false;
  //   }
  // }

  //This method used for navigate url in new window
  navigateToURL(url: string | undefined) {
    if (url) {
      window.open(url, '_blank'); // Opens the URL in a new tab
    }
  }
  //#endregion
}
