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
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
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
            this.alertCtrl
              .create({
                header: 'An error occurred',
                message: 'Place could not be fetched, try again later.',
                buttons: [
                  {
                    text: 'Okay',
                    handler: () => {
                      this.router.navigate(['/places/tabs/offers']);
                    },
                  },
                ],
              })
              .then((alertEl) => {
                alertEl.present();
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
    this.loadingCtrl
      .create({
        message: 'Updating Place...',
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
  }

  ngOnDestroy() {
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }
}
