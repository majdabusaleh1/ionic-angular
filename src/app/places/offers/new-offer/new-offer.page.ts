import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { PlacesService } from '../../places.service';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-new-offer',
  templateUrl: './new-offer.page.html',
  styleUrls: ['./new-offer.page.scss'],
})
export class NewOfferPage implements OnInit {
  form!: FormGroup;

  constructor(
    private placesService: PlacesService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private translate: TranslateService,
    private storage: Storage
  ) {}

  ngOnInit() {
    this.loadLanguage();

    this.form = new FormGroup({
      title: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required],
      }),
      description: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.maxLength(180)],
      }),
      price: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.min(1)],
      }),
      dateFrom: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required],
      }),
      dateTo: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required],
      }),
      imageUrl: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.pattern('https?://.+')],
      }), // Add imageUrl validation
    });
  }

  onCreateOffer() {
    if (!this.form.valid) {
      return;
    }
    this.translate.get('CREATING_OFFER').subscribe((loadingMessage) => {
      this.loadingCtrl.create({ message: loadingMessage }).then((loadEl) => {
        loadEl.present();
        this.placesService
          .addPlace(
            this.form.value.title,
            this.form.value.description,
            +this.form.value.price,
            new Date(this.form.value.dateFrom),
            new Date(this.form.value.dateTo),
            this.form.value.imageUrl // Pass imageUrl to the service
          )
          .subscribe(() => {
            loadEl.dismiss();
            this.form.reset();
            this.router.navigate(['/places/tabs/offers']);
          });
      });
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
