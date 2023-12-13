import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { UiMaterialControlsModule } from '@tms-workspace/material-controls';
import { QuillModule } from 'ngx-quill';
import { AngularFireMessagingModule } from '@angular/fire/compat/messaging';
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from '../environments/environment';

import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomMatPaginator } from './core/services/common/customMatPaginator';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CoreModule,
    UiMaterialControlsModule,
    QuillModule.forRoot(),
    AngularFireMessagingModule,
    AngularFireModule.initializeApp(environment.fireBaseConfig),
  ],
  schemas: [NO_ERRORS_SCHEMA],

  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: CustomMatPaginator,
  
    },
    {provide: 'environment', useValue: environment}
  ],

  bootstrap: [AppComponent],
})
export class AppModule {}
