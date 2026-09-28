<template>
<div>
  <div class='contributions-wall' ref='wall'>
    <div class='dow-container' :style='{"width": layout.dowWidth + "px"}'>
      <!-- The year scrolled to, so the months are never without one. -->
      <div class='cw-corner-year' :style='{"line-height": layout.monthHeight + "px", "font-size": layout.fontSize + "px"}'>{{cornerYear}}</div>
      <div v-for='dow in daysOfTheWeek' :key='dow.name' :style='{"top": dow.y + "px", "line-height": layout.cell + "px", "font-size": layout.fontSize + "px"}' class='dow'>{{dow.name}}</div>
    </div>
    <div class='days-container' @scroll='onScroll'>
      <!-- The whole history is one wide svg, scrolled to the present. Only the
           weeks near the part on screen are drawn (see updateRange), so years
           of records - or a typo dating one to 1900 - stay cheap.
           Taps are resolved from coordinates on the whole svg (see dayAt) rather
           than per-rect listeners, so the gaps between squares count too and a
           slightly-off finger still lands on the nearest day. -->
      <svg :width='layout.width' :height='layout.height' ref='contributions'
           :class='{"has-range-filter": hasRangeFilter}'
           @click='onClick' @pointermove='onPointerMove' @pointerleave='hideTooltip'>
        <g v-for='week in wall.weeks' :key='week.index' :transform='getWeekTransform(week)'>
          <rect v-for='day in week.days' :key='day.dayNumber' :fill='day.fill' :width='layout.cell' :height='layout.cell' x='0' :y='day.dayNumber * layout.pitch'
            class='contribution-day' :class='{"is-selected": isSelected(day)}'></rect>
        </g>
        <!-- A new year is named instead of its January, and a line follows
             the edge between December 31 and January 1. -->
        <path v-for='boundary in wall.yearBoundaries' :key='boundary.year' :d='boundary.path' class='cw-year-boundary'></path>
        <text v-for='month in wall.months' :key='month.x' :x='month.x' :font-size='layout.fontSize' :y='layout.monthHeight - 6'
              :class='{"cw-year-label": month.isYear}'>{{month.name}}</text>
      </svg>
    </div>
  </div>
  <!-- Color alone never says which category a square is, so name them. A
       single category needs no key - the project title already names it. -->
  <ul v-if='palette.legend.length > 1' class='cw-legend' :style='{"padding-left": layout.dowWidth + "px"}'>
    <li v-for='entry in palette.legend' :key='entry.color'>
      <span class='cw-swatch' :style='{"background": entry.color}'></span><span class='cw-label'>{{entry.label}}</span>
    </li>
  </ul>
  <div v-if='tooltipText' class='cw-tooltip' :style='tooltipStyle'>{{tooltipText}}</div>
</div>
</template>

<script>
import { getDateString, formatDowDate, getDateFromFilterString } from 'src/lib/dateUtils.js';

import { assignCategoryColors, shade } from 'src/lib/color';
import { getPeriod, getColumn, getColumnStart } from 'src/lib/heatmapPeriod';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EMPTY_DAY_COLOR = 'rgb(235, 237, 240)';
// How far towards white the smallest day is drawn. Kept modest: shading says
// "less", but lighten a color far enough and it starts to pass for another
// category.
const MAX_LIGHTEN = 0.25;

// Squares are sized so a year of weeks fills the available width. `pitch` is
// the distance between neighbouring squares, of which GAP is empty space.
// MIN_PITCH keeps a square big enough to hit with a finger: a phone cannot fit
// a year at that size, so there the wall scrolls sideways, starting at the
// most recent week. MAX_PITCH stops squares ballooning on a wide monitor.
const GAP = 3;
const MIN_PITCH = 21;
const MAX_PITCH = 24;
// Squares are sized so the last twelve months fit: this week and 52 before.
// Anything older is further to the left.
const YEAR_COLUMNS = 53;
const MONTH_NAMES_HEIGHT = 22;
const DAY_NAMES_WIDTH = 30;
const FONT_SIZE = 11;
// Room after the last column so its month label is not clipped.
const TRAILING_SPACE = 10;

