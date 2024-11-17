import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, switchMap, take } from 'rxjs';
import { PlacesService } from '../../places.service';
import { Place } from '../../place.module';
import { AuthService } from 'src/app/auth/auth.service';
import {
  AlertController,
  LoadingController,
  ModalController,
  NavController,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';
import { CreateBookingComponent } from 'src/app/bookings/create-booking/create-booking.component';
import { BookingService } from 'src/app/bookings/booking.service';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {
  place!: Place;
  isBookable = false;
  isLoading = false;
  isAdmin = false;
  private placeSub!: Subscription;
  currentLang: string = 'en'; // Track the current language

  constructor(
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private placesService: PlacesService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private bookingService: BookingService,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private router: Router,
    private translate: TranslateService,
    private storage: Storage
  ) {}

  ngOnInit() {
    this.loadLanguage();

    this.route.paramMap.subscribe((paramMap) => {
      const placeId = paramMap.get('placeId');
      if (!placeId) {
        this.navCtrl.navigateBack('/places/tabs/discover');
        return;
      }
      this.isLoading = true;
      let fetchedUserId: string;
      this.authService.userId
        .pipe(
          take(1),
          switchMap((userId) => {
            if (!userId) {
              throw new Error(this.translate.instant('error.noUser'));
            }
            fetchedUserId = userId;
            this.isAdmin =
              this.authService.getCurrentUserEmail() ===
              'majd.abusaleh88@gmail.com';
            return this.placesService.getPlace(placeId);
          })
        )
        .subscribe(
          (place) => {
            this.place = place;
            this.isBookable = place.userId !== fetchedUserId;
            this.isLoading = false;
          },
          (error) => {
            this.showAlert(
              this.translate.instant('error.placeLoad'),
              error.message
            );
          }
        );
    });
  }

  private async loadLanguage() {
    const storedLang = await this.storage.get('selectedLang');
    this.currentLang = storedLang || 'en'; // Default to 'en' if no language is found
    this.translate.use(this.currentLang);
  }

  ngOnDestroy() {
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }

  onBookPlace() {
    this.actionSheetCtrl
      .create({
        header: this.translate.instant('actionSheet.header'),
        buttons: [
          {
            text: this.translate.instant('actionSheet.selectDate'),
            handler: () => this.openBookingModal('select'),
          },
          {
            text: this.translate.instant('actionSheet.randomDate'),
            handler: () => this.openBookingModal('random'),
          },
          {
            text: this.translate.instant('actionSheet.cancel'),
            role: 'cancel',
          },
        ],
      })
      .then((actionSheetEl) => actionSheetEl.present());
  }

  openBookingModal(mode: 'select' | 'random') {
    this.modalCtrl
      .create({
        component: CreateBookingComponent,
        componentProps: { selectedPlace: this.place, selectedMode: mode },
      })
      .then((modalEl) => {
        modalEl.present();
        return modalEl.onDidDismiss();
      })
      .then((resultData) => {
        if (resultData.role === 'confirm') {
          this.handleBookingConfirmation(resultData.data.bookingData);
        }
      });
  }

  private handleBookingConfirmation(data: any) {
    this.loadingCtrl
      .create({ message: this.translate.instant('loading.bookingPlace') })
      .then((loadingEl) => {
        loadingEl.present();
        this.bookingService
          .addBooking(
            this.place.id,
            this.place.title,
            this.place.imageUrl,
            data.firstName,
            data.lastName,
            data.guestNumber,
            data.startDate,
            data.endDate
          )
          .subscribe(() => loadingEl.dismiss());
      });
  }

  onDeletePlace() {
    if (!this.isAdmin) {
      this.showAlert(
        this.translate.instant('unauthorized.header'),
        this.translate.instant('unauthorized.message')
      );
      return;
    }

    this.alertCtrl
      .create({
        header: this.translate.instant('confirmDelete.header'),
        message: this.translate.instant('confirmDelete.message'),
        buttons: [
          {
            text: this.translate.instant('actionSheet.cancel'),
            role: 'cancel',
          },
          {
            text: this.translate.instant('actionSheet.delete'),
            handler: () => this.confirmDeletePlace(),
          },
        ],
      })
      .then((alertEl) => alertEl.present());
  }

  private confirmDeletePlace() {
    this.loadingCtrl
      .create({
        message: this.translate.instant('loading.deletingPlace'),
        spinner: 'crescent',
      })
      .then((loadingEl) => {
        loadingEl.present();
        this.bookingService.getBookingsForPlace(this.place.id).subscribe(
          (bookings) => {
            if (bookings && bookings.length > 0) {
              this.deleteBookingsAndPlace(loadingEl);
            } else {
              this.deletePlace(loadingEl);
            }
          },
          (error) => {
            console.error('Error fetching bookings for place:', error);
            loadingEl.dismiss();
          }
        );
      });
  }

  private deleteBookingsAndPlace(loadingEl: HTMLIonLoadingElement) {
    this.bookingService.deleteBookingsForPlace(this.place.id).subscribe(
      () => this.deletePlace(loadingEl),
      (error) => {
        console.error('Error deleting bookings:', error);
        loadingEl.dismiss();
      }
    );
  }

  private deletePlace(loadingEl: HTMLIonLoadingElement) {
    this.placesService.deletePlace(this.place.id).subscribe(
      () => {
        loadingEl.dismiss();
        this.router.navigate(['/places/tabs/discover']);
      },
      (error) => {
        console.error('Error deleting place:', error);
        loadingEl.dismiss();
      }
    );
  }

  private showAlert(header: string, message: string) {
    this.alertCtrl
      .create({
        header,
        message,
        buttons: [
          {
            text: this.translate.instant('actionSheet.okay'),
            handler: () => this.router.navigate(['/places/tabs/discover']),
          },
        ],
      })
      .then((alertEl) => alertEl.present());
  }
}
