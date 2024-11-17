import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import {
  LoadingController,
  AlertController,
  ActionSheetController,
} from '@ionic/angular'; // Import ActionSheetController
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core'; // Import TranslateService
import { Storage } from '@ionic/storage-angular'; // Import Ionic Storage

import { AuthService, AuthResponseData } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  isLoading = false;
  isLogin = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private translate: TranslateService, // Inject TranslateService
    private actionSheetCtrl: ActionSheetController, // Inject ActionSheetController
    private cdr: ChangeDetectorRef,
    private storage: Storage // Inject Ionic Storage
  ) {}

  ngOnInit() {
    this.loadLanguage(); // Load the stored language on page load
  }

  private async loadLanguage() {
    const storedLang = await this.storage.get('selectedLang');
    const browserLang = this.translate.getBrowserLang();
    const selectedLang =
      storedLang ||
      (browserLang && browserLang.match(/en|ar|he/) ? browserLang : 'en');
    this.translate.use(selectedLang);
    this.setAppDirection(selectedLang); // Set direction based on initial language
  }

  authenticate(email: string, password: string) {
    this.isLoading = true;
    this.loadingCtrl
      .create({
        keyboardClose: true,
        message: this.translate.instant('LOGGING_IN'),
      })
      .then((loadingEl) => {
        loadingEl.present();
        let authObs: Observable<AuthResponseData>;
        const language = this.translate.currentLang || 'en'; // Get the current language
        if (this.isLogin) {
          authObs = this.authService.login(email, password, language);
        } else {
          authObs = this.authService.signup(email, password, language);
        }
        authObs.subscribe(
          (resData) => {
            this.isLoading = false;
            loadingEl.dismiss();
            this.router.navigateByUrl('/places/tabs/discover');
          },
          (errRes) => {
            loadingEl.dismiss();
            const code = errRes.error.error.message;
            let message = this.translate.instant('AUTH_FAILED');
            if (code === 'EMAIL_EXISTS') {
              message = this.translate.instant('EMAIL_EXISTS');
            } else if (code === 'EMAIL_NOT_FOUND') {
              message = this.translate.instant('EMAIL_NOT_FOUND');
            } else if (code === 'INVALID_PASSWORD') {
              message = this.translate.instant('INVALID_PASSWORD');
            }
            this.showAlert(message);
          }
        );
      });
  }

  onSwitchAuthMode() {
    this.isLogin = !this.isLogin;
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }
    const email = form.value.email;
    const password = form.value.password;

    this.authenticate(email, password);
    form.reset();
  }

  private showAlert(message: string) {
    this.alertCtrl
      .create({
        header: this.translate.instant('AUTH_FAILED'),
        message: message,
        buttons: [this.translate.instant('OKAY')],
      })
      .then((alertEl) => alertEl.present());
  }

  // Open the language selector action sheet
  openLanguageSelector() {
    this.actionSheetCtrl
      .create({
        header: this.translate.instant('SELECT_LANGUAGE'),
        buttons: [
          {
            text: 'English',
            handler: () => {
              this.changeLanguage('en');
            },
          },
          {
            text: 'عربيه', // Arabic
            handler: () => {
              this.changeLanguage('ar');
            },
          },
          {
            text: 'עברית', // Hebrew
            handler: () => {
              this.changeLanguage('he');
            },
          },
          {
            text: this.translate.instant('CANCEL'),
            role: 'cancel',
            handler: () => {
              console.log('Language selection canceled');
            },
          },
        ],
      })
      .then((actionSheet) => {
        actionSheet.present();

        // Use setTimeout to allow the DOM to be rendered before manipulation
        setTimeout(() => {
          const actionSheetEl = document.querySelector('ion-action-sheet');
          const buttonElements = actionSheetEl?.querySelectorAll('button');
          buttonElements?.forEach((button: HTMLElement) => {
            button.style.textAlign = 'center'; // Center text of the buttons
          });
        }, 100);
      });
  }

  // Change the language based on the selected option
  async changeLanguage(lang: string) {
    this.translate.use(lang).subscribe(() => {
      this.setAppDirection(lang); // Set direction based on selected language
      this.storage.set('selectedLang', lang); // Store selected language in Ionic Storage
      this.cdr.detectChanges(); // Manually trigger change detection
    });
  }

  // Set text direction (RTL or LTR) based on the language
  private setAppDirection(lang: string) {
    const direction = lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', direction);
  }
}
