import { SelectFilter } from './selectFilter.js';
import type { CollectionService } from './../services/collection.service.js';
import type { TranslaterService } from '../services/translater.service.js';
import type { RxJsFacade } from '../services/rxjsFacade.js';

export class SingleSelectFilter extends SelectFilter {
  /**
   * Initialize the Filter
   */
  constructor(
    protected readonly translaterService?: TranslaterService | undefined,
    protected readonly collectionService?: CollectionService | undefined,
    protected readonly rxjs?: RxJsFacade | undefined
  ) {
    super(translaterService, collectionService, rxjs, false);
  }
}
