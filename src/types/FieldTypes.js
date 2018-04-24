import InputTypes from './InputTypes';

// Difference between input types and field types, is that field types are
// shown in UI as drop down box. Thus they need more information to
// present themselves nicely (like a friendly label).
export const DATE = {
  label: 'Date',
  value: InputTypes.DATE
};

export const TEXT = {
  label: 'Text',
  value: InputTypes.TEXT,
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

export const FIELD_TYPES = [DATE, TEXT, NUMBER];

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
  // Legacy input types map to text.
  typeNameToField.set(InputTypes.MULTI_LINE_TEXT, TEXT);
  typeNameToField.set(InputTypes.SINGLE_LINE_TEXT, TEXT);

  return typeNameToField;
}

