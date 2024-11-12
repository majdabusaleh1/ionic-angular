import { Component, Input, OnInit } from '@angular/core';
import { Place } from '../../place.module';
import { PlacesService } from '../../places.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';

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
    private placesService: PlacesService
  ) {}

  ngOnInit() {
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
}
