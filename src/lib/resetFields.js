/**
 * Given collection of fields sets their values to default
 */
import { getNow } from 'src/lib/dateUtils';
import InputTypes from 'src/types/InputTypes';

export default function resetFields(fields) {
  if (!fields) return;

  fields.forEach(field => {
    if (field.valueType === InputTypes.DATE) {
      field.value = getNow();
    } else if (field.valueType === InputTypes.NUMBER) {
      field.value = 0;
    } else {
      field.value = '';
    }
  });
}
