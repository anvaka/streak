<template>
  <div class='number-chart' ref='chart'>
    <!-- Every entry as a dot, and the trend through them; or a bar per week
         (or day, or month) when the column adds up. Tapping anywhere picks
         the closest one for the caption. -->
    <svg :width='width' :height='height' @click='onClick' role='img' :aria-label='caption'>
      <line class='nc-axis' :x1='0' :x2='width' :y1='plotBottom + 0.5' :y2='plotBottom + 0.5'></line>
      <template v-if='bars'>
        <rect v-for='bar in drawnBars' :key='bar.day' :x='bar.x' :y='bar.y' :width='bar.width' :height='bar.height'
            class='nc-bar' :class='{selected: bar === selected}'></rect>
      </template>
      <template v-else>
        <circle v-for='(dot, i) in drawnDots' :key='i' :cx='dot.x' :cy='dot.y' r='2.5' class='nc-dot'
            :class='{selected: dot === selected}'></circle>
        <polyline v-if='trendPoints' :points='trendPoints' class='nc-trend'></polyline>
      </template>
      <text class='nc-label' x='0' :y='10'>{{formatValue(scale.max)}}</text>
      <text v-if='!bars' class='nc-label' x='0' :y='plotBottom - 4'>{{formatValue(scale.min)}}</text>
      <text class='nc-label' x='0' :y='height - 2'>{{formatDay(first)}}</text>
      <text class='nc-label' :x='width' :y='height - 2' text-anchor='end'>{{formatDay(last)}}</text>
    </svg>
    <div class='nc-caption'>{{caption}}</div>
  </div>
</template>

<script>
import { fromDayNumber } from 'src/lib/insights.js';
import { formatNumber } from 'src/lib/numberStats.js';

const HEIGHT = 150;
const AXIS_SPACE = 16;
const TOP_SPACE = 14;
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default {
  name: 'NumberChart',
  // `entries` and `trend`: [{day, value}]; `bars`: [{day, total}] instead,
  // `unit` naming their length. `first`/`last` are the days shown.
  props: ['entries', 'trend', 'bars', 'unit', 'first', 'last', 'decimals'],
  data() {
    return { width: 320, height: HEIGHT, picked: null };
  },
  mounted() {
    this.measure();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.measure());
      this.resizeObserver.observe(this.$refs.chart);
    }
  },
  beforeUnmount() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
  },
  watch: {
    first() { this.picked = null; },
    bars() { this.picked = null; },
  },
  computed: {
    plotBottom() {
      return this.height - AXIS_SPACE;
    },
    scale() {
      if (this.bars) {
        return { min: 0, max: Math.max(...this.bars.map(bar => bar.total)) || 1 };
      }
      // Fitted to the values, not from zero: a weight moves a few percent.
      const values = this.entries.map(e => e.value).concat(this.trend.map(p => p.value));
      let min = Math.min(...values);
      let max = Math.max(...values);
      if (min === max) {
        min -= 1;
        max += 1;
      }
      return { min, max };
    },
    drawnDots() {
      return this.entries.map(entry => ({ entry, x: this.getX(entry.day), y: this.getY(entry.value) }));
    },
    trendPoints() {
      if (!this.trend || this.trend.length < 2) return '';
      return this.trend.map(p => `${this.getX(p.day).toFixed(1)},${this.getY(p.value).toFixed(1)}`).join(' ');
    },
    // One slot per bar: the first week or month may start before the period,
    // and months differ in length, but each bar is one of them.
    drawnBars() {
      const step = this.width / this.bars.length;
      const barWidth = Math.max(1, step - Math.min(2, step / 4));
      return this.bars.map((bar, i) => {
        const y = this.getY(bar.total);
        return {
          bar,
          day: bar.day,
          x: i * step,
          y,
          width: barWidth,
          height: Math.max(bar.total ? 1 : 0, this.plotBottom - y),
        };
      });
    },
    // The picked mark, else the latest one.
    selected() {
      const marks = this.bars ? this.drawnBars : this.drawnDots;
      if (this.picked !== null && this.picked < marks.length) return marks[this.picked];
      return marks[marks.length - 1];
    },
    caption() {
      const mark = this.selected;
      if (!mark) return '';
      if (this.bars) {
        return `${this.formatBucket(mark.bar.day)}: ${this.formatValue(mark.bar.total)}`;
      }
      return `${this.formatDay(mark.entry.day)}: ${this.formatValue(mark.entry.value)}`;
    },
  },
  methods: {
    measure() {
      const width = this.$refs.chart && this.$refs.chart.clientWidth;
      if (width) this.width = width;
    },
    getX(day) {
      const span = Math.max(1, this.last - this.first);
      return (day - this.first) / span * this.width;
    },
    getY(value) {
      const { min, max } = this.scale;
      return TOP_SPACE + (1 - (value - min) / (max - min)) * (this.plotBottom - TOP_SPACE);
    },
    onClick(e) {
      const x = e.clientX - this.$refs.chart.getBoundingClientRect().left;
      const marks = this.bars ? this.drawnBars : this.drawnDots;
      let best = 0;
      marks.forEach((mark, i) => {
        const center = this.bars ? mark.x + mark.width / 2 : mark.x;
        const bestCenter = this.bars ? marks[best].x + marks[best].width / 2 : marks[best].x;
        if (Math.abs(center - x) < Math.abs(bestCenter - x)) best = i;
      });
      this.picked = best;
    },
    formatValue(value) {
      return formatNumber(value, this.decimals);
    },
    formatDay(day) {
      const date = fromDayNumber(day);
      return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    },
    formatBucket(day) {
      const date = fromDayNumber(day);
      if (this.unit === 'month') return `${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
      if (this.unit === 'week') return 'Week of ' + this.formatDay(day);
      return this.formatDay(day);
    },
  },
};
</script>

<style lang='stylus'>
@import '../../styles/variables.styl';

.number-chart {
  svg {
    display: block;
    overflow: visible;
    cursor: pointer;
  }
  .nc-axis {
    stroke: strong-border-color;
  }
  .nc-dot {
    fill: rgba(0, 114, 178, 0.35);
  }
  .nc-dot.selected {
    fill: #0072B2;
    stroke: white;
    stroke-width: 1.5;
    r: 4;
  }
  .nc-trend {
    fill: none;
    stroke: #0072B2;
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .nc-bar {
    fill: #0072B2;
    opacity: 0.55;
  }
  .nc-bar.selected {
    opacity: 1;
  }
  .nc-label {
    font-size: 11px;
    fill: secondary-text-color;
  }
  .nc-caption {
    font-size: 14px;
    min-height: 20px;
  }
}
</style>
