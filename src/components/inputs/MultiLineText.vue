<template>
  <ui-textbox
      :label='vm.title'
      floating-label
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
