<template>
  <section class='insight-card number-card'>
    <div class='nc-head'>
      <h3>{{column.title}} <span class='secondary'>{{note}}</span></h3>
      <div v-if='!filtered' class='nc-ranges' role='group' aria-label='Period'>
        <button v-for='range in ranges' :key='range.name' type='button' :class='{selected: range.name === rangeName}'
            :aria-pressed='range.name === rangeName ? "true" : "false"' @click='setRange(range.name)'>{{range.name}}</button>
      </div>
    </div>

    <p v-if='!chartData' class='secondary'>Nothing recorded in this period.</p>
    <template v-else>
      <!-- The number says what it is: a trend, an entry or a total, never a
           bare value. It reads out the day picked on the chart, if any, and
           otherwise the days on screen. -->
      <div aria-live='polite'>
        <div v-if='summary || picked' class='insight-number'>{{headline}} <span class='insight-unit'>{{headlineUnit}}</span></div>
        <!-- The smaller unit makes the line a little taller; an empty one
             keeps it as tall, so the chart doesn't jump while scrolling. -->
        <div v-else class='insight-number secondary'>&ndash; <span class='insight-unit'>&nbsp;</span></div>
        <div class='secondary small nc-subline'>{{changeLine}}</div>
      </div>
      <number-chart :entries='chartData.entries' :trend='chartData.trend' :bars='chartData.buckets' :unit='chartData.unit'
          :first='extent.first' :last='extent.last' :visible='visibleDays' :decimals='chartData.decimals'
          @pick='picked = $event' @view='view = $event'></number-chart>
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
import { formatShortDate, DAY_NAMES } from 'src/lib/dateUtils.js';
import { toDayNumber, fromDayNumber, formatDays, getScope } from 'src/lib/insights.js';
import {
  RANGES, getEntries, getNumberSummary, getBucketUnit, formatNumber, formatChange
} from 'src/lib/numberStats.js';
import setColumnCombine from 'src/lib/store/setColumnCombine.js';
import getErrorMessage from 'src/lib/gapi/getErrorMessage.js';
import now from 'src/lib/today.js';

