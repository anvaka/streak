<template>
  <ui-textbox
      floating-label
      :label='vm.title'
      v-model='vm.value'></ui-textbox>
</template>
<script>
import { UiTextbox } from 'keen-ui';

export default {
  name: 'SingleLineText',
  props: ['vm'],
  components: {
    UiTextbox
  }
};
</script>
