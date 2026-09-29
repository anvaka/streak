<template>
  <div class='number-chart' ref='chart'>
    <!-- Every entry as a dot and the trend through them; or a bar per day,
         week or month when the column adds up. Pressing or dragging anywhere
         picks the closest day, and the card's header reads it out. -->
    <svg :width='width' :height='height' role='img' :aria-label='description' tabindex='0'
        @pointerdown='onPointerDown' @pointermove='onPointerMove' @pointerup='onPointerUp'
        @pointercancel='onPointerCancel' @keydown='onKeyDown'>
      <g class='nc-grid'>
        <template v-for='tick in valueTicks' :key='tick.value'>
          <line :x1='plotLeft' :x2='plotRight' :y1='tick.y' :y2='tick.y' :class='{base: tick.base}'></line>
          <text class='nc-label' :x='plotRight + 6' :y='tick.y + 4'>{{tick.label}}</text>
        </template>
        <template v-for='tick in dateTicks' :key='tick.day'>
          <line :x1='tick.x' :x2='tick.x' :y1='plotBottom' :y2='plotBottom + 4'></line>
          <text class='nc-label' :class='{strong: tick.strong}' :x='tick.labelX' :y='plotBottom + 16'>{{tick.label}}</text>
        </template>
      </g>

      <template v-if='bars'>
        <rect v-for='(bar, i) in drawnBars' :key='bar.day' :x='bar.x' :y='bar.y' :width='bar.width' :height='bar.height'
            class='nc-bar' :class='{selected: i === picked, faded: picked !== null && i !== picked}'></rect>
      </template>
      <template v-else>
        <line v-if='selected' class='nc-rule' :x1='selected.x' :x2='selected.x' :y1='TOP' :y2='plotBottom'></line>
        <circle v-for='(dot, i) in drawnDots' :key='i' :cx='dot.x' :cy='dot.y' :r='dotRadius' class='nc-dot'></circle>
        <polyline v-for='(line, i) in trendLines' :key='"t" + i' :points='line' class='nc-trend'></polyline>
        <template v-if='selected'>
          <circle v-for='(y, i) in selected.ys' :key='"s" + i' :cx='selected.x' :cy='y' r='4' class='nc-dot selected'></circle>
          <circle v-if='selected.trendY !== null' :cx='selected.x' :cy='selected.trendY' r='3.5' class='nc-trend-mark'></circle>
        </template>
        <circle v-else-if='trendEnd' :cx='trendEnd.x' :cy='trendEnd.y' r='3.5' class='nc-trend-end'></circle>
      </template>
    </svg>
  </div>
</template>

<script>
import { fromDayNumber } from 'src/lib/insights.js';
import { formatNumber, splitAtBreaks } from 'src/lib/numberStats.js';
import { getValueScale, getDateTicks, getLabelWidth } from 'src/lib/chartScale.js';

