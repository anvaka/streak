<template>
  <div v-if='hasFilters' class='filter-message'>
   {{filterMessage}}
    <router-link class='action' :to='{name: $route.name, params: {projectId}, query: keepFocus({}, $route.query)}'>reset</router-link>
  </div>
</template>

<script>
import { getDateFromFilterString, formatDateOnly } from 'src/lib/dateUtils';
import { keepFocus } from 'src/lib/facet.js';

export default {
  props: ['from', 'to', 'projectId'],
  methods: {
    keepFocus,
  },
  computed: {
    hasFilters() {
      return this.from || this.to;
    },
    filterMessage() {
      const fromDate = getDateFromFilterString(this.from);
      if (!this.to || this.from === this.to) {
        return formatDateOnly(fromDate);
      }

      const toDate = getDateFromFilterString(this.to);
      let fromFormatted = formatDateOnly(fromDate);
      let toFormatted = formatDateOnly(toDate);
      if (fromDate > toDate) {
        [fromFormatted, toFormatted] = [toFormatted, fromFormatted];
      }
      // TODO: This is duplicated.
      return `${fromFormatted} - ${toFormatted}`;
    }
  }
};

</script>

<style lang='stylus'>
.filter-message {
  font-size: 1.5em;
  margin-top: 7px;
  a {
    font-size: 14px;
  }
}
</style>
