<script setup lang="ts">
import {
  type ColumnEditorDualInput,
  type GridOption,
  type SlickgridVueInstance,
  type Column,
  Editors,
  Filters,
  formatNumber,
  Formatters,
  SlickEventHandler,
  SlickgridVue,
} from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

const NB_ITEMS = 500;
const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const showSubTitle = ref(true);
const frozenColumnCount = ref(2);
const frozenRowCount = ref(3);
const isFrozenBottom = ref(false);
let vueGrid!: SlickgridVueInstance;
let slickEventHandler: any;

onBeforeMount(() => {
  defineGrid();
  // mock some data (different in each dataset)
  dataset.value = mockData(NB_ITEMS);
  slickEventHandler = new SlickEventHandler();
});

onBeforeMount(() => {
  slickEventHandler.unsubscribeAll();
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'sel',
      name: '#',
      field: 'id',
      minWidth: 40,
      width: 40,
      maxWidth: 40,
      cannotTriggerInsert: true,
      resizable: false,
      unselectable: true,
    },
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      minWidth: 100,
      width: 120,
      filterable: true,
      sortable: true,
    },
    {
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      resizable: false,
      minWidth: 130,
      width: 140,
      formatter: Formatters.percentCompleteBar,
      type: 'number',
      filterable: true,
      filter: { model: Filters.slider, operator: '>=' },
      sortable: true,
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      minWidth: 100,
      width: 120,
      filterable: true,
      sortable: true,
      formatter: Formatters.dateIso,
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      minWidth: 100,
      width: 120,
      filterable: true,
      sortable: true,
      formatter: Formatters.dateIso,
    },
    {
      id: 'cost',
      name: 'Cost | Duration',
      field: 'cost',
      formatter: costDurationFormatter,
      minWidth: 150,
      width: 170,
      sortable: true,
      // filterable: true,
      filter: {
        model: Filters.compoundSlider,
      },
      editor: {
        model: Editors.dualInput,
        // the DualInputEditor is of Type ColumnEditorDualInput and MUST include (leftInput/rightInput) in its params object
        // in each of these 2 properties, you can pass any regular properties of a column editor
        // and they will be executed following the options defined in each
        params: {
          leftInput: {
            field: 'cost',
            type: 'float',
            decimal: 2,
            minValue: 0,
            maxValue: 50000,
            placeholder: '< 50K',
            errorMessage: 'Cost must be positive and below $50K.',
          },
          rightInput: {
            field: 'duration',
            type: 'float', // you could have 2 different input type as well
            minValue: 0,
            maxValue: 100,
            title: 'make sure Duration is withing its range of 0 to 100',
            errorMessage: 'Duration must be between 0 and 100.',

            // Validator Option #1
            // You could also optionally define a custom validator in 1 or both inputs
            /*
              validator: (value, args) => {
                let isValid = true;
                let errorMsg = '';
                if (value < 0 || value > 120) {
                  isValid = false;
                  errorMsg = 'Duration MUST be between 0 and 120.';
                }
                return { valid: isValid, msg: errorMsg };
              }
              */
          },
        } as ColumnEditorDualInput,

        // Validator Option #2 (shared Validator) - this is the last alternative, option #1 (independent Validators) is still the recommended way
        // You can also optionally use a common Validator (if you do then you cannot use the leftInput/rightInput validators at same time)
        // to compare both values at the same time.
        /*
          validator: (values, args) => {
            let isValid = true;
            let errorMsg = '';
            if (values.cost < 0 || values.cost > 50000) {
              isValid = false;
              errorMsg = 'Cost MUST be between 0 and 50k.';
            }
            if (values.duration < 0 || values.duration > 120) {
              isValid = false;
              errorMsg = 'Duration MUST be between 0 and 120.';
            }
            if (values.cost < values.duration) {
              isValid = false;
              errorMsg = 'Cost can never be lower than its Duration.';
            }
            return { valid: isValid, msg: errorMsg };
          }
          */
      },
    },
    {
      id: 'effortDriven',
      name: 'Effort Driven',
      field: 'effortDriven',
      minWidth: 100,
      width: 120,
      formatter: Formatters.checkmarkMaterial,
      filterable: true,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: true, label: 'True' },
          { value: false, label: 'False' },
        ],
        model: Filters.singleSelect,
      },
      sortable: true,
    },
    {
      id: 'title1',
      name: 'Title 1',
      field: 'title1',
      minWidth: 100,
      width: 120,
      filterable: true,
      sortable: true,
    },
    {
      id: 'title2',
      name: 'Title 2',
      field: 'title2',
      minWidth: 100,
      width: 120,
      filterable: true,
      sortable: true,
    },
    {
      id: 'title3',
      name: 'Title 3',
      field: 'title3',
      minWidth: 100,
      width: 120,
      filterable: true,
      sortable: true,
    },
    {
      id: 'title4',
      name: 'Title 4',
      field: 'title4',
      minWidth: 100,
      width: 120,
      filterable: true,
      sortable: true,
    },
  ];

  gridOptions.value = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    gridWidth: 920,
    enableCellNavigation: true,
    editable: true,
    autoEdit: true,
    enableExcelCopyBuffer: true,
    frozenColumn: frozenColumnCount.value,
    frozenRow: frozenRowCount.value,
    // frozenBottom: true, // if you want to freeze the bottom instead of the top, you can enable this property

    // show both Frozen Columns in HeaderMenu & GridMenu, these are opt-in commands so they're disabled by default
    gridMenu: { hideClearFrozenColumnsCommand: false },
    headerMenu: { hideFreezeColumnsCommand: false },
  };
}

