import InputTypes from './InputTypes';

// Difference between input types and field types, is that field types are
// shown in UI as drop down box. Thus they need more information to
// present themsef nicely (like a friendly label).
export const DATE = {
  label: 'Date',
  value: InputTypes.DATE
};

export const MULTI_LINE_TEXT = {
  label: 'Multiline text',
  value: InputTypes.MULTI_LINE_TEXT,
};

export const SINGLE_LINE_TEXT = {
  label: 'Single line text',
  value: InputTypes.SINGLE_LINE_TEXT
};

export const NUMBER = {
  label: 'Number',
  value: InputTypes.NUMBER
};

export const IMAGE = {
  label: 'Image',
  value: InputTypes.IMAGE
};

export const FIELD_TYPES = [DATE, MULTI_LINE_TEXT, SINGLE_LINE_TEXT, NUMBER, IMAGE];

export function getFieldByType(typeName) {
  return typeNameToFieldLookup().get(typeName);
}

// store for fast lookup
let typeNameToField;
function typeNameToFieldLookup() {
  if (typeNameToField) return typeNameToField;

  typeNameToField = new Map();
  FIELD_TYPES.forEach(f => {
    typeNameToField.set(f.value, f);
  });

  return typeNameToField;
}

