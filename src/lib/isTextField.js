import InputTypes from '../types/InputTypes';

export default function isTetField(field) {
  if (!field) return false;

  const { valueType } = field;
  return valueType === InputTypes.MULTI_LINE_TEXT ||
    valueType === InputTypes.TEXT ||
    valueType === InputTypes.SINGLE_LINE_TEXT;
}
