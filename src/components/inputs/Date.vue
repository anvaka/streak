<template>
  <div class='date-container'>
    <!-- step='any' is load-bearing on mobile. flatpickr hides this input there
         and builds its own native <input type='datetime-local'>, whose value it
         formats as Y-m-dTH:i:S - with seconds, because enableSeconds is on. A
         datetime-local input defaults to step=60, so any non-zero seconds are a
         stepMismatch. AddRecord.vue wraps these in a <form> with a submit button
         and native validation runs BEFORE the submit event, so an invalid field
         means 'Save record' silently does nothing. flatpickr 2 set step="any" on
         that mobile input unconditionally; flatpickr 4 only copies it from here
         (see setupMobile: `if (self.input.getAttribute("step"))`), so the v2->v4
         bump in the Vite migration dropped it. Desktop ignores this - flatpickr
         retypes this input to text. -->
    <input ref='date' type='datetime-local' step='any' v-model='vm.value' data-input>
    <label class='secondary'>{{vm.title}} <a href='#' @click.prevent='setNow()'>set to now</a></label>
  </div>
</template>
<script>

import Flatpickr from 'flatpickr';
import { getNow, toDateInputStr } from 'src/lib/dateUtils';

export default {
  name: 'Date',
  props: ['vm'],
  mounted() {
    const self = this;
    const initialValue = this.vm.value ? new Date(this.vm.value) : new Date();

    this.vm.value = toDateInputStr(initialValue);

    const pickerConfig = {
      allowInput: true,
      enableTime: true,
      time_24hr: true,
      enableSeconds: true,
      defaultDate: initialValue,
      dateFormat: 'm/d/Y H:i:S',
      onChange() {
        self.changeFromFlatPickr = true;
      },
    };
    this.flatPickr = new Flatpickr(this.$refs.date, pickerConfig);
  },

  beforeUnmount() {
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
<style lang='stylus'>
focus-color=#2196f3;

.date-container {
  display: flex;
  font-size: 15px;
  flex-direction: column-reverse;
  margin-bottom: 1rem;

  label {
    font-family: Roboto,-apple-system,BlinkMacSystemFont,Segoe UI,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica,Arial,sans-serif;
    a {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }
  }

  input.active + label {
    a {
      color: focus-color;
    }
  }

  input {
    height: 2rem;
    border: none;
    border-bottom: 1px solid rgba(0,0,0,.12);
    font-size: 1rem;
    border-radius: 0;
    padding-left: 0;
    -webkit-appearance: initial;
    &:hover {
      border-bottom: 1px solid rgba(0,0,0,.54);
    }
    &:focus {
      outline: none;
      border-bottom-color: focus-color;
      border-bottom-width: 2px;
    }
  }
}
</style>
