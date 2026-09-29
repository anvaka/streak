import { getFieldByType } from '../../types/FieldTypes.js';

/**
 * Saves how a number column's values combine - 'sum' to add them up, else
 * each entry stands on its own - in the project's streak-settings.json. The
 * sheet itself doesn't change.
 */
export default function setColumnCombine(project, columnIndex, combine) {
  const fields = project.headers.map((header, index) => ({
    title: header.title,
    originalTitle: header.title,
    type: getFieldByType(header.valueType),
    combine: index === columnIndex ? combine : header.combine,
    columnIndex: index,
  }));
  return project.updateStructure(fields);
}
