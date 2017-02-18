export default function detectType(inputString) {
  if (!inputString) return 'text';

  if (isFinite(inputString)) return 'number';

  if (parseDate(inputString)) return 'date';

  return 'text';
}

function parseDate(inputString) {
  const trimmedString = trim(inputString);
  const checkers = [
    new DateExpression(/^(\d?\d)\/(\d?\d)\/(\d\d\d\d)( (\d?\d):(\d?\d)(:\d?\d)?)?$/, match => {
      const month = match[1];
      const day = match[2];
      const year = match[3];

      return { month, day, year };
    })
  ];

  let i;

  for (i = 0; i < checkers.length; ++i) {
    const checker = checkers[i];
    if (checker.parse(trimmedString)) return true;
  }

  return false;
}

class DateExpression {
  constructor(matchRegexp, extractDateCallback) {
    this.matchRegexp = matchRegexp;
    this.extractDateCallback = extractDateCallback;
  }

  parse(input) {
    if (!input) return;

    const match = input.match(this.matchRegexp);
    if (!match) return;

    const dateModel = this.extractDateCallback(match, input);
    if (!dateModel) return;

    // https://tools.ietf.org/html/rfc2822#section-3.3
    const dateRFC2822 = dateModelToRFC2822Format(dateModel);
    const date = new Date(Date.parse(dateRFC2822));

    if (isNaN(date)) return;

    return date;
  }
}

function trim(str) {
  if (!str) return;

  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dateModelToRFC2822Format(dateModel) {
  const month = Number.parseInt(dateModel.month, 10);
  const day = Number.parseInt(dateModel.day, 10);
  const year = Number.parseInt(dateModel.year, 10);

  if (month < 1 || month > 12) return '';

  return `${day} ${monthNames[month - 1]} ${year}`;
}
