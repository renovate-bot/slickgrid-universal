import type { Formatter } from './formatter.interface.js';
import type { SlickCheckboxSelectColumn } from '../extensions/slickCheckboxSelectColumn.js';

export interface ItemMetadataProvider {
  getRowMetadata(item: any, row: number): any;
}

export interface GroupItemMetadataProviderOption {
  /** Whether or not we want to use group select checkbox. */
  checkboxSelect?: boolean;

  /** Defaults to "slick-group-select-checkbox" */
  checkboxSelectCssClass?: string;

  /** Plugin to select row(s) via checkboxes typically shown as the 1st column in the grid. */
  checkboxSelectPlugin?: SlickCheckboxSelectColumn;

  /** Defaults to "slick-group" */
  groupCssClass?: string;

  /** Defaults to "slick-group-title" */
  groupTitleCssClass?: string;

  /** Defaults to 15(px), margin-left indentation to use (it will be multiplied by the group level number) */
  indentation?: number;

  /** Defaults to "slick-group-totals" */
  totalsCssClass?: string;

  /** Whether or not the group is focusable. */
  groupFocusable?: boolean;

  /** Whether or not the group totals is focusable. */
  totalsFocusable?: boolean;

  /** Defaults to "slick-group-toggle" */
  toggleCssClass?: string;

  /** Defaults to "expanded" */
  toggleExpandedCssClass?: string;

  /** Defaults to "collapsed" */
  toggleCollapsedCssClass?: string;

  /** Whether or not we want to enable the group expanding/collapsing */
  enableExpandCollapse?: boolean;

  /** A custom group cell formatter. */
  groupFormatter?: Formatter;

  /** A custom total formatter. */
  totalsFormatter?: Formatter;

  /** Whether or not we want to include header totals */
  includeHeaderTotals?: boolean;
}
