<template>
  <section class='insight-card number-card'>
    <div class='nc-head'>
      <h3>{{column.title}} <span class='secondary'>{{note}}</span></h3>
      <div v-if='!filtered' class='nc-ranges' role='group' aria-label='Period'>
        <button v-for='range in ranges' :key='range.name' type='button' :class='{selected: range.name === rangeName}'
            :aria-pressed='range.name === rangeName ? "true" : "false"' @click='setRange(range.name)'>{{range.name}}</button>
      </div>
    </div>

    <p v-if='!summary' class='secondary'>Nothing recorded in this period.</p>
    <template v-else>
      <!-- The number says what it is: a trend, an entry or a total, never a
           bare value. It reads out the day picked on the chart, if any. -->
      <div aria-live='polite'>
        <div class='insight-number'>{{headline}} <span class='insight-unit'>{{headlineUnit}}</span></div>
        <div class='secondary small nc-subline'>{{changeLine}}</div>
      </div>
      <number-chart :entries='summary.entries' :trend='summary.trend' :bars='summary.buckets' :unit='summary.unit'
          :first='first' :last='last' :decimals='summary.decimals' @pick='picked = $event'></number-chart>
      <div class='secondary small'>{{statsLine}}</div>
    </template>

    <!-- Only the owner decides whether the numbers add up; it's saved with the
         project, so everyone sees them the same way. -->
    <div v-if='project.canEdit' class='nc-combine small'>
      <span class='secondary'>Show</span>
      <button type='button' :class='{selected: !isSum}' :disabled='saving' @click='setCombine(false)'>each entry</button>
      <button type='button' :class='{selected: isSum}' :disabled='saving' @click='setCombine(true)'>totals</button>
      <span v-if='saving' class='secondary'>Saving...</span>
      <span v-if='saveError' class='secondary'>Could not save: {{saveError}}</span>
    </div>
  </section>
</template>

<script>
import NumberChart from './NumberChart.vue';
import { formatDateOnly, getDateFromFilterString } from 'src/lib/dateUtils.js';
import { toDayNumber, fromDayNumber, formatDays } from 'src/lib/insights.js';
import {
  RANGES, getEntries, getNumberSummary, formatNumber, formatChange
} from 'src/lib/numberStats.js';
import setColumnCombine from 'src/lib/store/setColumnCombine.js';
import getErrorMessage from 'src/lib/gapi/getErrorMessage.js';

