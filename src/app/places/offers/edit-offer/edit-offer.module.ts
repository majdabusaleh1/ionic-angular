import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditOfferPageRoutingModule } from './edit-offer-routing.module';

import { EditOfferPage } from './edit-offer.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    EditOfferPageRoutingModule,
    TranslateModule,
  ],
  declarations: [EditOfferPage],
})
export class EditOfferPageModule {}
