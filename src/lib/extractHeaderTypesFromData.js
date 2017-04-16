import InputTypes from 'src/types/InputTypes';
import detectType from './detectType';

const DEFAULT_TYPE = InputTypes.SINGLE_LINE_TEXT;

export default function extractHeaderTypesFromData(sheetData) {
  if (!sheetData) throw new Error('Sheet with headers is missing');

  const { values, headers } = sheetData;
  const headerCounters = headers.map(h => new HeaderCounter(h));

  // iterate over each row, and remember values.
  // TODO: Should I limit this to top N rows?
  // TODO: If I iterate from the back, I'd get LRU items, which might be better
  // for autocompletion
  values.forEach(row => {
    row.forEach((cell, headerNumber) => {
      if (headerNumber < headerCounters.length) {
        // TODO: What if some rows have more values than columns?
        headerCounters[headerNumber].count(cell);
      }
    });
  });

  return headerCounters.map(h => h.toHeaderDef());
}

class HeaderCounter {
  constructor(name) {
    this.name = name;
    this.countsByType = new Map();
    this.seenValues = new Set();
  }

  count(cellValue) {
    const guessedType = detectType(cellValue);
    this.countsByType.set(guessedType, (this.countsByType.get(guessedType) || 0) + 1);

    const trimmedValue = cellValue && cellValue.trim();
    if (trimmedValue) this.seenValues.add(trimmedValue);
  }

  toHeaderDef() {
    const title = this.name;
    // getthe list of all guessed types, and sort it by number of occurrences in descending order
    const seenTypes = Array.from(this.countsByType).sort((x, y) => y[1] - x[1]);
    // our best candidate is the one that we saw most often:
    const topCandidate = seenTypes[0];
    const valueType = (topCandidate && topCandidate[0]) || DEFAULT_TYPE;

    return {
      title,
      valueType,
      autocomplete: Array.from(this.seenValues)
    };
  }
}
