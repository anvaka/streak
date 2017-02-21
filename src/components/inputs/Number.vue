<template>
  <ui-textbox
      :label='vm.title'
      type='number'
      v-model='vm.value'></ui-textbox>
</template>
<script>
import { UiTextbox } from 'keen-ui';

export default {
  name: 'Number',
  props: ['vm'],
  components: {
    UiTextbox
  }
};
</script>