const DEFAULT_RANGE = '3M';
const RANGE_KEY = 'streak.numberRange';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default {
  name: 'NumberCard',
  // `column` from projectHistory.numberColumns; `contributions` the days to
  // use (already narrowed to the focused value); `note` names that focus.
  props: ['project', 'column', 'contributions', 'note'],
  components: {
    NumberChart,
  },
  data() {
    // `combine` is shown at once when the owner switches it, and saved
    // behind it; it goes back if saving fails.
    return {
      rangeName: getSavedRange(), combine: this.column.combine, saving: false, saveError: '', picked: null
    };
  },
  watch: {
    'column.combine'(combine) {
      this.combine = combine;
    },
    // A pick belongs to the chart as it was.
    combine() { this.picked = null; },
    first() { this.picked = null; },
    last() { this.picked = null; },
  },
  computed: {
    ranges() {
      return RANGES;
    },
    isSum() {
      return this.combine === 'sum';
    },
    filtered() {
      return !!this.$route.query.from;
    },
    entries() {
      return getEntries(this.contributions, this.column.columnIndex);
    },
    today() {
      return toDayNumber(new Date());
    },
    // The date filter decides the days when there is one; otherwise the
    // chosen range, ending today and starting no earlier than the first entry.
    bounds() {
      const { from, to } = this.$route.query;
      if (from) {
        const a = toDayNumber(getDateFromFilterString(from));
        const b = to ? toDayNumber(getDateFromFilterString(to)) : a;
        return { first: Math.min(a, b), last: Math.min(Math.max(a, b), this.today) };
      }
      const range = RANGES.find(r => r.name === this.rangeName);
      const firstEntry = this.entries.length ? this.entries[0].day : this.today;
      return { first: Math.max(firstEntry, this.today - range.days + 1), last: this.today };
    },
    first() {
      return this.bounds.first;
    },
    last() {
      return this.bounds.last;
    },
    summary() {
      return getNumberSummary(this.entries, {
        first: this.first, last: this.last, combine: this.combine
      });
    },
    headline() {
      const { summary, picked } = this;
      if (picked) {
        const value = this.isSum ? picked.total : picked.values.reduce((a, b) => a + b, 0) / picked.values.length;
        return formatNumber(value, summary.decimals);
      }
      return formatNumber(this.isSum ? summary.total : summary.current, summary.decimals);
    },
    headlineUnit() {
      const { picked } = this;
      if (this.isSum) return 'total';
      if (!picked) return 'trend';
      return picked.values.length === 1 ? 'entered' : `average of ${picked.values.length}`;
    },
    // Neutral on purpose: the app can't know whether up is good.
    changeLine() {
      const { summary, picked } = this;
      const { decimals } = summary;
      if (picked) {
        if (this.isSum) return this.formatBucket(picked.day);
        const parts = [formatLong(fromDayNumber(picked.day))];
        if (picked.values.length > 1) parts.push(picked.values.map(v => formatNumber(v, decimals)).join(', '));
        if (picked.trend !== null) parts.push(`trend ${formatNumber(picked.trend, decimals)}`);
        return parts.join(' · ');
      }
      if (this.isSum) {
        if (summary.previousTotal === null) return '';
        return `${formatNumber(summary.previousTotal, decimals)} in the ` +
          `${formatDays(this.last - this.first + 1)} before`;
      }
      const parts = [];
      if (summary.change !== null) {
        parts.push(`${formatChange(summary.change, decimals)} since ${formatShort(summary.changeSince)}`);
      }
      if (summary.perWeek !== null) {
        parts.push(`about ${formatChange(summary.perWeek, Math.max(1, decimals))} a week lately`);
      }
      return parts.join(' · ');
    },
    statsLine() {
      const { summary } = this;
      const { decimals } = summary;
      const entries = summary.count === 1 ? '1 entry' : `${summary.count.toLocaleString('en-US')} entries`;
      if (this.isSum) {
        const when = summary.unit === 'week' ? `week of ${formatShort(fromDayNumber(summary.best.day))}` :
          this.formatBucket(summary.best.day);
        return `Most in a ${summary.unit}: ${formatNumber(summary.best.total, decimals)} (${when}) · ${entries}`;
      }
      return `Lowest ${formatNumber(summary.lowest.value, decimals)} (${formatShort(fromDayNumber(summary.lowest.day))}) · ` +
        `highest ${formatNumber(summary.highest.value, decimals)} (${formatShort(fromDayNumber(summary.highest.day))}) · ` +
        entries;
    },
  },
  methods: {
    setRange(name) {
      this.rangeName = name;
      try {
        localStorage.setItem(RANGE_KEY, name);
      } catch (err) {
        // Only a convenience: the range just isn't remembered.
      }
    },
    formatBucket(day) {
      const date = fromDayNumber(day);
      if (this.summary.unit === 'month') return formatShort(date).replace(/ \d+,/, '');
      if (this.summary.unit === 'week') return 'Week of ' + formatShort(date);
      return formatLong(date);
    },
    setCombine(isSum) {
      if (isSum === this.isSum || this.saving) return;
      const previous = this.combine;
      this.combine = isSum ? 'sum' : 'average';
      this.saving = true;
      this.saveError = '';
      setColumnCombine(this.project, this.column.columnIndex, isSum ? 'sum' : undefined)
        .then(() => {
          this.saving = false;
        })
        .catch(err => {
          this.saving = false;
          this.combine = previous;
          this.saveError = getErrorMessage(err);
        });
    },
  },
};

function formatShort(date) {
  return formatDateOnly(date).replace(/^(\w{3})\w*/, '$1');
}

// "Sat, Sep 26, 2026"
function formatLong(date) {
  return `${WEEKDAYS[date.getDay()]}, ${formatShort(date)}`;
}

// The range picked last time, on any card: someone who looks at a year
// once probably wants a year next time too.
function getSavedRange() {
  try {
    const name = localStorage.getItem(RANGE_KEY);
    if (RANGES.some(range => range.name === name)) return name;
  } catch (err) {
    // Storage can be off; the default will do.
  }
  return DEFAULT_RANGE;
}
</script>

<style lang='stylus'>
@import '../../styles/variables.styl';

.number-card {
  .nc-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 4px 14px;
  }
  .nc-ranges, .nc-combine {
    display: flex;
    align-items: center;
    gap: 4px;
    button {
      min-height: 28px;
      padding: 0 8px;
      border: 1px solid strong-border-color;
      border-radius: 4px;
      background: white;
      color: secondary-text-color;
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    button.selected {
      border-color: base-text-color;
      color: base-text-color;
    }
  }
  .nc-subline {
    min-height: 1.5em;
  }
  .number-chart {
    margin: 12px 0 8px;
  }
  .nc-combine {
    margin-top: 8px;
  }
}
</style>