export default {
  name: 'ContributionsWall',
  props: ['dates', 'categories', 'settings'],
  data() {
    return {
      tooltipText: '',
      tooltipStyle: {},
      // Measured on mount and on every resize; until then assume a phone.
      availableWidth: 0,
      // Weeks drawn, by column. Moves in steps of RANGE_STEP columns as the
      // wall scrolls, so scrolling redraws only now and then.
      range: null,
      cornerYear: null,
    };
  },
  computed: {
    layout() {
      const fitted = Math.floor((this.availableWidth - DAY_NAMES_WIDTH - TRAILING_SPACE) / YEAR_COLUMNS);
      const pitch = Math.min(MAX_PITCH, Math.max(MIN_PITCH, fitted));
      return {
        pitch,
        cell: pitch - GAP,
        monthHeight: MONTH_NAMES_HEIGHT,
        fontSize: FONT_SIZE,
        dowWidth: DAY_NAMES_WIDTH,
        width: this.period.columns * pitch + TRAILING_SPACE,
        height: MONTH_NAMES_HEIGHT + 7 * pitch,
      };
    },
    daysOfTheWeek() {
      const { monthHeight, pitch } = this.layout;
      return [1, 3, 5].map(dayIndex => ({
        name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex],
        y: dayIndex * pitch + monthHeight
      }));
    },
    palette() {
      return assignCategoryColors(this.categories || []);
    },
    earliest() {
      let earliest;
      Object.keys(this.dates || {}).forEach(dayKey => {
        const day = getDateFromFilterString(dayKey);
        if (!Number.isNaN(day.getTime()) && !(earliest <= day)) earliest = day;
      });
      return earliest;
    },
    period() {
      return getPeriod(this.earliest);
    },
    wall() {
      const range = this.range || getRange(this.period.columns, null, 0, this.layout.pitch);
      return buildWall(this.period, range, this.dates, this.layout, this.palette);
    },
    hasRangeFilter() {
      return this.$route.query.from;
    },
    selection() {
      const { from, to } = this.$route.query;
      if (!from) return null;
      const start = getDateFromFilterString(from).getTime();
      const end = to ? getDateFromFilterString(to).getTime() : start;
      return { min: Math.min(start, end), max: Math.max(start, end) };
    },
    showStreakStats() {
      return this.settings && this.settings.showStreakStats;
    }
  },
  mounted() {
    this.measure();
    this.onScroll();
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(() => this.measure());
      this.resizeObserver.observe(this.$refs.wall);
    }
  },

  beforeUnmount() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
  },
  methods: {
    measure() {
      const width = this.$refs.wall.clientWidth;
      if (width === this.availableWidth) return;
      this.availableWidth = width;
      // A resize (rotating the phone, say) moves the squares around.
      this.$nextTick(() => this.scrollToFocus());
    },
    /**
     * Only part of the wall fits (on a phone, or once there is more than a
     * year of records). Bring the filtered days into view, so tapping a day
     * in March, or a streak years back, does not scroll it away; with no
     * filter show the latest weeks, which are the ones people tap.
     */
    scrollToFocus() {
      const svg = this.$refs.contributions;
      if (!svg) return;
      const container = svg.parentElement;
      const column = this.selection && getColumn(this.period, new Date(this.selection.min));
      if (this.selection && column >= 0 && column < this.period.columns) {
        const { pitch, cell } = this.layout;
        container.scrollLeft = column * pitch + cell / 2 - container.clientWidth / 2;
      } else {
        container.scrollLeft = container.scrollWidth;
      }
      this.onScroll();
    },
    onScroll() {
      const svg = this.$refs.contributions;
      if (!svg) return;
      const { scrollLeft, clientWidth } = svg.parentElement;
      const { pitch } = this.layout;
      const range = getRange(this.period.columns, scrollLeft, clientWidth, pitch);
      if (!this.range || range.first !== this.range.first || range.last !== this.range.last) {
        this.range = range;
      }
      const leftColumn = Math.min(this.period.columns - 1, Math.floor(scrollLeft / pitch));
      const year = getColumnStart(this.period, Math.max(0, leftColumn)).getFullYear();
      if (year !== this.cornerYear) this.cornerYear = year;
    },
    onClick(e) {
      const day = this.dayAt(e);
      if (!day) return;
      let from = day.dayKey;
      let to = from;
      if (e.shiftKey) {
        to = from;
        from = this.$route.query.from || from;
        e.preventDefault();
      }
      this.hideTooltip();
      this.$emit('filter', from, to);
    },
    onPointerMove(e) {
      // A tap also produces pointer events, and a tooltip opened by one would
      // have no pointerleave to close it. On touch the selection outline and
      // the date under the chart say which day was picked instead.
      if (e.pointerType !== 'mouse') return;
      const day = this.dayAt(e);
      if (!day) {
        this.hideTooltip();
        return;
      }
      const svgRect = this.$refs.contributions.getBoundingClientRect();
      const { cell, pitch, monthHeight } = this.layout;
      this.tooltipText = this.palette.legend.length > 1 && day.hasRecords ?
        `${day.tooltip} · ${day.category === null ? 'No value' : day.category}` :
        day.tooltip;
      this.tooltipStyle = {
        left: svgRect.left + day.weekIndex * pitch + cell / 2 + 'px',
        top: svgRect.top + monthHeight + day.dayNumber * pitch - 4 + 'px',
      };
    },
    hideTooltip() {
      this.tooltipText = '';
    },
    /**
     * The day closest to the pointer, or undefined when the pointer is clearly
     * off the grid (in the month labels, past the current week, or on a day
     * that has not happened yet). Snapping to the nearest square centre means
     * the gaps between squares belong to a day instead of swallowing the tap.
     */
    dayAt(e) {
      const svgRect = this.$refs.contributions.getBoundingClientRect();
      const { cell, pitch, monthHeight } = this.layout;
      const x = e.clientX - svgRect.left;
      const y = e.clientY - svgRect.top - monthHeight;
      const weekIndex = Math.round((x - cell / 2) / pitch);
      const dayNumber = Math.round((y - cell / 2) / pitch);
      if (weekIndex < 0 || weekIndex >= this.period.columns) return;
      if (dayNumber < 0 || dayNumber > 6) return;

      const week = this.wall.weeks.find(w => w.index === weekIndex);
      return week && week.days.find(d => d.dayNumber === dayNumber);
    },
    isSelected(day) {
      const s = this.selection;
      return !!s && day.time >= s.min && day.time <= s.max;
    },
    getWeekTransform(week) {
      const xOffset = week.index * this.layout.pitch;
      return `translate(${xOffset}, ${this.layout.monthHeight})`;
    },
  }
};

