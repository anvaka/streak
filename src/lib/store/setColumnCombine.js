/**
 * Saves how a number column's values combine - 'sum' to add them up, else
 * each entry stands on its own - in the project's streak-settings.json. Only
 * that file changes: not the sheet, and not the other columns' types, which
 * stay as they were saved or guessed. The loaded project is updated in place
 * once the file is saved, so nothing reloads.
 */
export default function setColumnCombine(project, columnIndex, combine) {
  const { title } = project.headers[columnIndex];
  return project.saveSettings(settings => {
    if (!settings.fields) settings.fields = [];
    let field = settings.fields.find(f => f.title === title);
    if (!field) {
      field = { title };
      settings.fields.push(field);
    }
    if (combine) field.combine = combine;
    else delete field.combine;
  }).then(() => {
    project.headers[columnIndex].combine = combine;
    const history = project.projectHistory;
    const column = history && history.numberColumns.find(c => c.columnIndex === columnIndex);
    if (column) column.combine = combine === 'sum' ? 'sum' : 'average';
  });
}
