<template>
  <section class='insight-card number-card'>
    <div class='nc-head'>
      <h3>{{column.title}} <span class='secondary'>{{note}}</span></h3>
      <div v-if='!filtered' class='nc-ranges' role='group' aria-label='Period'>
        <button v-for='range in ranges' :key='range.name' type='button' :class='{selected: range.name === rangeName}'
            :aria-pressed='range.name === rangeName ? "true" : "false"' @click='rangeName = range.name'>{{range.name}}</button>
      </div>
    </div>

    <p v-if='!summary' class='secondary'>Nothing recorded in this period.</p>
    <template v-else>
      <!-- The number says what it is: a trend or a total, never a bare value. -->
      <div class='insight-number'>{{headline}} <span class='insight-unit'>{{headlineUnit}}</span></div>
      <div class='secondary small'>{{changeLine}}</div>
      <number-chart :entries='summary.entries' :trend='summary.trend' :bars='summary.buckets' :unit='summary.unit'
          :first='first' :last='last' :decimals='summary.decimals'></number-chart>
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
import bus from 'src/lib/bus.js';
import { formatDateOnly, getDateFromFilterString } from 'src/lib/dateUtils.js';
import { toDayNumber, fromDayNumber, formatDays } from 'src/lib/insights.js';
import {
  RANGES, getEntries, getNumberSummary, formatNumber, formatChange
} from 'src/lib/numberStats.js';
import setColumnCombine from 'src/lib/store/setColumnCombine.js';

const DEFAULT_RANGE = '3M';

export default {
  name: 'NumberCard',
  // `column` from projectHistory.numberColumns; `contributions` the days to
  // use (already narrowed to the focused value); `note` names that focus.
  props: ['project', 'column', 'contributions', 'note'],
  components: {
    NumberChart,
  },
  data() {
    return { rangeName: DEFAULT_RANGE, saving: false, saveError: '' };
  },
  computed: {
    ranges() {
      return RANGES;
    },
    isSum() {
      return this.column.combine === 'sum';
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
        first: this.first, last: this.last, combine: this.column.combine
      });
    },
    headline() {
      const { summary } = this;
      return formatNumber(this.isSum ? summary.total : summary.current, summary.decimals);
    },
    headlineUnit() {
      return this.isSum ? 'total' : 'trend';
    },
    // Neutral on purpose: the app can't know whether up is good.
    changeLine() {
      const { summary } = this;
      const { decimals } = summary;
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
        return `Most in a ${summary.unit}: ${formatNumber(summary.best.total, decimals)} ` +
          `(${formatShort(fromDayNumber(summary.best.day))}) · ${entries}`;
      }
      return `Lowest ${formatNumber(summary.lowest.value, decimals)} (${formatShort(fromDayNumber(summary.lowest.day))}) · ` +
        `highest ${formatNumber(summary.highest.value, decimals)} (${formatShort(fromDayNumber(summary.highest.day))}) · ` +
        entries;
    },
  },
  methods: {
    setCombine(isSum) {
      if (isSum === this.isSum || this.saving) return;
      this.saving = true;
      this.saveError = '';
      setColumnCombine(this.project, this.column.columnIndex, isSum ? 'sum' : undefined)
        .then(() => {
          this.saving = false;
          bus.fire('reload-project');
        })
        .catch(err => {
          this.saving = false;
          this.saveError = (err && err.message) || String(err);
        });
    },
  },
};

function formatShort(date) {
  return formatDateOnly(date).replace(/^(\w{3})\w*/, '$1');
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
  .number-chart {
    margin: 10px 0 4px;
  }
  .nc-combine {
    margin-top: 8px;
  }
}
</style>
