import {
  ContainerService,
  EmptyWarning,
  ExternalResource,
  GridOption,
  sanitizeTextByAvailableSanitizer,
  SlickGrid,
  TranslaterService
} from '@slickgrid-universal/common';

export class SlickEmptyWarningComponent implements ExternalResource {
  private _warningLeftElement: HTMLDivElement | null;
  private _warningRightElement: HTMLDivElement | null;
  private grid: SlickGrid;
  private translaterService?: TranslaterService | null;


  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return (this.grid && this.grid.getOptions) ? this.grid.getOptions() : {};
  }

  constructor() { }

  init(grid: SlickGrid, containerService: ContainerService) {
    this.grid = grid;
    this.translaterService = containerService.get<TranslaterService>('TranslaterService');
  }

  dispose() {
    this._warningLeftElement?.remove();
    this._warningRightElement?.remove();
    this._warningLeftElement = null;
    this._warningRightElement = null;
  }

  /**
   * Display a warning of empty data when the filtered dataset is empty
   * NOTE: to make this code reusable, you could (should) move this code into a utility service
   * @param isShowing - are we showing the message?
   * @param options - any styling options you'd like to pass like the text color
   */
  showEmptyDataMessage(isShowing = true, options?: EmptyWarning): boolean {
    if (!this.grid || !this.gridOptions) {
      return false;
    }
    const gridUid = this.grid.getUID();
    const defaultMessage = 'No data to display.';
    const mergedOptions: EmptyWarning = { message: defaultMessage, ...this.gridOptions.emptyDataWarning, ...options };
    const emptyDataClassName = mergedOptions?.className ?? 'slick-empty-data-warning';
    this._warningLeftElement = document.querySelector<HTMLDivElement>(`.${gridUid} .${emptyDataClassName}`);
    const gridCanvasLeftElm = document.querySelector<HTMLDivElement>(`.${gridUid} .grid-canvas.grid-canvas-left`);
    const gridCanvasRightElm = document.querySelector<HTMLDivElement>(`.${gridUid} .grid-canvas.grid-canvas-right`);
    const leftElementMarginLeft = mergedOptions.leftViewportMarginLeft ?? 0;
    const rightElementMarginLeft = mergedOptions.rightViewportMarginLeft ?? 0;
    const leftElementFrozenMarginLeft = mergedOptions.frozenLeftViewportMarginLeft ?? 0;
    const rightElementFrozenMarginLeft = mergedOptions.frozenRightViewportMarginLeft ?? 0;
    const isFrozenGrid = (this.gridOptions?.frozenColumn !== undefined && this.gridOptions.frozenColumn >= 0);
    const leftViewportMarginLeft = typeof leftElementMarginLeft === 'string' ? leftElementMarginLeft : `${leftElementMarginLeft}px`;
    const rightViewportMarginLeft = typeof rightElementMarginLeft === 'string' ? rightElementMarginLeft : `${rightElementMarginLeft}px`;

    if (!this._warningLeftElement && !isShowing) {
      return false;
    }

    // warning message could come from a translation key or by the warning options
    let warningMessage = mergedOptions.message;
    if (this.gridOptions.enableTranslate && this.translaterService && mergedOptions?.messageKey) {
      warningMessage = this.translaterService.translate(mergedOptions.messageKey);
    }

    if (!this._warningLeftElement && gridCanvasLeftElm && gridCanvasRightElm) {
      const sanitizedOptions = this.gridOptions && this.gridOptions.sanitizeHtmlOptions || {};
      const sanitizedText = sanitizeTextByAvailableSanitizer(this.gridOptions, warningMessage, sanitizedOptions);

      this._warningLeftElement = document.createElement('div');
      this._warningLeftElement.classList.add(emptyDataClassName);
      this._warningLeftElement.classList.add('left');
      this._warningLeftElement.innerHTML = sanitizedText;

      // clone the warning element and add the "right" class to it so we can distinguish
      this._warningRightElement = this._warningLeftElement.cloneNode(true) as HTMLDivElement;
      this._warningRightElement.classList.add('right');

      // append both warning elements to both left/right canvas
      gridCanvasRightElm.appendChild(this._warningRightElement);
      gridCanvasLeftElm.appendChild(this._warningLeftElement);
    }

    // if we did find the Slick-Empty-Warning element then we'll display/hide at the grid position with some margin offsets (we need to position under the headerRow and filterRow)
    // when using a frozen/pinned grid, we also have extra options to hide left/right message
    if (this._warningLeftElement) {
      // display/hide right/left messages
      let leftDisplay = isShowing ? 'block' : 'none';
      if (isFrozenGrid && isShowing) {
        leftDisplay = (mergedOptions.hideFrozenLeftWarning) ? 'none' : 'block';
      }
      this._warningLeftElement.style.display = leftDisplay;

      // use correct left margin (defaults to 40% on regular grid or 10px on frozen grid)
      const leftFrozenMarginLeft = typeof leftElementFrozenMarginLeft === 'string' ? leftElementFrozenMarginLeft : `${leftElementFrozenMarginLeft}px`;
      this._warningLeftElement.style.marginLeft = isFrozenGrid ? leftFrozenMarginLeft : leftViewportMarginLeft;
    }

    if (this._warningRightElement) {
      // use correct left margin (defaults to 40% on regular grid or 10px on frozen grid)
      let rightDisplay = isShowing ? 'block' : 'none';
      if (isFrozenGrid && isShowing) {
        rightDisplay = (mergedOptions.hideFrozenRightWarning) ? 'none' : 'block';
      }
      this._warningRightElement.style.display = rightDisplay;

      // use correct left margin (defaults to 40% on regular grid or 10px on frozen grid)
      const rightFrozenMarginLeft = typeof rightElementFrozenMarginLeft === 'string' ? rightElementFrozenMarginLeft : `${rightElementFrozenMarginLeft}px`;
      this._warningRightElement.style.marginLeft = isFrozenGrid ? rightFrozenMarginLeft : rightViewportMarginLeft;
    }

    return isShowing;
  }
}