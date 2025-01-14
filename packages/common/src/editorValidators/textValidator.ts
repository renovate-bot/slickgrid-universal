import { Constants } from '../constants.js';
import type { EditorValidationResult } from '../interfaces/editorValidationResult.interface.js';
import type { EditorValidator } from '../interfaces/editorValidator.interface.js';

interface TextValidatorOptions {
  editorArgs: any;
  errorMessage?: string;
  minLength?: number;
  maxLength?: number;
  operatorConditionalType?: 'inclusive' | 'exclusive';
  required?: boolean;
  validator?: EditorValidator;
}

export function textValidator(inputValue: any, options: TextValidatorOptions): EditorValidationResult {
  const errorMsg = options.errorMessage;
  const isRequired = options.required;
  const minLength = options.minLength;
  const maxLength = options.maxLength;
  const operatorConditionalType = options.operatorConditionalType || 'inclusive';
  const mapValidation = {
    '{{minLength}}': minLength,
    '{{maxLength}}': maxLength,
  };
  let isValid = true;
  let outputMsg = '';
  const inputValueLength = inputValue?.length ?? 0;

  if (options.validator) {
    return options.validator(inputValue, options.editorArgs);
  }

  // by default the editor is almost always valid (except when it's required but not provided)
  if (isRequired && inputValue === '') {
    isValid = false;
    outputMsg = errorMsg || Constants.VALIDATION_REQUIRED_FIELD;
  } else if (
    minLength !== undefined &&
    maxLength !== undefined &&
    ((operatorConditionalType === 'exclusive' && (inputValueLength <= minLength || inputValueLength >= maxLength)) ||
      (operatorConditionalType === 'inclusive' && (inputValueLength < minLength || inputValueLength > maxLength)))
  ) {
    // MIN & MAX Length provided
    // make sure text length is between minLength and maxLength
    isValid = false;
    outputMsg =
      errorMsg ||
      Constants.VALIDATION_EDITOR_TEXT_LENGTH_BETWEEN.replace(
        /{{minLength}}|{{maxLength}}/gi,
        (matched) => (mapValidation as any)[matched]
      );
  } else if (
    minLength !== undefined &&
    inputValueLength !== null &&
    ((operatorConditionalType === 'exclusive' && inputValueLength <= minLength) ||
      (operatorConditionalType === 'inclusive' && inputValueLength !== null && inputValueLength < minLength))
  ) {
    // MIN Length ONLY
    // when text length is shorter than minLength
    isValid = false;
    const defaultErrorMsg =
      operatorConditionalType === 'inclusive'
        ? Constants.VALIDATION_EDITOR_TEXT_MIN_LENGTH_INCLUSIVE
        : Constants.VALIDATION_EDITOR_TEXT_MIN_LENGTH;
    outputMsg = errorMsg || defaultErrorMsg.replace(/{{minLength}}/gi, (matched) => (mapValidation as any)[matched]);
  } else if (
    maxLength !== undefined &&
    inputValueLength !== null &&
    ((operatorConditionalType === 'exclusive' && inputValueLength >= maxLength) ||
      (operatorConditionalType === 'inclusive' && inputValueLength !== null && inputValueLength > maxLength))
  ) {
    // MAX Length ONLY
    // when text length is longer than minLength
    isValid = false;
    const defaultErrorMsg =
      operatorConditionalType === 'inclusive'
        ? Constants.VALIDATION_EDITOR_TEXT_MAX_LENGTH_INCLUSIVE
        : Constants.VALIDATION_EDITOR_TEXT_MAX_LENGTH;
    outputMsg = errorMsg || defaultErrorMsg.replace(/{{maxLength}}/gi, (matched) => (mapValidation as any)[matched]);
  }

  return { valid: isValid, msg: outputMsg };
}
