import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { take, tap, switchMap, map } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';
import { Booking } from './booking.module';

interface BookingData {
  bookedFrom: string;
  bookedTo: string;
  firstName: string;
  guestNumber: string;
  lastName: string;
  placeId: string;
  placeImage: string;
  placeTitle: string;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private _bookings = new BehaviorSubject<Booking[]>([]);

  get bookings() {
    return this._bookings.asObservable();
  }

  constructor(private authService: AuthService, private http: HttpClient) {}

  addBooking(
    placeId: string,
    placeTitle: string,
    placeImage: string,
    firstName: string,
    lastName: string,
    guestNumber: number,
    dateFrom: Date,
    dateTo: Date
  ) {
    let generatedId: string;
    let newBooking: Booking;
    return this.authService.userId.pipe(
      take(1),
      switchMap((userId) => {
        if (!userId) {
          throw new Error('No user id found!');
        }
        newBooking = new Booking(
          Math.random().toString(),
          placeId,
          userId,
          placeTitle,
          placeImage,
          firstName,
          lastName,
          guestNumber,
          dateFrom,
          dateTo
        );

        // Format the data to match Firebase structure
        const bookingData = {
          placeId: newBooking.placeId,
          placeTitle: newBooking.placeTitle,
          placeImage: newBooking.placeImage,
          firstName: newBooking.firstName,
          lastName: newBooking.lastName,
          guestNumber: newBooking.guestNumber.toString(),
          bookedFrom: dateFrom.toISOString(),
          bookedTo: dateTo.toISOString(),
          userId: userId,
        };

        console.log('Sending booking data:', bookingData); // Debug log

        return this.http.post<{ name: string }>(
          'https://ionic-angular-course-96ff0-default-rtdb.firebaseio.com/bookings.json',
          bookingData
        );
      }),
      switchMap((resData) => {
        generatedId = resData.name;
        return this.bookings;
      }),
      take(1),
      tap((bookings) => {
        newBooking.id = generatedId;
        this._bookings.next(bookings.concat(newBooking));
      })
    );
  }
  cancelBooking(bookingId: string) {
    console.log('Canceling booking with ID:', bookingId); // Log the booking ID being canceled
    return this.http
      .delete(
        `https://ionic-angular-course-96ff0-default-rtdb.firebaseio.com/bookings/${bookingId}.json`
      )
      .pipe(
        switchMap(() => {
          console.log('Booking with ID:', bookingId, 'deleted');
          return this.bookings;
        }),
        take(1),
        tap((bookings) => {
          this._bookings.next(bookings.filter((b) => b.id !== bookingId));
        })
      );
  }

  fetchBookings() {
    return this.authService.userId.pipe(
      take(1),
      switchMap((userId) => {
        if (!userId) {
          throw new Error('No user id found!');
        }
        console.log('Fetching bookings for userId:', userId); // Debug log
        return this.http.get<{ [key: string]: BookingData }>(
          `https://ionic-angular-course-96ff0-default-rtdb.firebaseio.com/bookings.json?orderBy="userId"&equalTo="${userId}"`
        );
      }),
      map((bookingData) => {
        console.log('Raw booking data:', bookingData); // Debug log
        const bookings: Booking[] = [];
        for (const key in bookingData) {
          if (bookingData.hasOwnProperty(key)) {
            const booking = bookingData[key];
            bookings.push(
              new Booking(
                key,
                booking.placeId,
                booking.userId,
                booking.placeTitle,
                booking.placeImage,
                booking.firstName,
                booking.lastName,
                parseInt(booking.guestNumber),
                new Date(booking.bookedFrom),
                new Date(booking.bookedTo)
              )
            );
          }
        }
        console.log('Processed bookings:', bookings); // Debug log
        return bookings;
      }),
      tap((bookings) => {
        this._bookings.next(bookings);
      }),
      // Add error handling
      tap({
        error: (error) => {
          console.error('Error in fetchBookings:', error);
          throw error; // Re-throw to be handled by the component
        },
      })
    );
  }

  // Helper method to get a single booking
  getBooking(id: string) {
    return this.http
      .get<BookingData>(
        `https://ionic-angular-course-96ff0-default-rtdb.firebaseio.com/bookings/${id}.json`
      )
      .pipe(
        map((bookingData) => {
          return new Booking(
            id,
            bookingData.placeId,
            bookingData.userId,
            bookingData.placeTitle,
            bookingData.placeImage,
            bookingData.firstName,
            bookingData.lastName,
            parseInt(bookingData.guestNumber),
            new Date(bookingData.bookedFrom),
            new Date(bookingData.bookedTo)
          );
        })
      );
  }

  // Method to clear all bookings (useful for logout)
  clearBookings() {
    this._bookings.next([]);
  }

  // Method to refresh bookings
  refreshBookings() {
    return this.fetchBookings();
  }

  deleteBookingsForPlace(placeId: string) {
    console.log('deleteBookingsForPlace called for placeId:', placeId); // Log the placeId

    return this.bookings.pipe(
      take(1),
      switchMap((bookings) => {
        // Filter bookings related to the place
        const bookingsForPlace = bookings.filter((b) => b.placeId === placeId);
        console.log('Bookings for this place:', bookingsForPlace); // Log the bookings for this place

        // Delete all bookings related to this place
        const deleteRequests = bookingsForPlace.map((booking) => {
          console.log('Deleting booking with ID:', booking.id); // Log each booking being deleted
          return this.cancelBooking(booking.id); // Calls cancelBooking from the service
        });

        return forkJoin(deleteRequests); // Executes all delete requests in parallel
      })
    );
  }

  // booking.service.ts
  getBookingsForPlace(placeId: string) {
    return this.http
      .get<{ [key: string]: Booking }>(
        `https://ionic-angular-course-96ff0-default-rtdb.firebaseio.com/bookings.json?orderBy="placeId"&equalTo="${placeId}"`
      )
      .pipe(
        map((responseData) => {
          const bookings = [];
          for (const key in responseData) {
            if (responseData.hasOwnProperty(key)) {
              bookings.push({ ...responseData[key], id: key });
            }
          }
          return bookings; // Returns an array of bookings
        })
      );
  }
}
