import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NewOfferPageRoutingModule } from './new-offer-routing.module';

import { NewOfferPage } from './new-offer.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    NewOfferPageRoutingModule,
    TranslateModule,
  ],
  declarations: [NewOfferPage],
})
export class NewOfferPageModule {}
