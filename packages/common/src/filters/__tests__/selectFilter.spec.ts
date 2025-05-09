import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MultipleSelectOption } from 'multiple-select-vanilla';
import { of, type Subject } from 'rxjs';

import { FieldType, OperatorType } from '../../enums/index.js';
import type { Column, FilterArguments, GridOption } from '../../interfaces/index.js';
import { CollectionService } from '../../services/collection.service.js';
import { Filters } from '../filters.index.js';
import { SelectFilter } from '../selectFilter.js';
import type { SlickGrid } from '../../core/index.js';
import { HttpStub } from '../../../../../test/httpClientStub.js';
import { RxJsResourceStub } from '../../../../../test/rxjsResourceStub.js';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const gridOptionMock = {
  enableFiltering: true,
  enableFilterTrimWhiteSpace: true,
} as GridOption;

const gridStub = {
  getOptions: () => gridOptionMock,
  getColumns: vi.fn(),
  getHeaderRowColumn: vi.fn(),
  render: vi.fn(),
  sanitizeHtmlString: (str) => str,
} as unknown as SlickGrid;

describe('SelectFilter', () => {
  let translateService: TranslateServiceStub;
  let divContainer: HTMLDivElement;
  let filter: SelectFilter;
  let filterArguments: FilterArguments;
  let spyGetHeaderRow;
  let mockColumn: Column;
  let collectionService: CollectionService;
  const http = new HttpStub();

  beforeEach(() => {
    translateService = new TranslateServiceStub();
    collectionService = new CollectionService(translateService);

    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.innerHTML = '';
    document.body.appendChild(divContainer);
    spyGetHeaderRow = vi.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = {
      id: 'gender',
      field: 'gender',
      filterable: true,
      filter: {
        model: Filters.multipleSelect,
      },
    };

    filterArguments = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: vi.fn(),
      filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id),
    };

    filter = new SelectFilter(translateService, collectionService);
  });

  afterEach(() => {
    filter.destroy();
    vi.clearAllMocks();
  });

  it('should throw an error when there is no collection provided in the filter property', () =>
    new Promise((done: any) => {
      try {
        filter.init(filterArguments);
      } catch (e) {
        expect(e.message).toContain(
          `[Slickgrid-Universal] You need to pass a "collection" (or "collectionAsync") for the MultipleSelect/SingleSelect Filter to work correctly.`
        );
        done();
      }
    }));

  it('should throw an error when collection is not a valid array', () =>
    new Promise((done: any) => {
      mockColumn.filter!.collection = { hello: 'world' } as any;
      filter.init(filterArguments).catch((e) => {
        expect(e.message).toContain(`The "collection" passed to the Select Filter is not a valid array.`);
        done();
      });
    }));

  it('should throw an error when "enableTranslateLabel" is set without a valid I18N Service', () =>
    new Promise((done: any) => {
      try {
        translateService = undefined as any;
        mockColumn.filter!.enableTranslateLabel = true;
        mockColumn.filter!.collection = [
          { value: 'male', label: 'male' },
          { value: 'female', label: 'female' },
        ];
        filter = new SelectFilter(translateService, collectionService);
        filter.init(filterArguments);
      } catch (e) {
        expect(e.toString()).toContain(
          `[select-filter] The Translate Service is required for the Select Filter to work correctly when "enableTranslateLabel" is set.`
        );
        done();
      }
    }));

  it('should initialize the filter', () => {
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('select.ms-filter.search-filter.filter-gender').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
  });

  it('should initialize the filter with minHeight define in user filter options', () => {
    mockColumn.filter!.options = { minHeight: 255 } as MultipleSelectOption;
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    filter.init(filterArguments);

    expect(filter.msInstance?.getOptions().minHeight).toBe(255);
  });

  it('should initialize the filter with minHeight define in user filterOptions', () => {
    mockColumn.filter!.filterOptions = { minHeight: 255 } as MultipleSelectOption;
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    filter.init(filterArguments);

    expect(filter.msInstance?.getOptions().minHeight).toBe(255);
  });

  it('should initialize the filter with minHeight define in global default user filter options', () => {
    gridOptionMock.defaultFilterOptions = {
      select: { minHeight: 243 },
    };
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    filter.init(filterArguments);

    expect(filter.msInstance?.getOptions().minHeight).toBe(243);
  });

  it('should be a multiple-select filter by default when it is not specified in the constructor', () => {
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    filter = new SelectFilter(translateService, collectionService);
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('select.ms-filter.search-filter.filter-gender').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
    expect(filter.isMultipleSelect).toBe(true);
  });

  it('should have a placeholder when defined in its column definition', () => {
    const testValue = 'test placeholder';
    mockColumn.filter!.placeholder = testValue;
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('.ms-filter.search-filter.filter-gender .ms-placeholder') as HTMLSpanElement;

    expect(filterElm.innerHTML).toBe(testValue);
  });

  it('should trigger multiple select change event and expect the callback to be called with the search terms we select from dropdown list', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];

    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
    filterBtnElm.click();

    filter.msInstance?.setSelects(['male']);
    filterOkElm.click();
    filter.msInstance?.close();

    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['male'], shouldTriggerQuery: true });
  });

  it('should trigger multiple select change event without choosing an option and expect the callback to be called without search terms and also expect the dropdown list to not have "filled" css class', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];

    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
    filterBtnElm.click();
    filterOkElm.click();
    filter.msInstance?.close();

    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: [], shouldTriggerQuery: true });
  });

  it('should trigger multiple select change event and expect this to work with a regular array of strings', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    mockColumn.filter!.collection = ['male', 'female'];
    mockColumn.filter!.options = { showClear: true };
    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
    filterBtnElm.click();

    filter.msInstance?.setSelects(['male']);
    filter.msInstance?.close();

    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    expect(filterOkElm).toBeTruthy();
    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['male'], shouldTriggerQuery: true });
  });

  it('should type a search filter and expect clear() method to be called when ms-select clear button is clicked', () => {
    const spyClear = vi.spyOn(filter, 'clear');

    mockColumn.filter!.collection = ['male', 'female'];
    mockColumn.filter!.filterOptions = { showClear: true };
    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    filterBtnElm.click();

    filter.msInstance?.setSelects(['male']);
    filter.msInstance?.close();

    const filterClearElm = filterBtnElm.querySelector(`.ms-icon-close`) as HTMLButtonElement;
    filterClearElm.click();
    expect(spyClear).toHaveBeenCalled();
  });

  it('should pass a different operator then trigger an input change event and expect the callback to be called with the search terms we select from dropdown list', () => {
    mockColumn.filter!.operator = 'NIN';
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init({ ...filterArguments, columnDef: mockColumn });
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
    filterBtnElm.click();

    filter.msInstance?.setSelects(['male']);
    filter.msInstance?.close();

    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    expect(filterOkElm).toBeTruthy();
    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'NIN', searchTerms: ['male'], shouldTriggerQuery: true });
  });

  it('should have same value in "getValues" after being set in "setValues" a single string', () => {
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    filter.init(filterArguments);
    filter.setValues('female');
    const values = filter.getValues();

    expect(values).toEqual(['female']);
    expect(values.length).toBe(1);
  });

  it('should have same value in "getValues" after being set in "setValues" with an array', () => {
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    filter.init(filterArguments);
    filter.setValues(['female']);
    const values = filter.getValues();

    expect(values).toEqual(['female']);
    expect(values.length).toBe(1);
  });

  it('should provide boolean values and expect "getValues" to be converted to string', () => {
    mockColumn.filter!.collection = [
      { value: true, label: 'True' },
      { value: false, label: 'False' },
    ];

    filter.init(filterArguments);
    filter.setValues([false]);
    const values = filter.getValues();

    expect(values).toEqual(['false']);
    expect(values.length).toBe(1);
  });

  it('should be able to call "setValues" and call an event trigger', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    mockColumn.filter!.collection = [
      { value: true, label: 'True' },
      { value: false, label: 'False' },
    ];

    filter.init(filterArguments);
    filter.setValues([false], 'NE', true);
    const values = filter.getValues();

    expect(values).toEqual(['false']);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'NE', searchTerms: ['false'], shouldTriggerQuery: true });
  });

  it('should have empty array returned from "getValues" when nothing is set', () => {
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    filter.init(filterArguments);
    const values = filter.getValues();

    expect(values).toEqual([]);
    expect(values.length).toBe(0);
  });

  it('should have empty array returned from "getValues" even when filter is not yet created', () => {
    const values = filter.getValues();

    expect(values).toEqual([]);
    expect(values.length).toBe(0);
  });

  it('should create the multi-select filter with a default search term when passed as a filter argument', () => {
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filterArguments.searchTerms = ['female'];
    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
    filterBtnElm.click();
    filterOkElm.click();
    filter.msInstance?.close();

    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(filterListElm[1].checked).toBe(true);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should create the multi-select filter with default boolean search term converted as strings when passed as a filter argument', () => {
    mockColumn.filter!.collection = [
      { value: true, label: 'True' },
      { value: false, label: 'False' },
    ];
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filterArguments.searchTerms = [false];
    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
    filterBtnElm.click();
    filterOkElm.click();
    filter.msInstance?.close();

    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(filterListElm[1].checked).toBe(true);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['false'], shouldTriggerQuery: true });
  });

  it('should create the multi-select filter with default number search term converted as strings when passed as a filter argument', () => {
    mockColumn.filter!.collection = [
      { value: 1, label: 'male' },
      { value: 2, label: 'female' },
    ];
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filterArguments.searchTerms = [2];
    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
    filterBtnElm.click();
    filterOkElm.click();
    filter.msInstance?.close();

    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(filterListElm[1].checked).toBe(true);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['2'], shouldTriggerQuery: true });
  });

  it('should create the multi-select filter with a default search term when passed as a filter argument even with collection an array of strings', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    mockColumn.filter!.collection = ['male', 'female'];

    filterArguments.searchTerms = ['female'];
    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
    filterBtnElm.click();
    filterOkElm.click();
    filter.msInstance?.close();

    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(filterListElm[1].checked).toBe(true);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should create the multi-select filter and sort the string collection when "collectionSortBy" is set', () => {
    mockColumn.filter = {
      collection: ['other', 'male', 'female'],
      collectionSortBy: {
        sortDesc: true,
        fieldType: FieldType.string,
      },
    };

    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[data-name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();
    filter.msInstance?.close();

    expect(filterListElm.length).toBe(3);
    expect(filterListElm[0].textContent).toBe('other');
    expect(filterListElm[1].textContent).toBe('male');
    expect(filterListElm[2].textContent).toBe('female');
  });

  it('should create the multi-select filter and sort the value/label pair collection when "collectionSortBy" is set', () => {
    mockColumn.filter = {
      collection: [
        { value: 'other', description: 'other' },
        { value: 'male', description: 'male' },
        { value: 'female', description: 'female' },
      ],
      collectionSortBy: {
        property: 'value',
        sortDesc: false,
        fieldType: FieldType.string,
      },
      customStructure: {
        value: 'value',
        label: 'description',
      },
    };

    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[data-name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();

    expect(filterListElm.length).toBe(3);
    expect(filterListElm[0].textContent).toBe('female');
    expect(filterListElm[1].textContent).toBe('male');
    expect(filterListElm[2].textContent).toBe('other');
  });

  it('should create the multi-select filter and filter the string collection when "collectionFilterBy" is set', () => {
    mockColumn.filter = {
      collection: ['other', 'male', 'female'],
      collectionFilterBy: { operator: OperatorType.equal, value: 'other' },
    };

    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[data-name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();

    expect(filterListElm.length).toBe(1);
    expect(filterListElm[0].textContent).toBe('other');
  });

  it('should create the multi-select filter and filter the value/label pair collection when "collectionFilterBy" is set', () => {
    mockColumn.filter = {
      collection: [
        { value: 'other', description: 'other' },
        { value: 'male', description: 'male' },
        { value: 'female', description: 'female' },
      ],
      collectionFilterBy: [
        { property: 'value', operator: OperatorType.notEqual, value: 'other' },
        { property: 'value', operator: OperatorType.notEqual, value: 'male' },
      ],
      customStructure: { value: 'value', label: 'description' },
    };

    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[data-name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();

    expect(filterListElm.length).toBe(1);
    expect(filterListElm[0].textContent).toBe('female');
  });

  it('should create the multi-select filter and filter the value/label pair collection when "collectionFilterBy" is set and "filterResultAfterEachPass" is set to "merge"', () => {
    mockColumn.filter = {
      collection: [
        { value: 'other', description: 'other' },
        { value: 'male', description: 'male' },
        { value: 'female', description: 'female' },
      ],
      collectionFilterBy: [
        { property: 'value', operator: OperatorType.equal, value: 'other' },
        { property: 'value', operator: OperatorType.equal, value: 'male' },
      ],
      collectionOptions: { filterResultAfterEachPass: 'merge' },
      customStructure: { value: 'value', label: 'description' },
    };

    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[data-name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();

    expect(filterListElm.length).toBe(2);
    expect(filterListElm[0].textContent).toBe('other');
    expect(filterListElm[1].textContent).toBe('male');
  });

  it('should create the multi-select filter with a value/label pair collection that is inside an object when "collectionInsideObjectProperty" is defined with a dot notation', () => {
    mockColumn.filter = {
      collection: {
        deep: {
          myCollection: [
            { value: 'other', description: 'other' },
            { value: 'male', description: 'male' },
            { value: 'female', description: 'female' },
          ],
        },
      } as any,
      collectionOptions: { collectionInsideObjectProperty: 'deep.myCollection' },
      customStructure: { value: 'value', label: 'description' },
    };

    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[data-name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();

    expect(filterListElm.length).toBe(3);
    expect(filterListElm[0].textContent).toBe('other');
    expect(filterListElm[1].textContent).toBe('male');
    expect(filterListElm[2].textContent).toBe('female');
  });

  it('should create the multi-select filter with a default search term and have the HTML rendered when "enableRenderHtml" is set', () => {
    mockColumn.filter = {
      enableRenderHtml: true,
      collection: [
        { value: true, label: 'True', labelPrefix: `<i class="mdi mdi-check"></i> ` },
        { value: false, label: 'False' },
      ],
      customStructure: {
        value: 'isEffort',
        label: 'label',
        labelPrefix: 'labelPrefix',
      },
    };

    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[data-name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();
    filter.msInstance?.close();

    expect(filter.selectOptions.renderOptionLabelAsHtml).toBeTruthy();
    expect(filter.selectOptions.useSelectOptionLabelToHtml).toBeFalsy();
    expect(filterListElm.length).toBe(2);
    expect(filterListElm[0].innerHTML).toBe('<i class="mdi mdi-check"></i> True');
  });

  it('should create the multi-select filter with a blank entry at the beginning of the collection when "addBlankEntry" is set in the "collectionOptions" property', () => {
    filterArguments.searchTerms = ['female'];
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    mockColumn.filter!.collectionOptions = { addBlankEntry: true };
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
    filterBtnElm.click();
    filterOkElm.click();
    filter.msInstance?.close();

    expect(filter.selectOptions.renderOptionLabelAsHtml).toBeFalsy();
    expect(filter.selectOptions.useSelectOptionLabelToHtml).toBeFalsy();
    expect(filterListElm.length).toBe(3);
    expect(filterFilledElms.length).toBe(1);
    expect(filterListElm[0].value).toBe('');
    expect(filterListElm[2].checked).toBe(true);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should create the multi-select filter with a custom entry at the beginning of the collection when "addCustomFirstEntry" is provided in the "collectionOptions" property', () => {
    filterArguments.searchTerms = ['female'];
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    mockColumn.filter!.collectionOptions = { addCustomFirstEntry: { value: null, label: '' } };
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
    filterBtnElm.click();
    filterOkElm.click();
    filter.msInstance?.close();

    expect(filterListElm.length).toBe(3);
    expect(filterFilledElms.length).toBe(1);
    expect(filterListElm[0].value).toBe('');
    expect(filterListElm[2].checked).toBe(true);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should create the multi-select filter with a custom entry at the end of the collection when "addCustomFirstEntry" is provided in the "collectionOptions" property', () => {
    filterArguments.searchTerms = ['female'];
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    mockColumn.filter!.collectionOptions = { addCustomLastEntry: { value: null, label: '' } };
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
    filterBtnElm.click();
    filterOkElm.click();
    filter.msInstance?.close();

    expect(filterListElm.length).toBe(3);
    expect(filterFilledElms.length).toBe(1);
    expect(filterListElm[2].value).toBe('');
    expect(filterListElm[1].checked).toBe(true);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method', () => {
    filterArguments.searchTerms = ['female'];
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.clear();
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');

    expect(filter.searchTerms!.length).toBe(0);
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter but without querying when when calling the "clear" method with False as argument', () => {
    filterArguments.searchTerms = ['female'];
    mockColumn.filter!.collection = [
      { value: 'male', label: 'male' },
      { value: 'female', label: 'female' },
    ];
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.clear(false);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');

    expect(filter.searchTerms!.length).toBe(0);
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: false });
  });

  it('should work with English locale when locale is changed', () =>
    new Promise(async (done: any) => {
      translateService.use('en');
      gridOptionMock.enableTranslate = true;
      mockColumn.filter = {
        enableTranslateLabel: true,
        collection: [
          { value: 'other', labelKey: 'OTHER' },
          { value: 'male', labelKey: 'MALE' },
          { value: 'female', labelKey: 'FEMALE' },
        ],
        options: { minimumCountSelected: 1 },
      };

      filterArguments.searchTerms = ['male', 'female'];
      filter.init(filterArguments);

      setTimeout(() => {
        const filterSelectAllElm = divContainer.querySelector('.filter-gender .ms-select-all label span') as HTMLSpanElement;
        const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
        const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[data-name=filter-gender].ms-drop ul>li span`);
        const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
        const filterParentElm = divContainer.querySelector(`.ms-parent.ms-filter.search-filter.filter-gender button`) as HTMLButtonElement;
        filterBtnElm.click();

        expect(filterListElm.length).toBe(3);
        expect(filterListElm[0].textContent).toBe('Other');
        expect(filterListElm[1].textContent).toBe('Male');
        expect(filterListElm[2].textContent).toBe('Female');
        expect(filterOkElm.textContent).toBe('OK');
        expect(filterSelectAllElm.textContent).toBe('Select All');
        expect(filterParentElm.textContent).toBe('2 of 3 selected');
        done();
      });
    }));

  it('should work with French locale when locale is changed', () =>
    new Promise(async (done: any) => {
      translateService.use('fr');
      gridOptionMock.enableTranslate = true;
      mockColumn.filter = {
        enableTranslateLabel: true,
        collection: [
          { value: 'other', labelKey: 'OTHER' },
          { value: 'male', labelKey: 'MALE' },
          { value: 'female', labelKey: 'FEMALE' },
        ],
        filterOptions: { minimumCountSelected: 1 },
      };

      filterArguments.searchTerms = ['male', 'female'];
      filter.init(filterArguments);

      setTimeout(() => {
        const filterSelectAllElm = divContainer.querySelector('.filter-gender .ms-select-all label span') as HTMLSpanElement;
        const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
        const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[data-name=filter-gender].ms-drop ul>li span`);
        const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
        const filterParentElm = divContainer.querySelector(`.ms-parent.ms-filter.search-filter.filter-gender button`) as HTMLButtonElement;
        filterBtnElm.click();

        expect(filterListElm.length).toBe(3);
        expect(filterListElm[0].textContent).toBe('Autre');
        expect(filterListElm[1].textContent).toBe('Mâle');
        expect(filterListElm[2].textContent).toBe('Femme');
        expect(filterOkElm.textContent).toBe('Terminé');
        expect(filterSelectAllElm.textContent).toBe('Sélectionner tout');
        expect(filterParentElm.textContent).toBe('2 de 3 sélectionnés');
        done();
      });
    }));

  it('should enable Dark Mode and expect ".ms-dark-mode" CSS class to be found on parent element', () =>
    new Promise(async (done: any) => {
      gridOptionMock.darkMode = true;
      mockColumn.filter = {
        enableTranslateLabel: true,
        collection: [
          { value: 'other', label: 'Other' },
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
        options: { minimumCountSelected: 1 },
      };

      filterArguments.searchTerms = ['male', 'female'];
      filter.init(filterArguments);

      setTimeout(() => {
        const filterElm = divContainer.querySelector('.ms-parent') as HTMLButtonElement;

        expect(filterElm.classList.contains('ms-dark-mode')).toBeTruthy();
        done();
      });
    }));

  it('should enable Dark Mode and expect ".ms-dark-mode" CSS class to be found on parent element', () =>
    new Promise(async (done: any) => {
      gridOptionMock.darkMode = true;
      mockColumn.filter = {
        enableTranslateLabel: true,
        collection: [
          { value: 'other', label: 'Other' },
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
        filterOptions: { minimumCountSelected: 1 },
      };

      filterArguments.searchTerms = ['male', 'female'];
      filter.init(filterArguments);

      setTimeout(() => {
        const filterElm = divContainer.querySelector('.ms-parent') as HTMLButtonElement;

        expect(filterElm.classList.contains('ms-dark-mode')).toBeTruthy();
        done();
      });
    }));

  it('should create the multi-select filter with a default search term when using "collectionAsync" as a Promise', async () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    const mockCollection = ['male', 'female'];
    mockColumn.filter!.collection = undefined;
    mockColumn.filter!.collectionAsync = Promise.resolve(mockCollection);

    filterArguments.searchTerms = ['female'];
    await filter.init(filterArguments);

    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
    filterBtnElm.click();
    filterOkElm.click();
    filter.msInstance?.close();

    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(filterListElm[1].checked).toBe(true);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should create the multi-select filter with a default search term when using "collectionAsync" as a Promise with content to simulate http-client', async () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    const mockCollection = ['male', 'female'];
    mockColumn.filter!.collection = undefined;
    mockColumn.filter!.collectionAsync = Promise.resolve({ content: mockCollection });

    filterArguments.searchTerms = ['female'];
    await filter.init(filterArguments);

    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
    filterBtnElm.click();
    filterOkElm.click();
    filter.msInstance?.close();

    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(filterListElm[1].checked).toBe(true);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should create the multi-select filter with a default search term when using "collectionAsync" is a Fetch Promise', async () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    const mockCollection = ['male', 'female'];

    http.status = 200;
    http.object = mockCollection;
    http.returnKey = 'date';
    http.returnValue = '6/24/1984';
    http.responseHeaders = { accept: 'json' };
    mockColumn.filter!.collectionAsync = http.fetch('http://locahost/api', { method: 'GET' });

    filterArguments.searchTerms = ['female'];
    await filter.init(filterArguments);

    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
    const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
    const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
    filterBtnElm.click();
    filterOkElm.click();
    filter.msInstance?.close();

    expect(filterListElm.length).toBe(2);
    expect(filterFilledElms.length).toBe(1);
    expect(filterListElm[1].checked).toBe(true);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should create the multi-select filter with a value/label pair collectionAsync that is inside an object when "collectionInsideObjectProperty" is defined with a dot notation', async () => {
    const mockDataResponse = {
      deep: {
        myCollection: [
          { value: 'other', description: 'other' },
          { value: 'male', description: 'male' },
          { value: 'female', description: 'female' },
        ],
      },
    };
    mockColumn.filter = {
      collectionAsync: Promise.resolve(mockDataResponse),
      collectionOptions: { collectionInsideObjectProperty: 'deep.myCollection' },
      customStructure: { value: 'value', label: 'description' },
    };

    await filter.init(filterArguments);

    const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
    const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[data-name=filter-gender].ms-drop ul>li span`);
    filterBtnElm.click();

    expect(filterListElm.length).toBe(3);
    expect(filterListElm[0].textContent).toBe('other');
    expect(filterListElm[1].textContent).toBe('male');
    expect(filterListElm[2].textContent).toBe('female');
  });

  it('should trigger a re-render of the DOM element when collection is replaced by new collection', () =>
    new Promise(async (done: any) => {
      const renderSpy = vi.spyOn(filter, 'renderDomElement');
      const newCollection = [
        { value: 'val1', label: 'label1' },
        { value: 'val2', label: 'label2' },
      ];
      const mockDataResponse = [
        { value: 'female', label: 'Female' },
        { value: 'male', label: 'Male' },
      ];

      mockColumn.filter = {
        collection: [],
        collectionAsync: Promise.resolve(mockDataResponse),
        enableCollectionWatch: true,
      };

      await filter.init(filterArguments);
      mockColumn.filter!.collection = newCollection;
      mockColumn.filter!.collection!.push({ value: 'val3', label: 'label3' });

      setTimeout(() => {
        expect(renderSpy).toHaveBeenCalledTimes(3);
        expect(renderSpy).toHaveBeenCalledWith(newCollection);

        const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
        const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[data-name=filter-gender].ms-drop ul>li span`);
        filterBtnElm.click();

        expect(filterListElm.length).toBe(3);
        expect(filterListElm[0].textContent).toBe('label1');
        expect(filterListElm[1].textContent).toBe('label2');
        expect(filterListElm[2].textContent).toBe('label3');
        done();
      });
    }));

  it('should trigger a re-render of the DOM element when collection changes', () =>
    new Promise(async (done: any) => {
      const renderSpy = vi.spyOn(filter, 'renderDomElement');

      mockColumn.filter = {
        collection: [
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
        ],
        enableCollectionWatch: true,
      };

      await filter.init(filterArguments);
      mockColumn.filter!.collection!.push({ value: 'other', label: 'Other' });

      setTimeout(() => {
        expect(renderSpy).toHaveBeenCalledTimes(2);
        expect(renderSpy).toHaveBeenCalledWith(mockColumn.filter!.collection);

        const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
        const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[data-name=filter-gender].ms-drop ul>li span`);
        filterBtnElm.click();

        expect(filterListElm.length).toBe(3);
        expect(filterListElm[0].textContent).toBe('Female');
        expect(filterListElm[1].textContent).toBe('Male');
        expect(filterListElm[2].textContent).toBe('Other');
        done();
      });
    }));

  it('should create the multi-select filter with a default search term when using "collectionLazy" as a Promise', () =>
    new Promise(async (done: any) => {
      const spyCallback = vi.spyOn(filterArguments, 'callback');
      const mockCollection = ['male', 'female', 'other'];
      mockColumn.filter!.collection = undefined;
      mockColumn.filter!.collectionLazy = () => {
        return Promise.resolve(mockCollection);
      };

      filterArguments.searchTerms = ['female'];
      await filter.init(filterArguments);
      await filter.msInstance?.open(null);

      setTimeout(() => {
        const msData = filter.msInstance?.getData() || [];
        const selectDropElm = filter.msInstance?.getDropElement();
        const filterListElm = selectDropElm?.querySelectorAll<HTMLInputElement>('ul>li input[type=checkbox]');
        const okBtnElm = selectDropElm?.querySelector('.ms-ok-button') as HTMLButtonElement;
        okBtnElm.click();
        expect(msData.length).toBe(3);
        expect(filterListElm?.length).toBe(3);
        expect(filterListElm?.[1].checked).toBe(true);
        expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
        filter.msInstance?.close();
        done();
      });
    }));

  it('should create the multi-select filter with a default search term when using "collectionLazy" as a Promise with content to simulate http-client', () =>
    new Promise(async (done: any) => {
      const spyCallback = vi.spyOn(filterArguments, 'callback');
      const mockCollection = ['male', 'female'];
      mockColumn.filter!.collection = undefined;
      mockColumn.filter!.collectionLazy = () => Promise.resolve({ content: mockCollection });

      filterArguments.searchTerms = ['female'];
      await filter.init(filterArguments);
      await filter.msInstance?.open(null);

      setTimeout(() => {
        const msData = filter.msInstance?.getData() || [];
        const selectDropElm = filter.msInstance?.getDropElement();
        const filterListElm = selectDropElm?.querySelectorAll<HTMLInputElement>('ul>li input[type=checkbox]');
        const okBtnElm = selectDropElm?.querySelector('.ms-ok-button') as HTMLButtonElement;
        okBtnElm.click();
        expect(msData.length).toBe(2);
        expect(filterListElm?.length).toBe(2);
        expect(filterListElm?.[1].checked).toBe(true);
        expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
        filter.msInstance?.close();
        done();
      });
    }));

  it('should create the multi-select filter with a default search term when using "collectionLazy" is a Fetch Promise', () =>
    new Promise(async (done: any) => {
      const spyCallback = vi.spyOn(filterArguments, 'callback');
      const mockCollection = ['male', 'female'];

      http.status = 200;
      http.object = mockCollection;
      http.returnKey = 'date';
      http.returnValue = '6/24/1984';
      http.responseHeaders = { accept: 'json' };
      mockColumn.filter!.collectionLazy = () => http.fetch('http://locahost/api', { method: 'GET' });

      filterArguments.searchTerms = ['female'];
      await filter.init(filterArguments);
      await filter.msInstance?.open(null);

      setTimeout(() => {
        const msData = filter.msInstance?.getData() || [];
        const selectDropElm = filter.msInstance?.getDropElement();
        const filterListElm = selectDropElm?.querySelectorAll<HTMLInputElement>('ul>li input[type=checkbox]');
        const okBtnElm = selectDropElm?.querySelector('.ms-ok-button') as HTMLButtonElement;
        okBtnElm.click();
        expect(msData.length).toBe(2);
        expect(filterListElm?.length).toBe(2);
        expect(filterListElm?.[1].checked).toBe(true);
        expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
        filter.msInstance?.close();
        done();
      });
    }));

  it('should create the multi-select filter with a value/label pair collectionLazy that is inside an object when "collectionInsideObjectProperty" is defined with a dot notation', () =>
    new Promise(async (done: any) => {
      const mockDataResponse = {
        deep: {
          myCollection: [
            { value: 'other', description: 'other' },
            { value: 'male', description: 'male' },
            { value: 'female', description: 'female' },
          ],
        },
      };
      mockColumn.filter = {
        collectionLazy: () => Promise.resolve(mockDataResponse),
        collectionOptions: { collectionInsideObjectProperty: 'deep.myCollection' },
        customStructure: { value: 'value', label: 'description' },
      };

      await filter.init(filterArguments);
      await filter.msInstance?.open(null);

      setTimeout(() => {
        const msData = filter.msInstance?.getData() || [];
        const selectDropElm = filter.msInstance?.getDropElement();
        const filterListElm = selectDropElm?.querySelectorAll<HTMLInputElement>('ul>li input[type=checkbox]');
        const okBtnElm = selectDropElm?.querySelector('.ms-ok-button') as HTMLButtonElement;
        okBtnElm.click();
        expect(msData.length).toBe(3);
        expect(filterListElm?.length).toBe(3);
        expect(filterListElm?.[0].value).toBe('other');
        expect(filterListElm?.[1].value).toBe('male');
        expect(filterListElm?.[2].value).toBe('female');
        filter.msInstance?.close();
        done();
      });
    }));

  it('should throw an error when "collectionAsync" Promise does not return a valid array', () =>
    new Promise((done: any) => {
      const promise = Promise.resolve({ hello: 'world' });
      mockColumn.filter!.collectionAsync = promise;

      filter.init(filterArguments).catch((e) => {
        expect(e.toString()).toContain(
          `Something went wrong while trying to pull the collection from the "collectionAsync" call in the Filter, the collection is not a valid array.`
        );
        done();
      });
    }));

  it('should throw an error when "collectionAsync" Promise does not return a valid array', () =>
    new Promise((done: any) => {
      const promise = Promise.resolve({ hello: 'world' });
      mockColumn.filter!.collectionAsync = promise;
      filter.init(filterArguments).catch((e) => {
        expect(e.toString()).toContain(
          `Something went wrong while trying to pull the collection from the "collectionAsync" call in the Filter, the collection is not a valid array.`
        );
        done();
      });
    }));

  describe('SelectFilter using RxJS Observables', () => {
    let divContainer: HTMLDivElement;
    let filter: SelectFilter;
    let filterArguments: FilterArguments;
    let mockColumn: Column;
    let collectionService: CollectionService;
    let rxjs: RxJsResourceStub;
    let translateService: TranslateServiceStub;

    beforeEach(() => {
      translateService = new TranslateServiceStub();
      collectionService = new CollectionService(translateService);
      rxjs = new RxJsResourceStub();

      divContainer = document.createElement('div');
      divContainer.innerHTML = template;
      document.body.appendChild(divContainer);
      spyGetHeaderRow = vi.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

      mockColumn = {
        id: 'gender',
        field: 'gender',
        filterable: true,
        filter: {
          model: Filters.multipleSelect,
        },
      };

      filterArguments = {
        grid: gridStub,
        columnDef: mockColumn,
        callback: vi.fn(),
        filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id),
      };

      filter = new SelectFilter(translateService, collectionService, rxjs);
    });

    afterEach(() => {
      filter.destroy();
      vi.clearAllMocks();
    });

    it('should create the multi-select filter with a value/label pair collectionAsync that is inside an object when "collectionInsideObjectProperty" is defined with a dot notation', async () => {
      mockColumn.filter = {
        collectionAsync: of({
          deep: {
            myCollection: [
              { value: 'other', description: 'other' },
              { value: 'male', description: 'male' },
              { value: 'female', description: 'female' },
            ],
          },
        }),
        collectionOptions: {
          collectionInsideObjectProperty: 'deep.myCollection',
        },
        customStructure: {
          value: 'value',
          label: 'description',
        },
      };

      await filter.init(filterArguments);

      const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
      const filterListElm = divContainer.querySelectorAll<HTMLSpanElement>(`[data-name=filter-gender].ms-drop ul>li span`);
      filterBtnElm.click();

      expect(filterListElm.length).toBe(3);
      expect(filterListElm[0].textContent).toBe('other');
      expect(filterListElm[1].textContent).toBe('male');
      expect(filterListElm[2].textContent).toBe('female');
    });

    it('should create the multi-select filter with a default search term when using "collectionAsync" as an Observable', async () => {
      const spyCallback = vi.spyOn(filterArguments, 'callback');
      const mockCollection = ['male', 'female'];
      mockColumn.filter!.collection = undefined;
      mockColumn.filter!.collectionAsync = of(mockCollection);

      filterArguments.searchTerms = ['female'];
      await filter.init(filterArguments);

      const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
      const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
      const filterFilledElms = divContainer.querySelectorAll<HTMLDivElement>('.ms-parent.ms-filter.search-filter.filter-gender.filled');
      const filterOkElm = divContainer.querySelector(`[data-name=filter-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
      filterBtnElm.click();
      filterOkElm.click();
      filter.msInstance?.close();

      expect(filterListElm.length).toBe(2);
      expect(filterFilledElms.length).toBe(1);
      expect(filterListElm[1].checked).toBe(true);
      expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: 'IN', searchTerms: ['female'], shouldTriggerQuery: true });
    });

    it('should create the multi-select filter with a "collectionAsync" as an Observable and be able to call next on it', async () => {
      const mockCollection = ['male', 'female'];
      mockColumn.filter!.collectionAsync = of(mockCollection);

      filterArguments.searchTerms = ['female'];
      await filter.init(filterArguments);

      const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
      const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
      filterBtnElm.click();

      expect(filterListElm.length).toBe(2);
      expect(filterListElm[1].checked).toBe(true);

      // after await (or timeout delay) we'll get the Subject Observable
      mockCollection.push('other');
      (mockColumn.filter!.collectionAsync as Subject<any[]>).next(mockCollection);

      const filterUpdatedListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
      expect(filterUpdatedListElm.length).toBe(3);
    });

    it('should create the multi-select filter with a "collectionAsync" as an Observable, which has its collection inside an object property, and be able to call next on it', async () => {
      const mockCollection = { deep: { myCollection: ['male', 'female'] } };
      mockColumn.filter = {
        collectionAsync: of(mockCollection),
        collectionOptions: {
          collectionInsideObjectProperty: 'deep.myCollection',
        },
        customStructure: {
          value: 'value',
          label: 'description',
        },
      };

      filterArguments.searchTerms = ['female'];
      await filter.init(filterArguments);

      const filterBtnElm = divContainer.querySelector('.ms-parent.ms-filter.search-filter.filter-gender button.ms-choice') as HTMLButtonElement;
      const filterListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
      filterBtnElm.click();

      expect(filterListElm.length).toBe(2);
      expect(filterListElm[1].checked).toBe(true);

      // after await (or timeout delay) we'll get the Subject Observable
      mockCollection.deep.myCollection.push('other');
      (mockColumn.filter!.collectionAsync as Subject<any[]>).next(mockCollection.deep.myCollection);

      const filterUpdatedListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=filter-gender].ms-drop ul>li input[type=checkbox]`);
      expect(filterUpdatedListElm.length).toBe(3);
    });

    it('should throw an error when "collectionAsync" Observable does not return a valid array', () =>
      new Promise((done: any) => {
        mockColumn.filter!.collectionAsync = of({ hello: 'world' });
        filter.init(filterArguments).catch((e) => {
          expect(e.toString()).toContain(
            `Something went wrong while trying to pull the collection from the "collectionAsync" call in the Filter, the collection is not a valid array.`
          );
          done();
        });
      }));
  });
});