function colorizeHoveringRow(event: Event, isMouseEnter: boolean) {
  const cell = vueGrid.slickGrid.getCellFromEvent(event);
  const rows = isMouseEnter ? [cell?.row ?? 0] : [];
  vueGrid.slickGrid.setSelectedRows(rows); // highlight current row
  event.preventDefault();
}

function mockData(count: number) {
  // Set up some test columns.
  const mockDataset: any[] = [];
  for (let i = 0; i < count; i++) {
    mockDataset[i] = {
      id: i,
      title: 'Task ' + i,
      cost: i % 33 === 0 ? null : Math.random() * 10000,
      duration: i % 8 ? Math.round(Math.random() * 100) + '' : null,
      percentComplete: Math.round(Math.random() * 100),
      start: new Date(2009, 0, 1),
      finish: new Date(2009, 4, 5),
      effortDriven: i % 5 === 0,
      title1: `Some Text ${Math.round(Math.random() * 25)}`,
      title2: `Some Text ${Math.round(Math.random() * 25)}`,
      title3: `Some Text ${Math.round(Math.random() * 25)}`,
      title4: `Some Text ${Math.round(Math.random() * 25)}`,
    };
  }

  return mockDataset;
}

/** change dynamically, through slickgrid "setOptions()" the number of pinned columns */
function changeFrozenColumnCount() {
  if (vueGrid.slickGrid?.setOptions) {
    vueGrid.slickGrid.setOptions({
      frozenColumn: frozenColumnCount.value,
    });
  }
}

/** change dynamically, through slickgrid "setOptions()" the number of pinned rows */
function changeFrozenRowCount() {
  if (vueGrid.slickGrid?.setOptions) {
    vueGrid.slickGrid.setOptions({
      frozenRow: frozenRowCount.value,
    });
  }
}

function costDurationFormatter(_row: number, _cell: number, _value: any, _columnDef: Column, dataContext: any) {
  const costText = isNullUndefinedOrEmpty(dataContext.cost) ? 'n/a' : formatNumber(dataContext.cost, 0, 2, false, '$', '', '.', ',');
  let durationText = 'n/a';
  if (!isNullUndefinedOrEmpty(dataContext.duration) && dataContext.duration >= 0) {
    durationText = `${dataContext.duration} ${dataContext.duration > 1 ? 'days' : 'day'}`;
  }
  return `<b>${costText}</b> | ${durationText}`;
}