const DEFAULT_RANGE = '3M';
const RANGE_KEY = 'streak.numberRange';

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
      rangeName: getSavedRange(), combine: this.column.combine, saving: false, saveError: '', picked: null,
      // The days on screen, from the chart, while it's scrolled.
      view: null,
    };
  },
  watch: {
    'column.combine'(combine) {
      this.combine = combine;
    },
    // A pick belongs to the chart as it was; scrolling keeps it.
    combine() { this.picked = null; },
    extent() { this.picked = null; },
    visibleDays() { this.picked = null; },
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
      return toDayNumber(now());
    },
    // The days the chart draws: the date filter's when there is one, and
    // otherwise from the first entry to today.
    extent() {
      const { from, to } = this.$route.query;
      const firstEntry = this.entries.length ? this.entries[0].day : this.today;
      const { first, last } = getScope(from, to, firstEntry, this.today);
      return { first, last };
    },
    // How many of them fit on screen: the chosen range, or all the
    // filtered days. The rest are a scroll away.
    visibleDays() {
      const length = this.extent.last - this.extent.first + 1;
      if (this.filtered) return length;
      const range = RANGES.find(r => r.name === this.rangeName);
      return Math.min(length, range.days);
    },
    // The days on screen: the latest ones until the chart scrolls.
    bounds() {
      const { view, extent } = this;
      if (view && extent.first <= view.first && view.last <= extent.last) return view;
      return { first: Math.max(extent.first, extent.last - this.visibleDays + 1), last: extent.last };
    },
    first() {
      return this.bounds.first;
    },
    last() {
      return this.bounds.last;
    },
    scrolledBack() {
      return this.last < this.extent.last;
    },
    // Bars as long as suit the days on screen, wherever it scrolls.
    unit() {
      return getBucketUnit(this.visibleDays);
    },
    chartData() {
      return getNumberSummary(this.entries, {
        first: this.extent.first, last: this.extent.last, combine: this.combine, unit: this.unit
      });
    },
    summary() {
      return getNumberSummary(this.entries, {
        first: this.first, last: this.last, combine: this.combine, unit: this.unit
      });
    },
    headline() {
      const { summary, picked } = this;
      const decimals = this.chartData.decimals;
      if (picked) {
        const value = this.isSum ? picked.total : picked.values.reduce((a, b) => a + b, 0) / picked.values.length;
        return formatNumber(value, decimals);
      }
      return formatNumber(this.isSum ? summary.total : summary.current, decimals);
    },
    headlineUnit() {
      const { picked, summary } = this;
      if (this.isSum) return 'total';
      if (!picked) return this.scrolledBack ? `trend on ${formatShortDate(fromDayNumber(summary.trend[summary.trend.length - 1].day))}` : 'trend';
      return picked.values.length === 1 ? 'entered' : `average of ${picked.values.length}`;
    },
    // Neutral on purpose: the app can't know whether up is good.
    changeLine() {
      const { summary, picked } = this;
      const { decimals } = this.chartData;
      if (!picked && !summary) return this.formatSpan();
      if (picked) {
        if (this.isSum) return this.formatBucket(picked.day);
        const parts = [formatLong(fromDayNumber(picked.day))];
        if (picked.values.length > 1) parts.push(picked.values.map(v => formatNumber(v, decimals)).join(', '));
        if (picked.trend !== null) parts.push(`trend ${formatNumber(picked.trend, decimals)}`);
        return parts.join(' · ');
      }
      if (this.isSum) {
        const parts = this.scrolledBack ? [this.formatSpan()] : [];
        if (summary.previousTotal !== null) {
          parts.push(`${formatNumber(summary.previousTotal, decimals)} in the ` +
            `${formatDays(this.last - this.first + 1)} before`);
        }
        return parts.join(' · ');
      }
      const parts = [];
      if (summary.change !== null) {
        parts.push(`${formatChange(summary.change, decimals)} since ${formatShortDate(summary.changeSince)}`);
      }
      // "Lately" only for the latest days.
      if (summary.perWeek !== null && !this.scrolledBack) {
        parts.push(`about ${formatChange(summary.perWeek, Math.max(1, decimals))} a week lately`);
      }
      return parts.join(' · ');
    },
    statsLine() {
      const { summary } = this;
      if (!summary) return 'Nothing recorded on these days';
      const { decimals } = this.chartData;
      const entries = summary.count === 1 ? '1 entry' : `${summary.count.toLocaleString('en-US')} entries`;
      if (this.isSum) {
        const when = summary.unit === 'week' ? `week of ${formatShortDate(fromDayNumber(summary.best.day))}` :
          this.formatBucket(summary.best.day);
        return `Most in a ${summary.unit}: ${formatNumber(summary.best.total, decimals)} (${when}) · ${entries}`;
      }
      return `Lowest ${formatNumber(summary.lowest.value, decimals)} (${formatShortDate(fromDayNumber(summary.lowest.day))}) · ` +
        `highest ${formatNumber(summary.highest.value, decimals)} (${formatShortDate(fromDayNumber(summary.highest.day))}) · ` +
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
    // "Jun 3, 2025 – Sep 1, 2025": the days on screen.
    formatSpan() {
      return `${formatShortDate(fromDayNumber(this.first))} – ${formatShortDate(fromDayNumber(this.last))}`;
    },
    formatBucket(day) {
      const date = fromDayNumber(day);
      if (this.unit === 'month') return formatShortDate(date).replace(/ \d+,/, '');
      if (this.unit === 'week') return 'Week of ' + formatShortDate(date);
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

// "Sat, Sep 26, 2026"
function formatLong(date) {
  return `${DAY_NAMES[date.getDay()]}, ${formatShortDate(date)}`;
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
