import { describe, expect, it } from 'vitest';

import { FieldType, OperatorType } from '../../enums/index.js';
import type { FilterConditionOption } from '../../interfaces/index.js';
import { executeFilterConditionTest } from '../filterConditions.index.js';
import { executeStringFilterCondition, getFilterParsedText } from '../stringFilterCondition.js';

describe('executeStringFilterCondition method', () => {
  it('should return True when no cell input value is provided which is equal to the default search term, neither search terms', () => {
    const searchTerms = [];
    const options = { dataKey: '', operator: 'EQ', cellValue: '', fieldType: FieldType.string } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return True when cell input value is null and is equal to the default search term, neither search terms', () => {
    const searchTerms = [];
    const options = { dataKey: '', operator: 'EQ', cellValue: null, fieldType: FieldType.string } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return True when first searchTerm is undefined provided neither an operator when executing "executeFilterConditionTest" method', () => {
    const searchTerms = undefined;
    const options = { dataKey: '', cellValue: 'foo', fieldType: FieldType.string } as FilterConditionOption;
    const output = executeFilterConditionTest(options, searchTerms);
    expect(output).toBe(true);
  });

  it('should return False when any cell input value is provided without any search terms', () => {
    const searchTerms = [];
    const options = { dataKey: '', operator: 'EQ', cellValue: 'foo', fieldType: FieldType.string } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(false);
  });

  it('should return True when input value True is provided as cell value', () => {
    const searchTerms = ['3'];
    const options = { dataKey: '', operator: 'EQ', cellValue: 3, fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return True when input value provided is equal to the searchTerms', () => {
    const searchTerms = ['foo'];
    const options = { dataKey: '', operator: 'EQ', cellValue: 'foo', fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return True when input value provided is equal to the searchTerms and is called by "executeFilterConditionTest"', () => {
    const searchTerms = ['foo'];
    const options = { dataKey: '', operator: 'EQ', cellValue: 'foo', fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const output = executeFilterConditionTest(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return True when input value provided is equal to the searchTerms even though there are no Operator provided (it will use EQ as default)', () => {
    const searchTerms = ['foo'];
    const options = { dataKey: '', cellValue: 'foo', fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return False when the cell value is equal to at least 1 of the searchTerms', () => {
    const searchTerms = [];
    const options = {
      dataKey: '',
      operator: 'EQ',
      cellValue: 'foo',
      fieldType: FieldType.string,
      searchTerms: ['bar', 'foo', 'John'],
    } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(false);
  });

  it('should return False when cell value is inversed to the searchTerm', () => {
    const searchTerms = ['bar'];
    const options = { dataKey: '', operator: 'EQ', cellValue: 'foo', fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(false);
  });

  it('should return False even when Operator is Not Equal because condition is always a strict equal check', () => {
    const searchTerms = ['foo'];
    const options = { dataKey: '', operator: 'NE', cellValue: 'foo', fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(false);
  });

  it('should return True when input value provided starts with same substring and the operator is startsWith', () => {
    const searchTerms = ['abb'];
    const options = {
      dataKey: '',
      operator: OperatorType.startsWith,
      cellValue: 'abbostford',
      fieldType: FieldType.string,
      searchTerms,
    } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return True when search term is a substring of the cell value and the operator is Contains', () => {
    const searchTerms = ['bost'];
    const options = { dataKey: '', operator: 'Contains', cellValue: 'abbostford', fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return False when search term is a substring of the cell value and the operator is "<>" (not contains substring)', () => {
    const searchTerms = ['bost'];
    const options = { dataKey: '', operator: '<>', cellValue: 'abbostford', fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(false);
  });

  it('should return True when search term is a substring of the cell value and the operator is "!=" (not equal text) because "!=" compares agains the entire string', () => {
    const searchTerms = ['bost'];
    const options = { dataKey: '', operator: '!=', cellValue: 'abbostford', fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should exclude anything undefined when search term is empty string value and the operator is "!=" (not equal text) because "!=" compares agains the entire string', () => {
    const searchTerms = [''];
    const options1 = { dataKey: '', operator: '!=', cellValue: null, fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const options2 = { dataKey: '', operator: '!=', cellValue: '', fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const options3 = { dataKey: '', operator: '!=', cellValue: 'hello world', fieldType: FieldType.string, searchTerms } as FilterConditionOption;

    const output1 = executeStringFilterCondition(options1, getFilterParsedText(searchTerms));
    const output2 = executeStringFilterCondition(options2, getFilterParsedText(searchTerms));
    const output3 = executeStringFilterCondition(options3, getFilterParsedText(searchTerms));

    expect(output1).toBe(false);
    expect(output2).toBe(false);
    expect(output3).toBe(true);
  });

  it('should return True when input value provided starts with same substring and the operator is empty string', () => {
    const searchTerms = ['abb'];
    const options = { dataKey: '', operator: '', cellValue: 'abbostford', fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return True when input value provided starts with same substring and the operator is empty string & option "searchInputLastChar" is asterisk (*)', () => {
    const searchTerms = ['abb'];
    const options = {
      dataKey: '',
      operator: '',
      searchInputLastChar: '*',
      cellValue: 'abbostford',
      fieldType: FieldType.string,
      searchTerms,
    } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return True when input value provided ends with same substring and the operator is endsWith', () => {
    const searchTerms = ['Smith'];
    const options = {
      dataKey: '',
      operator: OperatorType.endsWith,
      cellValue: 'John Smith',
      fieldType: FieldType.string,
      searchTerms,
    } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return True when input value is in the range of search terms using 2 dots (..) notation', () => {
    const searchTerms = ['b..e'];
    const options = { dataKey: '', operator: 'EQ', cellValue: 'c', fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return True when input value is on the inclusive limit range of search terms using 2 dots (..) notation AND no operator provided except a defaultFilterRangeOperator is rangeInclusive', () => {
    const searchTerms = ['b..e'];
    const options = {
      dataKey: '',
      defaultFilterRangeOperator: OperatorType.rangeInclusive,
      cellValue: 'b',
      fieldType: FieldType.string,
      searchTerms,
    } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return False when input value is on the inclusive limit range of search terms using 2 dots (..) notation AND no operator provided except a defaultFilterRangeOperator is rangeExclusive', () => {
    const searchTerms = ['b..e'];
    const options = {
      dataKey: '',
      defaultFilterRangeOperator: OperatorType.rangeExclusive,
      cellValue: 'b',
      fieldType: FieldType.string,
      searchTerms,
    } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(false);
  });

  it('should return False when input value is not in the range of search terms using 2 dots (..) notation', () => {
    const searchTerms = ['b..e'];
    const options = { dataKey: '', operator: 'EQ', cellValue: 'g', fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(false);
  });

  it('should return True when input value equals the search terms min inclusive value and operator is set to "rangeInclusive" using 2 dots (..) notation', () => {
    const searchTerms = ['b..e'];
    const options = { dataKey: '', operator: 'RangeInclusive', cellValue: 'b', fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return False when input value equals the search terms min inclusive value and operator is set to "RangeExclusive" using 2 dots (..) notation', () => {
    const searchTerms = ['b..e'];
    const options = { dataKey: '', operator: 'RangeExclusive', cellValue: 'b', fieldType: FieldType.string, searchTerms } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(false);
  });

  it('should return True when input value contains accent is searchTerms value does not contain accent when "ignoreAccentOnStringFilterAndSort" is set in grid options', () => {
    const searchTerms = ['jose'];
    const options = {
      dataKey: '',
      operator: 'EQ',
      cellValue: 'José',
      fieldType: FieldType.string,
      ignoreAccentOnStringFilterAndSort: true,
    } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(true);
  });

  it('should return False when input value contains accent is searchTerms value does not contain accent when "ignoreAccentOnStringFilterAndSort" is not set in grid options', () => {
    const searchTerms = ['jose'];
    const options = {
      dataKey: '',
      operator: 'EQ',
      cellValue: 'José',
      fieldType: FieldType.string,
      ignoreAccentOnStringFilterAndSort: false,
    } as FilterConditionOption;
    const output = executeStringFilterCondition(options, getFilterParsedText(searchTerms));
    expect(output).toBe(false);
  });
});
