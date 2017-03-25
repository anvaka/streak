<template>
  <ui-textbox
      :label='vm.title'
      placeholder='Paste image url'
      v-model='vm.value'></ui-textbox>
</template>
<script>
import { UiTextbox } from 'keen-ui';

export default {
  name: 'Image',
  props: ['vm'],
  components: {
    UiTextbox
  }
};
</script>
