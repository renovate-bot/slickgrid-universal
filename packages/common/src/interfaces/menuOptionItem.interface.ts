import type { MenuItem } from './menuItem.interface.js';
import type { MenuOptionItemCallbackArgs } from './menuOptionItemCallbackArgs.interface.js';

export interface MenuOptionItem extends MenuItem {
  /** An option returned by the onOptionSelected (or action) event callback handler. */
  option: number | string | boolean | null | undefined;

  /** Array of Option Items (title, command, disabled, ...) */
  optionItems?: Array<MenuOptionItem | 'divider'>;

  // --
  // action/override callbacks

  /** Optionally define a callback function that gets executed when item is chosen (and/or use the onCommand event) */
  action?: (event: Event, callbackArgs: MenuOptionItemCallbackArgs) => void;
}
