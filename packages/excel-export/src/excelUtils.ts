import {
  Column,
  ExcelCellFormat,
  ExcelStylesheet,
  FieldType,
  Formatters,
  FormatterType,
  GroupTotalFormatters,
  isNumber,
  mapMomentDateFormatWithFieldType,
  retrieveFormatterOptions,
  sanitizeHtmlToText,
  SlickGrid,
} from '@slickgrid-universal/common';
import * as moment_ from 'moment-mini';
const moment = (moment_ as any)['default'] || moment_; // patch to fix rollup "moment has no default export" issue, document here https://github.com/rollup/rollup/issues/670

export type ExcelFormatter = object & { id: number; };
export type GetDataValueCallback = (data: Date | string | number, excelFormatterId: number | undefined, fieldType: typeof FieldType[keyof typeof FieldType]) => Date | string | number | ExcelCellFormat;

// define all type of potential excel data function callbacks
const getExcelInputDataCallback: GetDataValueCallback = (data) => data;
const getExcelNumberCallback: GetDataValueCallback = (data, excelFormatterId) => ({
  value: isNumber(data) ? +data : data,
  metadata: { style: excelFormatterId }
});
const getExcelDateCallback: GetDataValueCallback = (data, _excelFormatterId, fieldType) => {
  let outputData: any;
  if (data) {
    const dateFormat: string = mapMomentDateFormatWithFieldType(fieldType);
    const outputDate: moment_.Moment = moment(data, dateFormat, false);
    if (outputDate.isValid()) {
      outputData = outputDate.format(dateFormat);
    }
  }
  return outputData ?? data;
};

/** use different Excel Stylesheet Format as per the Field Type */
export function useCellFormatByFieldType(stylesheet: ExcelStylesheet, stylesheetFormatters: any, columnDef: Column, grid: SlickGrid) {
  const fieldType = columnDef.outputType || columnDef.type || FieldType.string;
  let stylesheetFormatterId: number | undefined;

  switch (fieldType) {
    case FieldType.dateTime:
    case FieldType.dateTimeIso:
    case FieldType.dateTimeShortIso:
    case FieldType.dateTimeIsoAmPm:
    case FieldType.dateTimeIsoAM_PM:
    case FieldType.dateEuro:
    case FieldType.dateEuroShort:
    case FieldType.dateTimeEuro:
    case FieldType.dateTimeShortEuro:
    case FieldType.dateTimeEuroAmPm:
    case FieldType.dateTimeEuroAM_PM:
    case FieldType.dateTimeEuroShort:
    case FieldType.dateTimeEuroShortAmPm:
    case FieldType.dateUs:
    case FieldType.dateUsShort:
    case FieldType.dateTimeUs:
    case FieldType.dateTimeShortUs:
    case FieldType.dateTimeUsAmPm:
    case FieldType.dateTimeUsAM_PM:
    case FieldType.dateTimeUsShort:
    case FieldType.dateTimeUsShortAmPm:
    case FieldType.dateUtc:
    case FieldType.date:
    case FieldType.dateIso:
      return { stylesheetFormatterId: undefined, getDataValueCallback: getExcelDateCallback };
    case FieldType.number:
      stylesheetFormatterId = getExcelFormatFromGridFormatter(stylesheet, stylesheetFormatters, columnDef, grid, 'cell').stylesheetFormatter.id;
      return { stylesheetFormatterId, getDataValueCallback: getExcelNumberCallback };
    default:
      stylesheetFormatterId = undefined;
      break;
  }
  return { stylesheetFormatterId, getDataValueCallback: getExcelInputDataCallback };
}

export function getGroupTotalValue(totals: any, groupType: string, colField: string) {
  return totals?.[groupType]?.[colField] ?? 0;
}

