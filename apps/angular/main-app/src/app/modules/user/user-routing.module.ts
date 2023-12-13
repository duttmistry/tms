import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { TimingHistoryComponent } from './timing-history/timing-history.component';

const routes: Routes = [
  {
    path:'',
    redirectTo:'profile',
    pathMatch:'full'
  },
  {
    path: 'profile',
    component: ProfileComponent,
  },
  {
    path: 'profile/:id',
    component: ProfileComponent,
  },
  {
    path: 'timing-history',
    component: TimingHistoryComponent,
  },
  {
    path: 'timing-history/:id',
    component: TimingHistoryComponent,
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule {}
