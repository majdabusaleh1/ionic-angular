import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  LoadingController,
  NavController,
} from '@ionic/angular';

import { PlacesService } from '../../places.service';
import { Place } from '../../place.module';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss'],
})
export class EditOfferPage implements OnInit, OnDestroy {
  place: Place = {
    id: '',
    title: '',
    description: '',
    imageUrl: '',
    price: 0,
    availableFrom: new Date(),
    availableTo: new Date(),
    userId: '',
  };
  form: FormGroup = new FormGroup({});
  private placeSub!: Subscription;
  isLoading = false;
  placeId: string = '';

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private placesService: PlacesService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private storage: Storage
  ) {}

  ngOnInit() {
    this.loadLanguage();

    this.route.paramMap.subscribe((paramMap) => {
      if (!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/offers');
        return;
      }
      this.isLoading = true;
      const placeId = paramMap.get('placeId');
      if (placeId) {
        this.placeSub = this.placesService.getPlace(placeId).subscribe(
          (fetchedPlace) => {
            if (fetchedPlace) {
              this.place = {
                id: fetchedPlace.id,
                title: fetchedPlace.title,
                description: fetchedPlace.description,
                imageUrl: fetchedPlace.imageUrl,
                price: fetchedPlace.price,
                availableFrom: fetchedPlace.availableFrom,
                availableTo: fetchedPlace.availableTo,
                userId: fetchedPlace.userId,
              };
              this.form = new FormGroup({
                title: new FormControl(this.place.title, {
                  updateOn: 'blur',
                  validators: [Validators.required],
                }),
                description: new FormControl(this.place.description, {
                  updateOn: 'blur',
                  validators: [Validators.required, Validators.maxLength(180)],
                }),
              });
              this.isLoading = false;
            }
          },
          (error) => {
            this.translate
              .get(['ERROR_OCCURRED', 'PLACE_FETCH_ERROR', 'OKAY'])
              .subscribe((translations) => {
                this.alertCtrl
                  .create({
                    header: translations['ERROR_OCCURRED'],
                    message: translations['PLACE_FETCH_ERROR'],
                    buttons: [
                      {
                        text: translations['OKAY'],
                        handler: () => {
                          this.router.navigate(['/places/tabs/offers']);
                        },
                      },
                    ],
                  })
                  .then((alertEl) => {
                    alertEl.present();
                  });
              });
          }
        );
      }
    });
  }

  onUpdateOffer() {
    if (!this.form.valid) {
      return;
    }
    this.translate.get('UPDATING_PLACE').subscribe((loadingMessage) => {
      this.loadingCtrl
        .create({
          message: loadingMessage, // Use translated message
        })
        .then((loadingEl) => {
          loadingEl.present();
          this.placesService
            .updatePlace(
              this.place.id,
              this.form.value.title,
              this.form.value.description
            )
            .subscribe(() => {
              loadingEl.dismiss();
              this.form.reset();
              this.router.navigate(['/places/tabs/offers']);
            });
        });
    });
  }

  ngOnDestroy() {
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
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
