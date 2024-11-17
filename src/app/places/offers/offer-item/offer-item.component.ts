import { Component, Input, OnInit } from '@angular/core';
import { Place } from '../../place.module';
import { PlacesService } from '../../places.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-offer-item',
  templateUrl: './offer-item.component.html',
  styleUrls: ['./offer-item.component.scss'],
})
export class OfferItemComponent implements OnInit {
  @Input() offer: Place = {
    id: '',
    title: '',
    description: '',
    imageUrl: '',
    price: 0,
    availableFrom: new Date(),
    availableTo: new Date(),
    userId: '',
  };
  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private placesService: PlacesService,
    private translate: TranslateService,
    private storage: Storage
  ) {}

  ngOnInit() {
    this.loadLanguage();

    this.route.paramMap.subscribe((paramMap) => {
      if (!paramMap.has('placeId')) {
        //this.navCtrl.navigateBack('/places/tabs/offers');
        return;
      }

      const placeId = paramMap.get('placeId');
      if (placeId) {
        this.placesService.getPlace(placeId).subscribe((fetchedPlace) => {
          if (fetchedPlace) {
            this.offer = {
              id: fetchedPlace.id,
              title: fetchedPlace.title,
              description: fetchedPlace.description,
              imageUrl: fetchedPlace.imageUrl,
              price: fetchedPlace.price,
              availableFrom: fetchedPlace.availableFrom,
              availableTo: fetchedPlace.availableTo,
              userId: fetchedPlace.userId,
            };
          }
        });
      }
    });
  }

  private async loadLanguage() {
    const storedLang = await this.storage.get('selectedLang');
    const languageToUse = storedLang || 'en'; // Default to 'en' if no language is found
    this.translate.use(languageToUse);
    this.setAppDirection(languageToUse); // Set direction based on language
  }
  async switchLanguage(lang: string) {
    this.translate.use(lang);
    this.storage.set('selectedLang', lang); // Save the language choice to Ionic Storage
  }

  private setAppDirection(lang: string) {
    const direction = lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', direction);
  }
}
