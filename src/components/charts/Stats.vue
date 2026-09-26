<template>
  <div class='summary secondary small'>
    <!-- The dates open the streak on the heatmap, in whichever year it happened. -->
    <div v-for='streak in streaks' :key='streak.name'>
      {{streak.name}}: <span>{{formatCount(streak.range)}}</span> <router-link v-if='streak.range.end' class='streak-range' :to='getStreakLink(streak.range)'>{{formatStreakRange(streak.range)}}</router-link>
    </div>
  </div>
</template>
<script>
import { formatDateOnly, getDateFromFilterString, getDateString } from 'src/lib/dateUtils.js';
import { getYearToShow } from 'src/lib/heatmapPeriod';

const ONE_DAY = 24 * 60 * 60 * 1000;
export default {
  name: 'Stats',
  props: ['project', 'settings'],
  data() {
    const dates = this.project.projectHistory.contributionsByDay;
    const streakStats = computeStreakStats(Object.keys(dates).map(getDateFromFilterString));
    return {
      streakStats
    };
  },

  computed: {
    streaks() {
      return [
        { name: 'Longest streak', range: this.streakStats.longestStreak },
        { name: 'Current streak', range: this.streakStats.currentStreak },
      ];
    },
  },

  methods: {
    getStreakLink(streakRange) {
      const start = streakRange.start || streakRange.end;
      const query = { from: getDateString(start) };
      if (streakRange.end > start) query.to = getDateString(streakRange.end);
      const year = getYearToShow(start);
      if (year) query.year = String(year);
      return { name: 'project-overview', params: { projectId: this.project.id }, query };
    },

    formatStreakRange(streakRange) {
      if (!streakRange || !streakRange.end) return '';
      if (!streakRange.start) {
        return '(Last contribution: ' + formatDateOnly(streakRange.end) + ')';
      }
      return '(' + formatDateOnly(streakRange.start) + ' - ' + formatDateOnly(streakRange.end) + ')';
    },

    formatCount(streakRange) {
      const { count } = streakRange;
      return count === 1 ? '1 day' : `${count} days`;
    },
  }
};

function computeStreakStats(dates) {
  dates.sort((y, x) => y - x);

  const longestStreak = {
    start: undefined,
    end: undefined,
    count: 0
  };

  const currentStreak = {
    start: undefined,
    end: undefined,
    count: 0
  };

  const stats = {
    longestStreak,
    currentStreak
  };

  if (!dates || dates.length === 0) return stats;

  computeLongestStreak();
  computeCurrentStreak();

  return stats;

  function computeCurrentStreak() {
    // Note: this code could be combined with computeLongestStreak (just remember the
    // last streak). Maybe I'll optimize it in future. For now, keeping it simple.
    const lastContributedDay = dates[dates.length - 1];
    currentStreak.end = lastContributedDay;
    const now = new Date();

    if (moreThanOneDay(now, lastContributedDay)) {
      return currentStreak;
    }
    // means we have contributed something today or yesterday.
    // Let's see if this is the same as our longest streak, so that we return without
    // computation
    if (lastContributedDay === longestStreak.end) {
      // Yup. Can short-circuit here
      currentStreak.end = longestStreak.end;
      currentStreak.start = longestStreak.start;
      currentStreak.count = longestStreak.count;
      return currentStreak;
    }
    // have to go backwards in dates until we find first gap
    let streakStart = currentStreak.end;
    let length = 1;
    for (let j = dates.length - 2; j >= 0; --j) {
      if (moreThanOneDay(dates[j], dates[j + 1])) {
        streakStart = dates[j + 1];
        break;
      }
      length += 1;
    }
    currentStreak.start = streakStart;
    currentStreak.count = length;
    return currentStreak;
  }

  function computeLongestStreak() {
    let currentStreakStart = dates[0];
    let currentStreakLength = 1;

    longestStreak.start = longestStreak.end = dates[0];

    for (let i = 1; i < dates.length; i++) {
      const date = dates[i];
      const prevDate = dates[i - 1];
      if (moreThanOneDay(date, prevDate)) {
        // streak is broken;
        updateLongestStreak(prevDate);

        currentStreakLength = 1;
        currentStreakStart = date;
      } else {
        currentStreakLength += 1;
      }
    }

    updateLongestStreak(dates[dates.length - 1]);

    function updateLongestStreak(streakEnd) {
      if (currentStreakLength > longestStreak.count) {
        longestStreak.count = currentStreakLength;
        longestStreak.start = currentStreakStart;
        longestStreak.end = streakEnd;
      }
    }
  }

  // Counted in calendar days, so the hour of `now` and daylight saving (a
  // 23- or 25-hour day) don't matter: yesterday is one day ago whatever the
  // time. This used to add a time zone offset to a Date, which made a string,
  // so any gap across a daylight saving change counted as no gap at all.
  function moreThanOneDay(day1, day2) {
    return Math.abs(calendarDay(day1) - calendarDay(day2)) > 1;
  }

  function calendarDay(date) {
    return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / ONE_DAY);
  }
}
</script>


<style lang='stylus'>
.summary .streak-range {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: rgba(0, 0, 0, 0.3);
}
</style>
