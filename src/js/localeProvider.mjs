import EventEmitter from 'https://unpkg.com/EventEmitter@1.0.0/src/index.js?module';

export class LocaleProvider {
  constructor(currentLocale = 'en', availableLocales = ['en', 'el'], defaultLocale = 'en') {
    this.availableLocales = availableLocales;
    this.defaultLocale = defaultLocale;
    this.emiter = new EventEmitter();
    this.setCurrent(currentLocale);
  }

  getDefault() {
    return this.defaultLocale;
  }

  getCurrent() {
    return this.currentLocale;
  }

  setCurrent(tag) {
    if (!this.availableLocales.includes(tag)) {
      console.warn('Sorry ', tag, 'is not supported right now. Setting default');
      this.currentLocale = this.defaultLocale;
    }
    this.currentLocale = tag;
    this.emiter.emit('locale:changed', tag);
  }

  onChangeLocale(cb) {
    this.emiter.on('locale:changed', cb);
  }
}