const TOP = 8;
const DATE_SPACE = 22;
// Wide enough for a dot at the very first day.
const LEFT = 3;
const MIN_HEIGHT = 180;
const MAX_HEIGHT = 260;
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default {
  name: 'NumberChart',
  // `entries` and `trend`: [{day, value}]; `bars`: [{day, total}] instead,
  // `unit` naming their length. `first`/`last` are the days shown.
  // Emits `pick` with the picked day - `{day, values, trend}`, or
  // `{day, total}` for a bar - and with null when nothing is picked.
  props: ['entries', 'trend', 'bars', 'unit', 'first', 'last', 'decimals'],
  emits: ['pick'],
  data() {
    return { width: 320, picked: null, TOP, plotLeft: LEFT };
  },
  mounted() {
    this.measure();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.measure());
      this.resizeObserver.observe(this.$refs.chart);
    }
    document.addEventListener('pointerdown', this.onPointerDownOutside);
  },
  beforeUnmount() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    document.removeEventListener('pointerdown', this.onPointerDownOutside);
  },
  watch: {
    first() { this.picked = null; },
    last() { this.picked = null; },
    bars() { this.picked = null; },
    pickedItem(item) { this.$emit('pick', item); },
  },
  computed: {
    // About 16:9 on a phone, and not too tall on a wide screen.
    height() {
      return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.round(this.width * 0.55)));
    },
    plotBottom() {
      return this.height - DATE_SPACE;
    },
    scale() {
      if (this.bars) return getValueScale(this.bars.map(bar => bar.total), { fromZero: true });
      return getValueScale(this.entries.map(e => e.value).concat(this.trend.map(p => p.value)));
    },
    // The values are labelled right of the plot, as in Apple Health: the
    // latest days, which matter most, stay clear of them.
    plotRight() {
      const widest = Math.max(...this.scale.ticks.map(v => this.formatTick(v).length));
      return this.width - (getLabelWidth(widest) - 6);
    },
    valueTicks() {
      return this.scale.ticks.map((value, i) => ({
        value, base: i === 0, y: this.getY(value), label: this.formatTick(value)
      }));
    },
    dateTicks() {
      const ticks = getDateTicks(this.first, this.last, this.plotRight - LEFT);
      let taken = -Infinity;
      return ticks.map(tick => {
        const x = this.bars ? this.getBarX(tick.day) : this.getX(tick.day);
        const labelWidth = getLabelWidth(tick.label.length) - 14;
        // Centered under its tick, but kept inside the plot.
        const labelX = Math.max(0, Math.min(this.plotRight - labelWidth, x - labelWidth / 2));
        return { ...tick, x, labelX, labelWidth };
      }).filter(tick => {
        if (tick.labelX < taken + 6) return false;
        taken = tick.labelX + tick.labelWidth;
        return true;
      });
    },

    // One mark per day with entries: all of its dots and the trend there.
    days() {
      if (this.bars) return [];
      const trendByDay = new Map(this.trend.map(p => [p.day, p.value]));
      const days = [];
      this.entries.forEach(entry => {
        const last = days[days.length - 1];
        if (last && last.day === entry.day) last.values.push(entry.value);
        else days.push({ day: entry.day, values: [entry.value], trend: trendByDay.has(entry.day) ? trendByDay.get(entry.day) : null });
      });
      return days;
    },
    drawnDots() {
      return this.entries.map(entry => ({ x: this.getX(entry.day), y: this.getY(entry.value) }));
    },
    // Smaller dots when they crowd, so the trend stays on top.
    dotRadius() {
      const perPixel = this.days.length / Math.max(1, this.plotRight - LEFT);
      return perPixel > 0.5 ? 1.5 : perPixel > 0.2 ? 2 : 2.5;
    },
    trendLines() {
      if (!this.trend) return [];
      return splitAtBreaks(this.trend)
        .filter(piece => piece.length > 1)
        .map(piece => piece.map(p => `${this.getX(p.day).toFixed(1)},${this.getY(p.value).toFixed(1)}`).join(' '));
    },
    trendEnd() {
      const end = this.trend && this.trend[this.trend.length - 1];
      return end ? { x: this.getX(end.day), y: this.getY(end.value) } : null;
    },

    // One slot per bar: the first week or month may start before the period,
    // and months differ in length, but each bar is one of them.
    barStep() {
      return (this.plotRight - LEFT) / this.bars.length;
    },
    drawnBars() {
      const step = this.barStep;
      const barWidth = Math.max(1, step - Math.min(2, step / 4));
      return this.bars.map((bar, i) => {
        const y = this.getY(bar.total);
        return {
          day: bar.day,
          x: LEFT + i * step,
          y,
          width: barWidth,
          height: Math.max(bar.total ? 1 : 0, this.plotBottom - y),
        };
      });
    },

    marks() {
      return this.bars ? this.bars : this.days;
    },
    pickedItem() {
      if (this.picked === null || this.picked >= this.marks.length) return null;
      return this.marks[this.picked];
    },
    selected() {
      const item = this.pickedItem;
      if (!item || this.bars) return null;
      return {
        x: this.getX(item.day),
        ys: item.values.map(value => this.getY(value)),
        trendY: item.trend === null ? null : this.getY(item.trend),
      };
    },
    description() {
      const span = `${this.formatDay(this.first)} to ${this.formatDay(this.last)}`;
      const { ticks } = this.scale;
      if (this.bars) {
        return `Totals per ${this.unit}, ${span}. Press or drag across the chart, or use the arrow keys, to read each ${this.unit}.`;
      }
      const values = this.entries.map(e => e.value);
      return `${this.entries.length} entries from ${span}, between ${formatNumber(Math.min(...values), this.decimals)} ` +
        `and ${formatNumber(Math.max(...values), this.decimals)}; the scale runs from ${this.formatTick(ticks[0])} ` +
        `to ${this.formatTick(ticks[ticks.length - 1])}. Press or drag across the chart, or use the arrow keys, to read each day.`;
    },
  },
  methods: {
    measure() {
      const width = this.$refs.chart && this.$refs.chart.clientWidth;
      if (width) this.width = width;
    },
    getX(day) {
      if (this.last === this.first) return (LEFT + this.plotRight) / 2;
      return LEFT + (day - this.first) / (this.last - this.first) * (this.plotRight - LEFT);
    },
    // Where `day` falls among the bars.
    getBarX(day) {
      const { bars } = this;
      let i = bars.length - 1;
      while (i > 0 && bars[i].day > day) i -= 1;
      const end = i + 1 < bars.length ? bars[i + 1].day : this.last + 1;
      return LEFT + (i + Math.min(1, Math.max(0, (day - bars[i].day) / Math.max(1, end - bars[i].day)))) * this.barStep;
    },
    getY(value) {
      const { min, max } = this.scale;
      return TOP + (1 - (value - min) / (max - min)) * (this.plotBottom - TOP);
    },

    // Press to pick, drag to move along. Only sideways drags reach here:
    // `touch-action: pan-y` leaves scrolling the page to the browser, which
    // then cancels the press, and the earlier pick comes back.
    onPointerDown(e) {
      if (e.button) return;
      this.pickedBefore = this.picked;
      this.dragging = true;
      if (e.currentTarget.setPointerCapture && e.pointerId !== undefined) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch (err) {
          // Only a nicety: dragging off the chart stops moving the pick.
        }
      }
      this.pickAt(e.clientX);
    },
    onPointerMove(e) {
      if (this.dragging) this.pickAt(e.clientX);
    },
    onPointerUp() {
      this.dragging = false;
    },
    onPointerCancel() {
      this.dragging = false;
      this.picked = this.pickedBefore;
    },
    onPointerDownOutside(e) {
      if (this.$refs.chart && !this.$refs.chart.contains(e.target)) this.picked = null;
    },
    onKeyDown(e) {
      const count = this.marks.length;
      if (!count) return;
      const current = this.picked === null ? count : this.picked;
      let next;
      if (e.key === 'ArrowLeft') next = Math.max(0, current - 1);
      else if (e.key === 'ArrowRight') next = this.picked === null ? count - 1 : Math.min(count - 1, current + 1);
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = count - 1;
      else if (e.key === 'Escape') next = null;
      else return;
      e.preventDefault();
      this.picked = next;
    },
    // The mark closest to `clientX` along the time axis only.
    pickAt(clientX) {
      const x = clientX - this.$refs.chart.getBoundingClientRect().left;
      const centers = this.bars ?
        this.drawnBars.map(bar => bar.x + bar.width / 2) :
        this.days.map(day => this.getX(day.day));
      let best = null;
      centers.forEach((center, i) => {
        if (best === null || Math.abs(center - x) < Math.abs(centers[best] - x)) best = i;
      });
      this.picked = best;
    },

    formatTick(value) {
      return formatNumber(value, this.scale.decimals);
    },
    formatDay(day) {
      const date = fromDayNumber(day);
      return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
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
    cursor: crosshair;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  svg:focus-visible {
    outline: 2px solid #0072B2;
    outline-offset: 2px;
  }
  .nc-grid line {
    stroke: rgb(234, 236, 239);
  }
  .nc-grid line.base {
    stroke: strong-border-color;
  }
  .nc-label {
    font-size: 12px;
    fill: secondary-text-color;
  }
  .nc-label.strong {
    font-weight: bold;
    fill: base-text-color;
  }
  .nc-rule {
    stroke: rgba(0, 0, 0, 0.3);
    stroke-width: 1;
  }
  .nc-dot {
    fill: rgba(0, 114, 178, 0.35);
  }
  .nc-dot.selected {
    fill: #0072B2;
    stroke: white;
    stroke-width: 1.5;
  }
  .nc-trend {
    fill: none;
    stroke: #0072B2;
    stroke-width: 2.5;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .nc-trend-end {
    fill: #0072B2;
  }
  .nc-trend-mark {
    fill: white;
    stroke: #0072B2;
    stroke-width: 2;
  }
  .nc-bar {
    fill: #0072B2;
    opacity: 0.7;
  }
  .nc-bar.selected {
    opacity: 1;
  }
  .nc-bar.faded {
    opacity: 0.35;
  }
}
</style>
