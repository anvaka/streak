import InputTypes from 'src/types/InputTypes';
import detectType from './detectType';

const DEFAULT_TYPE = InputTypes.SINGLE_LINE_TEXT;

export default function extractHeaderTypesFromData(sheetData, settings) {
  if (!sheetData) throw new Error('Sheet with headers is missing');

  const { values, headers } = sheetData;
  const headerCounters = headers.map(h => new HeaderCounter(h));

  if (settings && settings.fields) {
    // if we have settings, they should override type specification.
    settings.fields.forEach(field => setHeaderType(field.title, field.type));
  }

  // iterate over each row, and remember values.
  // TODO: Should I limit this to top N rows?
  values.forEach(row => {
    row.forEach((cell, headerNumber) => {
      if (headerNumber < headerCounters.length) {
        // TODO: What if some rows have more values than columns?
        headerCounters[headerNumber].count(cell);
      }
    });
  });

  return headerCounters.map(h => h.toHeaderDef());

  function setHeaderType(headerName, type) {
    const header = findHeaderByName(headerName);
    if (header) header.setType(type);
  }

  function findHeaderByName(name) {
    // There are less than 25 headers total, no need to use hash map for this
    for (let i = 0; i < headerCounters.length; ++i) {
      if (headerCounters[i].name === name) return headerCounters[i];
    }
  }
}

class HeaderCounter {
  constructor(name) {
    this.name = name;
    this.countsByType = new Map();
    // How often each value was seen, and how recently, so that autocomplete can
    // offer the values this column actually repeats before the one-offs.
    this.countsByValue = new Map();
    this.lastSeenAt = new Map();
    this.cellsSeen = 0;
  }

  count(cellValue) {
    const guessedType = detectType(cellValue);
    this.countsByType.set(guessedType, (this.countsByType.get(guessedType) || 0) + 1);

    const trimmedValue = cellValue && cellValue.trim();
    if (!trimmedValue) return;
    if (!this.hasMultiline) {
      if (guessedType === InputTypes.SINGLE_LINE_TEXT ||
        guessedType === InputTypes.MULTI_LINE_TEXT ||
        guessedType === InputTypes.TEXT) {
        this.hasMultiline = trimmedValue.indexOf('\n') > -1;
      }
    }
    this.cellsSeen += 1;
    this.countsByValue.set(trimmedValue, (this.countsByValue.get(trimmedValue) || 0) + 1);
    this.lastSeenAt.set(trimmedValue, this.cellsSeen);
  }

  setType(newType) {
    this.valueType = newType;
  }

  /**
   * Most used value first. Ties are broken by whichever was used most recently
   * - rows are read oldest to newest, so a larger `lastSeenAt` means later in
   * the sheet. Between two values used the same number of times, the one you
   * came back to more recently is the better guess.
   */
  sortedValues() {
    return Array.from(this.countsByValue.keys()).sort((a, b) => {
      const byCount = this.countsByValue.get(b) - this.countsByValue.get(a);
      if (byCount !== 0) return byCount;
      return this.lastSeenAt.get(b) - this.lastSeenAt.get(a);
    });
  }

  toHeaderDef() {
    const title = this.name;
    let valueType = this.valueType;
    if (!valueType) {
      // get the list of all guessed types, and sort it by number of occurrences in descending order
      const seenTypes = Array.from(this.countsByType).sort((x, y) => y[1] - x[1]);
      // our best candidate is the one that we saw most often:
      const topCandidate = seenTypes[0];
      valueType = (topCandidate && topCandidate[0]) || DEFAULT_TYPE;
    }

    return {
      title,
      valueType,
      autocomplete: this.sortedValues(),
      hasMultiline: this.hasMultiline
    };
  }
}