function isNullUndefinedOrEmpty(data: any) {
  return data === '' || data === null || data === undefined;
}

function onCellValidationError(_e: Event, args: any) {
  alert(args.validationResults.msg);
}

function setFrozenColumns(frozenCols: number) {
  vueGrid.slickGrid.setOptions({ frozenColumn: frozenCols });
  gridOptions.value = vueGrid.slickGrid.getOptions();
}

/** toggle dynamically, through slickgrid "setOptions()" the top/bottom pinned location */
function toggleFrozenBottomRows() {
  if (vueGrid.slickGrid?.setOptions) {
    vueGrid.slickGrid.setOptions({
      frozenBottom: !isFrozenBottom.value,
    });
    isFrozenBottom.value = !isFrozenBottom.value; // toggle the variable
  }
}

function toggleSubTitle() {
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
  queueMicrotask(() => vueGrid.resizerService.resizeGrid());
}

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;

  // with frozen (pinned) grid, in order to see the entire row being highlighted when hovering
  // we need to do some extra tricks (that is because frozen grids use 2 separate div containers)
  // the trick is to use row selection to highlight when hovering current row and remove selection once we're not
  slickEventHandler.subscribe(vueGrid.slickGrid.onMouseEnter, (event: Event) => colorizeHoveringRow(event, true));
  slickEventHandler.subscribe(vueGrid.slickGrid.onMouseLeave, (event: Event) => colorizeHoveringRow(event, false));
}
</script>

<template>
  <h2>
    Example 20: Pinned (frozen) Columns/Rows
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example20.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    This example demonstrates the use of Pinned (aka frozen) Columns and/or Rows (<a
      href="https://ghiscoding.gitbook.io/slickgrid-vue/grid-functionalities/frozen-columns-rows"
      target="_blank"
      >Wiki docs</a
    >)
    <ul>
      <li>Option to pin any number of columns (left only) or rows</li>
      <li>Option to pin the rows at the bottom instead of the top (default)</li>
      <li>You can also dynamically any of these options, through SlickGrid "setOptions()"</li>
      <li>Possibility to change the styling of the line border between pinned columns/rows</li>
    </ul>
  </div>

  <br />

  <div class="row">
    <div class="col-sm-12">
      <span>
        <label for="">Pinned Rows: </label>
        <input v-model="frozenRowCount" type="number" />
        <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" @click="changeFrozenRowCount()">Set</button>
      </span>
      <span style="margin-left: 10px">
        <label for="">Pinned Columns: </label>
        <input v-model="frozenColumnCount" type="number" />
        <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" @click="changeFrozenColumnCount()">Set</button>
      </span>
    </div>
  </div>

  <div class="row mt-2">
    <div class="col-sm-12">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="remove-frozen-column-button" @click="setFrozenColumns(-1)">
        <i class="mdi mdi-close"></i> Remove Frozen Columns
      </button>
      <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="set-3frozen-columns" @click="setFrozenColumns(2)">
        <i class="mdi mdi-pin-outline"></i> Set 3 Frozen Columns
      </button>
      <span style="margin-left: 15px">
        <button class="btn btn-outline-secondary btn-sm btn-icon" @click="toggleFrozenBottomRows()">
          <i class="mdi mdi-flip-vertical"></i> Toggle Pinned Rows
        </button>
        <span class="fw-bold mx-1">: {{ isFrozenBottom ? 'Bottom' : 'Top' }}</span>
      </span>
    </div>
  </div>

  <div class="col-sm-12">
    <hr />
  </div>

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions"
    v-model:data="dataset"
    grid-id="grid20"
    @onValidationError="onCellValidationError($event.detail.eventData, $event.detail.args)"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>

<style lang="scss" scoped>
/** You can change the pinned/frozen border styling through this css override */

.slick-row .slick-cell.frozen:last-child,
.slick-headerrow-column.frozen:last-child,
.slick-footerrow-column.frozen:last-child {
  border-right: 1px solid #969696 !important;
}

.slick-pane-bottom {
  border-top: 1px solid #969696 !important;
}
</style>
