/**
 * Clones an object
 */
export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Given a collection of objects returns a Map from a property value
 * to element in the collection. It assumes that all properties are unique!
 */
export function indexBy(collection, propName) {
  const index = new Map();

  collection.forEach(el => {
    if (propName in el) {
      const key = el[propName];
      if (index.has(key)) throw new Error('The name is not unique: ' + key);

      index.set(key, el);
    }
  });

  return index;
}
