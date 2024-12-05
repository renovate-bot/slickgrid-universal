import type { TranslaterService as UniversalTranslateService } from '@slickgrid-universal/common';
import { type i18n } from 'i18next';
import { useTranslation } from 'i18next-vue';

/**
 * This is a Translate Service Wrapper for Slickgrid-Universal monorepo lib to work properly,
 * it must implement Slickgrid-Universal TranslaterService interface to work properly
 */
export class TranslaterService implements UniversalTranslateService {
  public i18n: i18n;

  constructor() {
    this.i18n = useTranslation().i18next;
  }

  /**
   * Method to return the current language used by the App
   * @return {string} current language
   */
  getCurrentLanguage(): string {
    return this.i18n.language;
  }

  /**
   * Method to set the language to use in the App and Translate Service
   * @param {string} language
   * @return {Promise} output
   */
  async use(newLang: string): Promise<any> {
    return this.i18n.changeLanguage(newLang);
  }

  /**
   * Method which receives a translation key and returns the translated value assigned to that key
   * @param {string} translation key
   * @return {string} translated value
   */
  translate(translationKey: string): string {
    return this.i18n.t(translationKey);
  }
}