/** Get numeric formatter options when defined or use default values (minDecimal, maxDecimal, thousandSeparator, decimalSeparator, wrapNegativeNumber) */
export function getNumericFormatterOptions(columnDef: Column, grid: SlickGrid, formatterType: FormatterType) {
  let dataType: 'decimal' | 'dollar' | 'percent' | 'regular';

  if (formatterType === 'group') {
    switch (columnDef.groupTotalsFormatter) {
      case GroupTotalFormatters.avgTotalsDollar:
      case GroupTotalFormatters.sumTotalsDollarColoredBold:
      case GroupTotalFormatters.sumTotalsDollarColored:
      case GroupTotalFormatters.sumTotalsDollarBold:
      case GroupTotalFormatters.sumTotalsDollar:
        dataType = 'dollar';
        break;
      case GroupTotalFormatters.avgTotalsPercentage:
        dataType = 'percent';
        break;
      case GroupTotalFormatters.avgTotals:
      case GroupTotalFormatters.minTotals:
      case GroupTotalFormatters.maxTotals:
      case GroupTotalFormatters.sumTotalsColored:
      case GroupTotalFormatters.sumTotals:
      case GroupTotalFormatters.sumTotalsBold:
      default:
        // side note, formatters are using "regular" without any decimal limits (min, max),
        // however in Excel export with custom format that doesn't work so well, we should use "decimal" to at least show optional decimals with "##"
        dataType = 'decimal';
        break;
    }
  } else {
    switch (columnDef.formatter) {
      case Formatters.dollarColoredBold:
      case Formatters.dollarColored:
      case Formatters.dollar:
        dataType = 'dollar';
        break;
      case Formatters.percent:
      case Formatters.percentCompleteBar:
      case Formatters.percentCompleteBarWithText:
      case Formatters.percentComplete:
      case Formatters.percentSymbol:
        dataType = 'percent';
        break;
      case Formatters.decimal:
      default:
        // use "decimal" instead of "regular" to show optional decimals "##" in Excel
        dataType = 'decimal';
        break;
    }
  }
  return retrieveFormatterOptions(columnDef, grid, dataType, formatterType);
}

export function getExcelFormatFromGridFormatter(stylesheet: ExcelStylesheet, stylesheetFormatters: any, columnDef: Column, grid: SlickGrid, formatterType: FormatterType) {
  let format = '';
  let groupType = '';
  let stylesheetFormatter: undefined | ExcelFormatter;
  const fieldType = columnDef.outputType || columnDef.type || FieldType.string;

  if (formatterType === 'group') {
    switch (columnDef.groupTotalsFormatter) {
      case GroupTotalFormatters.avgTotals:
      case GroupTotalFormatters.avgTotalsDollar:
      case GroupTotalFormatters.avgTotalsPercentage:
        groupType = 'avg';
        break;
      case GroupTotalFormatters.minTotals:
        groupType = 'min';
        break;
      case GroupTotalFormatters.maxTotals:
        groupType = 'max';
        break;
      case GroupTotalFormatters.sumTotals:
      case GroupTotalFormatters.sumTotalsBold:
      case GroupTotalFormatters.sumTotalsColored:
      case GroupTotalFormatters.sumTotalsDollar:
      case GroupTotalFormatters.sumTotalsDollarColoredBold:
      case GroupTotalFormatters.sumTotalsDollarColored:
      case GroupTotalFormatters.sumTotalsDollarBold:
        groupType = 'sum';
        break;
      default:
        stylesheetFormatter = stylesheetFormatters.numberFormatter;
        break;
    }
  } else {
    switch (fieldType) {
      case FieldType.number:
        switch (columnDef.formatter) {
          case Formatters.dollarColoredBold:
          case Formatters.dollarColored:
          case Formatters.dollar:
          case Formatters.percent:
          case Formatters.percentComplete:
          case Formatters.percentCompleteBar:
          case Formatters.percentCompleteBarWithText:
          case Formatters.percentSymbol:
          case Formatters.decimal:
            format = createExcelFormatFromGridFormatter(columnDef, grid, 'cell');
            break;
          default:
            stylesheetFormatter = stylesheetFormatters.numberFormatter;
            break;
        }
        break;
    }
  }

  if (!stylesheetFormatter && (columnDef.formatter || columnDef.groupTotalsFormatter)) {
    format = createExcelFormatFromGridFormatter(columnDef, grid, formatterType, groupType);
    if (!stylesheetFormatters.hasOwnProperty(format)) {
      stylesheetFormatters[format] = stylesheet.createFormat({ format }); // save new formatter with its format as a prop key
    }
    stylesheetFormatter = stylesheetFormatters[format] as ExcelFormatter;
  }
  return { stylesheetFormatter: stylesheetFormatter as ExcelFormatter, groupType };
}

