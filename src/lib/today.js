/**
 * The current time, for computeds that depend on what day it is. Reading it
 * makes a computed recompute when the day changes, so a page left open past
 * midnight - or a phone tab woken the next morning - doesn't stay on yesterday.
 */
import { ref } from 'vue';

const dayChanges = ref(0);
let lastDay = null;
let timer = null;

export default function now() {
  // Only read, so the computed calling this depends on it.
  dayChanges.value; // eslint-disable-line no-unused-expressions
  const date = new Date();
  if (lastDay === null && typeof window !== 'undefined') watchForNextDay(date);
  return date;
}

function watchForNextDay(date) {
  lastDay = date.toDateString();
  scheduleMidnight();
  document.addEventListener('visibilitychange', checkDay);
}

function scheduleMidnight() {
  const current = new Date();
  const midnight = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 1);
  clearTimeout(timer);
  // Timers pause while a phone sleeps; the visibility check covers that.
  timer = setTimeout(checkDay, midnight - current);
}

function checkDay() {
  const day = new Date().toDateString();
  if (day !== lastDay) {
    lastDay = day;
    dayChanges.value += 1;
  }
  scheduleMidnight();
}
