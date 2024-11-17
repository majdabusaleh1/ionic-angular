import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PlacesPageRoutingModule } from './places-routing.module';

import { PlacesPage } from './places.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PlacesPageRoutingModule,
    TranslateModule,
  ],
  declarations: [PlacesPage],
})
export class PlacesPageModule {}