// Columns are drawn a step at a time: everything on screen, plus at least
// RANGE_STEP columns either side so a fling does not outrun the drawing.
// Unmeasured (before mount, or without layout in tests) draw the last
// RANGE_STEP * 3 columns, which is where the wall opens.
const RANGE_STEP = 26;

function getRange(columns, scrollLeft, clientWidth, pitch) {
  if (scrollLeft === null || !clientWidth) {
    return { first: Math.max(0, columns - RANGE_STEP * 3), last: columns - 1 };
  }
  const firstVisible = Math.floor(scrollLeft / pitch);
  const lastVisible = Math.ceil((scrollLeft + clientWidth) / pitch);
  return {
    first: Math.max(0, (Math.floor(firstVisible / RANGE_STEP) - 1) * RANGE_STEP),
    last: Math.min(columns - 1, (Math.ceil(lastVisible / RANGE_STEP) + 1) * RANGE_STEP),
  };
}

function buildWall(period, range, dates, layout, palette) {
  const last = period.lastDay.getTime();
  const weeks = [];
  for (let i = range.first; i <= range.last; ++i) {
    const days = buildWeekDays(getColumnStart(period, i), dates, i, palette)
      .filter(day => day.time <= last);
    weeks.push({ index: i, days });
  }

  const inRange = column => column >= range.first && column <= range.last;
  return {
    weeks,
    months: getMonths(period, layout.pitch).filter(month => inRange(month.column)),
    yearBoundaries: getYearBoundaries(period, layout).filter(b => inRange(b.column)),
  };
}

