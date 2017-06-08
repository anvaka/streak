<template>
  <div class='summary secondary small'>
    <div>Longest streak: <span>{{formatCount(streakStats.longestStreak)}}</span> <span>{{formatStreakRange(streakStats.longestStreak)}}</span></div>
    <div>Current streak: <span>{{formatCount(streakStats.currentStreak)}}</span> <span>{{formatStreakRange(streakStats.currentStreak)}}</span></div>
  </div>
</template>
<script>
import { formatDateOnly, getDateFromFilterString } from 'src/lib/dateUtils.js';

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

  methods: {
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

  function moreThanOneDay(day1, day2) {
    return Math.abs(day1 - day2) > ONE_DAY;
  }
}
</script>

