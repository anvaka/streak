<template>
  <ui-textbox
      :label='vm.title'
      floating-label
      type='number'
      v-model='vm.value'></ui-textbox>
</template>
<script>
import UiTextbox from 'keen-ui/src/UiTextbox';

export default {
  name: 'Number',
  props: ['vm'],
  components: {
    UiTextbox
  }
};
</script>
