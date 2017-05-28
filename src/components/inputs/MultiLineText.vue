<template>
    <multi-complete
      class='multi-line-goal'
      :label='vm.title'
      floating-label
      :rows='1'
      :suggestions='suggestions'
      v-model='vm.value'
      ></multi-complete>
</template>
<script>
import MultiComplete from '../multi-complete/MultiComplete.vue';
import InputTypes from '../../types/InputTypes';

export default {
  name: 'MultiLineText',
  props: ['vm'],
  components: {
    MultiComplete
  },
  computed: {
    suggestions() {
      // Show suggestions only if there are no multiline text.
      return this.vm.hasMultiline ? [] : this.vm.autocomplete;
    }
  }
};
</script>
<style>
.multi-line-goal.ui-textbox.has-floating-label .ui-textbox__label-text.is-inline {
  transform: translateY(1.3rem) scale(1.1);
}
</style>
