<template>
  <div class='contributions-wall'>
    <svg width='676' height='104' ref='contributions' :class='{"has-range-filter": hasRangeFilter}'>
      <g v-for='week in wall.weeks' :transform='getWeekTransform(week)'>
        <rect v-for='day in week.days' :fill='day.fill' width='10' height='10' x='0' :y='getDayYPosition(day)'
              :title='day.day' class='contribution-day' :data-day='day.tooltip'
              :class='{"inside-range": isDayInsideRange(day)}'
              @click='onDayClick($event, day)'></rect>
      </g>
      <text v-for='dow in daysOfTheWeek' x='0' font-size='9'  :y='dow.y'>{{dow.name}}</text>
      <text v-for='month in wall.months' :x='month.x' font-size='9' y='12'>{{month.name}}</text>
    </svg>
  </div>
</template>

<script>
import moment from 'moment';
import { getDateString, isDayInside } from 'src/lib/dateUtils.js';
import { rgbToHsl, hslToRgb } from 'src/lib/color';
import Tooltip from 'tether-tooltip';

const DAY_HEIGHT = 12;
const DAY_WIDTH = 13;
const DAY_OF_THE_WEEK_LENGTH = 25;
const MONTH_NAMES_HEIGHT = 18;
const MAX_WEEKS_TO_SHOW = 45;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default {
  name: 'ContributionsWall',
  props: ['project'],
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
      }],
      months: [{
        x: 20,
        name: 'Jan'
      }]
    };
  },
  computed: {
    wall() {
      return buildWall(this.project);
    },
    hasRangeFilter() {
      return this.$route.query.from;
    }
  },
  mounted() {
    const svg = this.$refs.contributions;
    this.mouseEnterHandler = this.mouseEnter.bind(this);
    svg.addEventListener('mouseenter', this.mouseEnterHandler, true);
  },

  beforeDestroy() {
    const svg = this.$refs.contributions;
    svg.removeEventListener('mouseenter', this.mouseEnterHandler, true);
    if (this.tooltip) {
      this.tooltip.destroy();
    }
  },
  methods: {
    isDayInsideRange(day) {
      const min = this.$route.query.from;
      const max = this.$route.query.to;
      return isDayInside(day.day, min, max);
    },

    onDayClick(e, day) {
      let from = getDateString(day.day);
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

function buildWall(project) {
  const weeks = [];
  const today = new Date();
  const sunday = getSunday(today);

  const thisWeek = buildWeekDays(sunday, project).filter(removeFutureDays);

  weeks.push({
    index: MAX_WEEKS_TO_SHOW,
    days: thisWeek
  });

  for (let i = MAX_WEEKS_TO_SHOW - 1; i > -1; --i) {
    sunday.setDate(sunday.getDate() - 7);

    weeks.push({
      index: i,
      days: buildWeekDays(sunday, project)
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
    })).filter(month => month.x > DAY_OF_THE_WEEK_LENGTH);
  }
}


function getSunday(day) {
  const sunday = new Date(day);
  sunday.setDate(day.getDate() - day.getDay());
  return sunday;
}

function buildWeekDays(sunday, project) {
  const weekDays = [];
  for (let i = 0; i < 7; ++i) {
    const day = new Date(sunday);
    day.setDate(day.getDate() + i);

    weekDays.push({
      day,
      tooltip: moment(day).format('LL'),
      dayNumber: i,
      fill: getFillForDate(day, project)
    });
  }

  return weekDays;
}

function getFillForDate(day, project) {
  if (!project || !project.projectHistory) {
    return '#eee';
  }
  const dayKey = getDateString(day);
  const contributions = project.projectHistory.contributionsByDay[dayKey];
  if (contributions) {
    const hsl = rgbToHsl(0xff, 0x00, 0xd0);
    // l = 50 -> most number of contributions
    // l = 85 -> min number of contributions
    // range: 0..35
    const rgb = hslToRgb(hsl[0], hsl[1], hsl[2] + 0.35 * (1 - contributions.scaledValue))
      .map(toHex).join('');

    return `#${rgb}`;
  }

  return 'rgb(235, 237, 240)';
}

function toHex(x) {
  const value = x.toString(16);
  return value.length !== 2 ? `0${value}` : value;
}

function getDayOfTheYOffset(dayIndex) {
  const FONT_SIZE = 9;
  return dayIndex * DAY_HEIGHT + DAY_HEIGHT - FONT_SIZE / 2 + MONTH_NAMES_HEIGHT;
}
</script>

<style lang='stylus'>
svg.has-range-filter rect {
  opacity: 0.5;
}

svg.has-range-filter rect.inside-range {
  opacity: 1;
}
</style>
