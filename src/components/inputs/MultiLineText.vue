<template>
  <ui-textbox
      class='multi-line-goal'
      :label='vm.title'
      floating-label
      :rows='1'
      :multi-line='true'
      v-model='vm.value'></ui-textbox>
</template>
<script>
import { UiTextbox } from 'keen-ui';

export default {
  name: 'MultiLineText',
  props: ['vm'],
  components: {
    UiTextbox
  }
};
</script>
<style>
.multi-line-goal.ui-textbox.has-floating-label .ui-textbox__label-text.is-inline {
  transform: translateY(1.3rem) scale(1.1);
}
</style>
