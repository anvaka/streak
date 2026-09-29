import { getFieldByType } from '../../types/FieldTypes.js';

/**
 * Saves how a number column's values combine - 'sum' to add them up, else
 * each entry stands on its own - in the project's streak-settings.json. The
 * sheet itself doesn't change, so neither is the project reloaded: the loaded
 * copy is updated in place once the file is saved.
 */
export default function setColumnCombine(project, columnIndex, combine) {
  const fields = project.headers.map((header, index) => ({
    title: header.title,
    originalTitle: header.title,
    type: getFieldByType(header.valueType),
    combine: index === columnIndex ? combine : header.combine,
    columnIndex: index,
  }));
  return project.updateStructure(fields).then(() => {
    project.headers[columnIndex].combine = combine;
    const history = project.projectHistory;
    const column = history && history.numberColumns.find(c => c.columnIndex === columnIndex);
    if (column) column.combine = combine === 'sum' ? 'sum' : 'average';
  });
}
