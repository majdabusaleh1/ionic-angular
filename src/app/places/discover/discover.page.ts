import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { SegmentChangeEventDetail } from '@ionic/core';
import { Subscription, take } from 'rxjs';

import { PlacesService } from '../places.service';
import { Place } from '../place.module';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular'; // Import Ionic Storage

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit, OnDestroy {
  loadedPlaces: Place[] = [];
  listedLoadedPlaces: Place[] = [];
  relevantPlaces: Place[] = [];
  isLoading = false;
  private placesSub!: Subscription;

  constructor(
    private placesService: PlacesService,
    private menuCtrl: MenuController,
    private authService: AuthService,
    private translate: TranslateService, // Injecting TranslateService
    private storage: Storage // Injecting Ionic Storage
  ) {}

  ngOnInit() {
    this.loadLanguage(); // Load the language setting when the page initializes

    this.placesSub = this.placesService.places.subscribe((places) => {
      this.loadedPlaces = places;
      this.relevantPlaces = this.loadedPlaces;
      this.listedLoadedPlaces = this.relevantPlaces.slice(1);
    });
  }

  private async loadLanguage() {
    const storedLang = await this.storage.get('selectedLang');
    const languageToUse = storedLang || 'en'; // Default to 'en' if no language is found
    this.translate.use(languageToUse);
    this.setAppDirection(languageToUse); // Set direction based on language
  }

  onOpenMenu() {
    this.menuCtrl.toggle();
  }

  onFilterUpdate(event: CustomEvent<SegmentChangeEventDetail>) {
    this.authService.userId.pipe(take(1)).subscribe((userId) => {
      if (event.detail.value === 'all') {
        this.relevantPlaces = this.loadedPlaces;
        this.listedLoadedPlaces = this.relevantPlaces.slice(1);
      } else {
        this.relevantPlaces = this.loadedPlaces.filter(
          (place) => place.userId !== userId
        );
        this.listedLoadedPlaces = this.relevantPlaces.slice(1);
      }
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.placesService.fetchPlaces().subscribe(() => {
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    if (this.placesSub) {
      this.placesSub.unsubscribe();
    }
  }

  // Method to switch language dynamically (if needed)
  async switchLanguage(lang: string) {
    this.translate.use(lang);
    this.storage.set('selectedLang', lang); // Save the language choice to Ionic Storage
  }

  private setAppDirection(lang: string) {
    const direction = lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', direction);
  }
}
