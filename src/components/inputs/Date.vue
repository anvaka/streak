<template>
  <div>
    <label>{{vm.title}} <a href='#' @click.prevent='setNow()'>set to now</a></label>
    <input ref='date' type='datetime-local' v-model='vm.value' data-input>
  </div>
</template>
<script>

import Flatpickr from 'flatpickr';
import { getNow, toDateInputStr } from 'src/lib/dateUtils';

export default {
  props: ['vm'],
  mounted() {
    const self = this;
    const initialValue = new Date();

    this.vm.value = toDateInputStr(initialValue);

    const pickerConfig = {
      allowInput: true,
      enableTime: true,
      time_24hr: true,
      enableSeconds: true,
      defaultDate: initialValue,
      dateFormat: 'm/d/Y H:i:S',
      utc: false,
      onChange() {
        self.changeFromFlatPickr = true;
      },
    };
    this.flatPickr = new Flatpickr(this.$refs.date, pickerConfig);
  },

  beforeDestroy() {
    this.flatPickr.destroy();
  },

  methods: {
    setNow() {
      this.vm.value = getNow();
    },
  },
  watch: {
    'vm.value': function vmValueChanged(newValue) {
      if (this.changeFromFlatPickr) {
        this.changeFromFlatPickr = false;
      } else {
        // This means, that underlying value was changed outside, so
        // we need to update our flatPickr instance value:
        this.flatPickr.setDate(newValue);
      }
    },
  },
};
</script>
