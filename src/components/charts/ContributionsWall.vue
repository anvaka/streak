<template>
<div>
  <div class='contributions-wall'>
    <div class='dow-container'>
      <div v-for='dow in daysOfTheWeek' :style='{"top": dow.y + "px"}' class='dow'>{{dow.name}}</div>
    </div>
    <div class='days-container'>
      <svg width='676' height='104' ref='contributions' :class='{"has-range-filter": hasRangeFilter}'>
        <g v-for='week in wall.weeks' :transform='getWeekTransform(week)'>
          <rect v-for='day in week.days' :fill='day.fill' width='10' height='10' x='0' :y='getDayYPosition(day)' :title='day.day' class='contribution-day' :data-day='day.tooltip' @click='onDayClick($event, day)'></rect>
        </g>
        <text v-for='month in wall.months' :x='month.x' font-size='9' y='12'>{{month.name}}</text>
      </svg>
    </div>
  </div>
</div>
</template>

<script>
import { getDateString, formatDowDate } from 'src/lib/dateUtils.js';

import { makeColorBag } from 'src/lib/color';
import Tooltip from 'tether-tooltip';

const DAY_HEIGHT = 12;
const DAY_WIDTH = 12;
const DAY_OF_THE_WEEK_LENGTH = 0;
const MONTH_NAMES_HEIGHT = 18;
const MAX_WEEKS_TO_SHOW = 52;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const colorBag = makeColorBag();

export default {
  name: 'ContributionsWall',
  props: ['dates', 'settings'],
  data() {
    return {
      daysOfTheWeek: [{
        name: 'Mon',
        y: getDayOfTheYOffset(1)
      }, {
        name: 'Wed',
        y: getDayOfTheYOffset(3)
      }, {
        name: 'Fri',
        y: getDayOfTheYOffset(5)
      }]
    };
  },
  computed: {
    wall() {
      return buildWall(this.dates);
    },
    hasRangeFilter() {
      return this.$route.query.from;
    },
    showStreakStats() {
      return this.settings && this.settings.showStreakStats;
    }
  },
  mounted() {
    const svg = this.$refs.contributions;
    this.mouseEnterHandler = this.mouseEnter.bind(this);
    svg.addEventListener('mouseenter', this.mouseEnterHandler, true);
    scrollToTheEnd(svg);
  },

  beforeDestroy() {
    const svg = this.$refs.contributions;
    svg.removeEventListener('mouseenter', this.mouseEnterHandler, true);
    if (this.tooltip) {
      this.tooltip.destroy();
    }
  },
  methods: {
    onDayClick(e, day) {
      let from = day.dayKey;
      let to = from;
      if (e.shiftKey) {
        to = from;
        from = this.$route.query.from || from;
        e.preventDefault();
      }
      this.$emit('filter', from, to);
    },
    getWeekTransform(week) {
      const xOffset = week.index * DAY_WIDTH + DAY_OF_THE_WEEK_LENGTH;
      return `translate(${xOffset}, ${MONTH_NAMES_HEIGHT})`;
    },
    getDayYPosition(day) {
      const y = day.dayNumber * DAY_HEIGHT;
      return y;
    },
    mouseEnter(e) {
      const dayDom = e.target;
      if (!dayDom.classList.contains('contribution-day')) {
        return;
      }
      if (this.tooltip) {
        this.tooltip.destroy();
      }
      this.tooltip = new Tooltip({
        target: dayDom,
        content: dayDom.getAttribute('data-day'),
        classes: 'ui-tooltip--theme-default',
      });
      this.tooltip.open();
    }
  }
};

function scrollToTheEnd(svg) {
  // always scroll to the very end.
  svg.parentElement.scrollLeft = 600;
}

/**
 * For a given set of dates builds a new "Contributions Wall" view model
 *
 * @param {Object} dates - set, where key is a date, and the value is
 * an object, that represents records for the date.
 */
function buildWall(dates) {
  const weeks = [];
  const today = new Date();
  const sunday = getSunday(today);

  const thisWeek = buildWeekDays(sunday, dates).filter(removeFutureDays);

  weeks.push({
    index: MAX_WEEKS_TO_SHOW,
    days: thisWeek
  });

  for (let i = MAX_WEEKS_TO_SHOW - 1; i > -1; --i) {
    sunday.setDate(sunday.getDate() - 7);
    const days = buildWeekDays(sunday, dates);

    weeks.push({
      index: i,
      days
    });
  }

  const months = getMonths(weeks);

  return {
    weeks,
    months
  };

  function removeFutureDays(day) {
    return today >= day.day;
  }

  function getMonths(weeks) {
    let lastMonth = -1;
    const months = [];

    weeks.forEach(week => {
      const firstDayMonth = week.days[0].day.getMonth();
      if (firstDayMonth !== lastMonth) {
        lastMonth = firstDayMonth;
        months.push({
          name: MONTH_NAMES[lastMonth],
          weekIndex: week.index
        });
      }
    });

    return months.map(month => ({
      name: month.name,
      x: (month.weekIndex - 0.5) * DAY_WIDTH
    })).filter((month, index, array) => {
      if (month.x <= DAY_OF_THE_WEEK_LENGTH) return false;
      if (index < array.length - 1) {
        return month.x - array[index + 1].x > 30;
      }
      return true;
    });
  }
}

function getSunday(day) {
  const sunday = new Date(day);
  sunday.setDate(day.getDate() - day.getDay());
  return sunday;
}

function buildWeekDays(sunday, dates) {
  const weekDays = [];
  for (let i = 0; i < 7; ++i) {
    const day = new Date(sunday);
    day.setDate(day.getDate() + i);
    const dayKey = getDateString(day);

    weekDays.push({
      day,
      dayKey,
      tooltip: formatDowDate(day),
      dayNumber: i,
      fill: getFillForDate(dayKey, dates)
    });
  }

  return weekDays;
}

function getFillForDate(dayKey, contributionsByDay) {
  const contributions = contributionsByDay && contributionsByDay[dayKey];

  if (!contributions) {
    return 'rgb(235, 237, 240)';
  }

  // todo: the color should come from the settings
  // const hsl = colorBag.getColor('defaultColor');
  const hsl = colorBag.getColor(contributions.groupKey);

  const h = Math.round(hsl[0] * 360);
  const s = Math.round(hsl[1] * 100);
  const l = Math.round((hsl[2] + 0.25 * (1 - contributions.scaledValue)) * 100);

  return `hsl(${h}, ${s}%, ${l}%)`;
}


function getDayOfTheYOffset(dayIndex) {
  return dayIndex * DAY_HEIGHT + MONTH_NAMES_HEIGHT;
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
}
</style>