// Each month is named above the week holding its 1st, and January by its
// year. A month whose 1st is not on the wall (the partial month a year back)
// goes unnamed.
function getMonths(period, pitch) {
  const months = [];
  const month = new Date(period.start.getFullYear(), period.start.getMonth(), 1);
  if (month < period.start) month.setMonth(month.getMonth() + 1);
  while (month <= period.lastDay) {
    const column = getColumn(period, month);
    const isYear = month.getMonth() === 0;
    months.push({
      name: isYear ? String(month.getFullYear()) : MONTH_NAMES[month.getMonth()],
      isYear,
      column,
      x: column * pitch
    });
    month.setMonth(month.getMonth() + 1);
  }
  return months;
}

// January 1 usually falls mid-week, so the edge between the years is a step:
// down the gap after the column's December days, across, then down the gap
// before its January days.
function getYearBoundaries(period, { pitch, cell, monthHeight }) {
  const half = (pitch - cell) / 2;
  const top = monthHeight - half;
  const bottom = monthHeight + 7 * pitch - half;
  const boundaries = [];
  for (let year = period.start.getFullYear() + 1; year <= period.lastDay.getFullYear(); ++year) {
    const newYear = new Date(year, 0, 1);
    if (newYear <= period.start) continue;
    const column = getColumn(period, newYear);
    const row = newYear.getDay();
    const left = column * pitch - half;
    const path = row === 0 ?
      `M${left},${top}V${bottom}` :
      `M${left + pitch},${top}V${monthHeight + row * pitch - half}H${left}V${bottom}`;
    boundaries.push({ year, column, path });
  }
  return boundaries;
}

function buildWeekDays(sunday, dates, weekIndex, palette) {
  const weekDays = [];
  for (let i = 0; i < 7; ++i) {
    const day = new Date(sunday);
    day.setDate(day.getDate() + i);
    const dayKey = getDateString(day);
    const contributions = dates && dates[dayKey];

    weekDays.push({
      day,
      dayKey,
      // Midnight, so it compares cleanly against the filter's from/to dates.
      time: new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime(),
      weekIndex,
      tooltip: formatDowDate(day),
      dayNumber: i,
      hasRecords: !!contributions,
      category: contributions ? contributions.groupKey : null,
      fill: getFill(contributions, palette)
    });
  }

  return weekDays;
}

function getFill(contributions, palette) {
  if (!contributions) return EMPTY_DAY_COLOR;

  const color = palette.colorOf(contributions.groupKey);
  return shade(color, MAX_LIGHTEN * (1 - contributions.scaledValue));
}

</script>

<style lang='stylus'>
.contributions-wall {
  user-select: none;
  display: flex;
  .dow-container {
    position: relative;
    width: 25px;
    background: white;
    .dow {
      font-size: 9px;
      position: absolute;
    }
  }
  .days-container {
    overflow-x: auto;
    flex: 1;
  }
  svg {
    cursor: pointer;
    // No 300ms double-tap-to-zoom wait before a tap registers.
    touch-action: pan-x pan-y;
  }
  .has-range-filter .contribution-day:not(.is-selected) {
    opacity: 0.35;
  }
  .contribution-day.is-selected {
    stroke: rgba(0, 0, 0, 0.7);
    stroke-width: 1.5;
  }
  .cw-corner-year {
    position: absolute;
    top: 0;
    font-weight: 600;
  }
  .cw-year-label {
    font-weight: 600;
  }
  .cw-year-boundary {
    fill: none;
    stroke: rgba(0, 0, 0, 0.6);
    stroke-width: 1.5;
    pointer-events: none;
  }
}

.cw-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  list-style: none;
  margin: 6px 0 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.64);
  li {
    display: flex;
    align-items: center;
    max-width: 100%;
  }
  .cw-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cw-swatch {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    margin-right: 5px;
  }
}

.cw-tooltip {
  position: fixed;
  transform: translate(-50%, -100%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;
}
</style>
