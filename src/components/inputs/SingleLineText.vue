<template>
  <ui-autocomplete
      floating-label
      :min-chars='1'
      :label='vm.title'
      :suggestions='vm.autocomplete'
      v-model='vm.value'></ui-autocomplete>
</template>
<script>
import { UiAutocomplete } from 'keen-ui';

export default {
  name: 'SingleLineText',
  props: ['vm'],
  components: {
    UiAutocomplete
  }
};
</script>

<style>
.ui-autocomplete__suggestions {
  position: fixed;
  width: 600px;
  min-width: initial;
}
</style>
