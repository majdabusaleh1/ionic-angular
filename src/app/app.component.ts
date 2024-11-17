import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService,
    private storage: Storage
  ) {
    // Add available languages and set default language
    this.translate.addLangs(['en', 'ar', 'he']);
  }

  // This method is called when the app is initialized
  async ngOnInit() {
    this.loadLanguage();
    await this.storage.create(); // Initialize the storage

    // Check if a language is saved in storage
    const savedLanguage = await this.storage.get('selectedLanguage');
    if (savedLanguage) {
      // If language is saved, use it
      this.translate.use(savedLanguage);
      this.setAppDirection(savedLanguage);
    } else {
      // If no language is saved, use browser language or default to English
      const browserLang = this.translate.getBrowserLang();
      if (browserLang && browserLang.match(/en|ar|he/)) {
        this.translate.use(browserLang); // Use browser language if it's supported
        this.setAppDirection(browserLang); // Set direction based on the browser language
      } else {
        this.translate.use('en'); // Default to English if no match
        this.setAppDirection('en'); // Set direction to LTR for default
      }
    }
  }

  onLogout() {
    this.authService.logout();
    this.router.navigateByUrl('/auth');
  }

  private async loadLanguage() {
    const storedLang = await this.storage.get('selectedLang');
    const languageToUse = storedLang || 'en'; // Default to 'en' if no language is found
    this.translate.use(languageToUse);
    this.setAppDirection(languageToUse); // Set direction based on language
  }
  // Method to change the language and direction
  changeLanguage(lang: string) {
    this.translate.use(lang); // Switch to the selected language
    this.setAppDirection(lang); // Set the direction based on selected language

    // Save the language preference to storage
    this.storage.set('selectedLanguage', lang);
  }

  // Set text direction (RTL or LTR) based on the language
  private setAppDirection(lang: string) {
    const direction = lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', direction);
  }
}
