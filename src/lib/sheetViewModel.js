export default function createSheetViewModel(rows) {
  return {
    groupBy
  };

  function groupBy(key) {
    if (!key) {
      throw new Error('Key function is required');
    }

    const group = new Map();

    rows.forEach(row => {
      const keyValue = key(row);
      let rowsInGroup = group.get(keyValue);
      if (!rowsInGroup) {
        rowsInGroup = [];
        group.set(keyValue, rowsInGroup);
      }

      rowsInGroup.push(row);
    });

    return group;
  }
}
