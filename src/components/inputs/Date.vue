<template>
  <div class='date-container'>
    <input ref='date' type='datetime-local' v-model='vm.value' data-input>
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
      text-decoration: none;
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
