<template>
  <div v-if='hasFilters' class='filter-message'>
   {{filterMessage}}
    <router-link class='action' :to='{name: "project-details", params: {projectId}}'>reset</router-link>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  props: ['from', 'to', 'projectId'],
  computed: {
    hasFilters() {
      return this.from || this.to;
    },
    filterMessage() {
      if (!this.to || this.from === this.to) {
        return moment(new Date(this.from)).format('LL');
      }

      const fromDate = new Date(this.from);
      const toDate = new Date(this.to);
      let fromFormatted = moment(fromDate).format('LL');
      let toFormatted = moment(toDate).format('LL');
      if (fromDate > toDate) {
        [fromFormatted, toFormatted] = [toFormatted, fromFormatted];
      }
      // TODO: This is duplicated.
      return `between ${fromFormatted} and ${toFormatted}`;
    }
  }
};
</script>

<style lang='stylus'>
.filter-message {
  font-size: 1.5em;
}
</style>
