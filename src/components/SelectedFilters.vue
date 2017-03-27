<template>
  <div v-if='hasFilters' class='filter-message'>
   {{filterMessage}}
    <router-link class='action' :to='{name: "project-details", params: {projectId}}'>reset</router-link>
  </div>
</template>

<script>
import moment from 'moment';
import { getDateFromFilterString } from 'src/lib/dateUtils';

export default {
  props: ['from', 'to', 'projectId'],
  computed: {
    hasFilters() {
      return this.from || this.to;
    },
    filterMessage() {
      const fromDate = getDateFromFilterString(this.from);
      if (!this.to || this.from === this.to) {
        return moment(fromDate).format('LL');
      }

      const toDate = getDateFromFilterString(this.to);
      let fromFormatted = moment(fromDate).format('LL');
      let toFormatted = moment(toDate).format('LL');
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
