import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './components/login/login.component';
import { CountdownModule } from 'ngx-countdown';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { interceptorService } from './services/interceptors/interceptors';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LayoutComponent } from './components/layout/layout.component';
import { SharedModule } from '../shared/shared.module';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { SetPreferenceComponent } from './components/set-preference/set-preference.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MaintenanceComponent } from './components/maintenance/maintenance.component';
import { BreakTimeComponent } from './components/break-time/break-time.component';

@NgModule({
  declarations: [
    LoginComponent,
    HeaderComponent,
    SidebarComponent,
    LayoutComponent,
    SetPreferenceComponent,
    MaintenanceComponent,
    BreakTimeComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    CountdownModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    UiMaterialControlsModule,
    SharedModule,
    CarouselModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: interceptorService,
      multi: true,
    },
  ],
  exports: [LoginComponent, MaintenanceComponent, BreakTimeComponent, BreakTimeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CoreModule { }