// --
// private functions
// ------------------

function createFormatFromNumber(formattedVal: string) {
  // full number syntax can have up to 7 sections, for example::
  // Total: ($10,420.55 USD) Expensed
  const [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _,
    prefix,
    openBraquet,
    symbolPrefix,
    number,
    symbolSuffix,
    closingBraquet,
    suffix
  ] = formattedVal?.match(/^([^\d\(\-]*)([\(]?)([^\d]*)([\-]?[\w]]?[\d\s]*[.,\d]*[\d]*[^)\s\%]?)([^\d.,)]*)([\)]?)([^\d]*)$/i) || [];

  // replace 1's by 0's (required numbers) and replace 2's by "#" (optional numbers)
  const replacedNumber = (number || '').replace(/1/g, '0').replace(/[2]/g, '#');

  // console.log('createFormatFromNumber', formattedVal.trim(), '|prefix:', prefix ?? '', '|openBraquet:', openBraquet ?? '', '|symbolPrefix:', symbolPrefix ?? '', '|input:', replacedNumber, '|symbolSuffix:', symbolSuffix ?? '', '|closingBraquet:', closingBraquet ?? '', '|suffix:', suffix ?? '');

  const format = [
    escapeQuotes(prefix ?? ''),
    openBraquet ?? '',
    escapeQuotes(symbolPrefix ?? ''),
    replacedNumber,
    escapeQuotes(symbolSuffix ?? ''),
    closingBraquet ?? '',
    escapeQuotes(suffix ?? '')
  ].join('');
  return format.replace(',', '\,');
}

function createExcelFormatFromGridFormatter(columnDef: Column, grid: SlickGrid, formatterType: FormatterType, groupType = '') {
  let outputFormat = '';
  let positiveFormat = '';
  let negativeFormat = '';
  const { minDecimal, maxDecimal, thousandSeparator } = getNumericFormatterOptions(columnDef, grid, formatterType);
  const leftInteger = thousandSeparator ? '2220' : '0';
  const testingNo = parseFloat(`${leftInteger}.${excelTestingDecimalNumberPadding(minDecimal, maxDecimal)}`);

  if (formatterType === 'group' && columnDef.groupTotalsFormatter) {
    positiveFormat = sanitizeHtmlToText(columnDef.groupTotalsFormatter({ [groupType]: { [columnDef.field]: testingNo } }, columnDef, grid));
    negativeFormat = sanitizeHtmlToText(columnDef.groupTotalsFormatter({ [groupType]: { [columnDef.field]: -testingNo } }, columnDef, grid));
  } else if (columnDef.formatter) {
    positiveFormat = sanitizeHtmlToText(columnDef.formatter(0, 0, testingNo, columnDef, {}, grid) as string);
    negativeFormat = sanitizeHtmlToText(columnDef.formatter(0, 0, -testingNo, columnDef, {}, grid) as string);
  }
  if (positiveFormat && negativeFormat) {
    outputFormat = createFormatFromNumber(positiveFormat) + ';' + createFormatFromNumber(negativeFormat);
  }
  return outputFormat;
}

function escapeQuotes(val: string) {
  return val ? `"${val}"` : val;
}

/** Get number format for a number cell, for example { minDecimal: 2, maxDecimal: 5 } will return "00###" */
function excelTestingDecimalNumberPadding(minDecimal: number, maxDecimal: number) {
  return textPadding('1', minDecimal) + textPadding('2', maxDecimal - minDecimal);
}

function textPadding(numberStr: string, count: number): string {
  let output = '';
  for (let i = 0; i < count; i++) {
    output += numberStr;
  }
  return output;
}