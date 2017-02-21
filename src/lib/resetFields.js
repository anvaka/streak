/**
 * Given collection of fields sets their values to default
 */
import { getNow } from 'src/lib/dateUtils';

export default function resetFields(fields) {
  if (!fields) return;

  fields.forEach(field => {
    if (field.valueType === 'date') {
      field.value = getNow();
    } else if (field.valueType === 'number') {
      field.value = 0;
    } else {
      field.value = '';
    }
  });
}
