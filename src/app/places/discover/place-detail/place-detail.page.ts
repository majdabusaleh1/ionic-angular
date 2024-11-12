import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  LoadingController,
  ModalController,
  NavController,
} from '@ionic/angular';
import { CreateBookingComponent } from 'src/app/bookings/create-booking/create-booking.component';
import { Place } from '../../place.module';
import { PlacesService } from '../../places.service';
import { Subscription, switchMap, take } from 'rxjs';
import { BookingService } from 'src/app/bookings/booking.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {
  place!: Place;
  isBookable = false;
  isLoading = false;
  isAdmin = false; // New isAdmin property to check admin status
  private placeSub!: Subscription;

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
    private router: Router
  ) {}

  ngOnInit() {
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
              throw new Error('Found no user!');
            }
            fetchedUserId = userId;
            this.isAdmin =
              this.authService.getCurrentUserEmail() ===
              'majd.abusaleh88@gmail.com'; // Check if user is admin
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
            this.showAlert('An error occurred!', 'Could not load place.');
          }
        );
    });
  }

  onBookPlace() {
    this.actionSheetCtrl
      .create({
        header: 'Choose an Action',
        buttons: [
          {
            text: 'Select Date',
            handler: () => this.openBookingModal('select'),
          },
          {
            text: 'Random Date',
            handler: () => this.openBookingModal('random'),
          },
          { text: 'Cancel', role: 'cancel' },
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
      .create({ message: 'Booking place...' })
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

  // Function to confirm and delete the place, only if the user is an admin
  onDeletePlace() {
    if (!this.isAdmin) {
      this.showAlert(
        'Unauthorized',
        'You do not have permission to delete this place.'
      );
      return;
    }

    this.alertCtrl
      .create({
        header: 'Confirm Delete',
        message: 'Are you sure you want to delete this place?',
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Delete', handler: () => this.confirmDeletePlace() },
        ],
      })
      .then((alertEl) => alertEl.present());
  }

  private confirmDeletePlace() {
    this.loadingCtrl
      .create({ message: 'Deleting place...', spinner: 'crescent' })
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
            text: 'Okay',
            handler: () => this.router.navigate(['/places/tabs/discover']),
          },
        ],
      })
      .then((alertEl) => alertEl.present());
  }

  ngOnDestroy() {
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }
}
