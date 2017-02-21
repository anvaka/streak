export default extractColumnTypesMetadata;

function extractColumnTypesMetadata(properties) {
  // When we save a new project we set file properties to describe column types
  // Here we will try to restore saved properties and create a look up from
  // column name to column type. That way we can make better guesses about
  // column types, and render most appropriate input control.
  const columnTypeByName = new Map();
  if (!properties) return columnTypeByName;

  const foundProperties = [];
  Object.keys(properties).forEach(key => {
    // Each column property has format of
    // col.${idx}.(name|type) = value;
    const columnProperty = getPropertyFromKey(key);

    if (columnProperty) {
      const { index } = columnProperty;
      const lastRecord = foundProperties[index] || {};
      lastRecord[columnProperty.kind] = columnProperty.value;

      foundProperties[index] = lastRecord;
    }
  });

  if (!foundProperties.length === 0) {
    // This can happen if file was not created by us. In this case we will try to
    // dedcue column types from data.
    return columnTypeByName;
  }

  foundProperties.forEach(column => columnTypeByName.set(column.name, column.type));

  return columnTypeByName;

  function getPropertyFromKey(key) {
    if (!key) return;

    const matchColumnProperty = key.match(/^col\.(\d+)\.(name|type)$/);
    if (matchColumnProperty) {
      return {
        index: matchColumnProperty[1],
        kind: matchColumnProperty[2],
        value: properties[key]
      };
    }
  }
}

