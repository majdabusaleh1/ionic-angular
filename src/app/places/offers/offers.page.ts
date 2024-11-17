import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { IonItemSliding } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { PlacesService } from '../places.service';
import { Place } from '../place.module';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.page.html',
  styleUrls: ['./offers.page.scss'],
})
export class OffersPage implements OnInit, OnDestroy, AfterViewInit {
  offers: Place[] = [];
  isLoading = false;
  currentLang = 'en'; // Default language
  private placesSub!: Subscription;

  constructor(
    private placesService: PlacesService,
    private router: Router,
    private translate: TranslateService,
    private storage: Storage
  ) {}

  async ngOnInit() {
    this.loadLanguage();

    this.placesSub = this.placesService.places.subscribe((places) => {
      this.offers = places;
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.placesService.fetchPlaces().subscribe(() => {
      this.isLoading = false;
    });
  }

  onEdit(offerId: string, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.router.navigate(['/', 'places', 'tabs', 'offers', 'edit', offerId]);
    console.log('Editing item', offerId);
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

  ngOnDestroy() {
    if (this.placesSub) {
      this.placesSub.unsubscribe();
    }
  }

  // Lifecycle hook to apply inert on backdrop after the view is initialized
  ngAfterViewInit() {
    // Get the backdrop element using querySelector
    const backdrop = document.querySelector('ion-backdrop');
    if (backdrop) {
      backdrop.setAttribute('inert', 'true'); // Apply inert attribute to prevent focus
    }
  }
}
