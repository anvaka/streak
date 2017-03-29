<template>
  <ui-autocomplete
      floating-label
      :min-chars='1'
      :label='vm.title'
      :suggestions='vm.autocomplete'
      :filter='filterSuggestions'
      v-model='vm.value'></ui-autocomplete>
</template>
<script>
import { UiAutocomplete } from 'keen-ui';

export default {
  name: 'SingleLineText',
  props: ['vm'],
  components: {
    UiAutocomplete
  },
  methods: {
    filterSuggestions(suggestion, query) {
      if (!query) return true;

      return suggestion.toLowerCase().indexOf(query.toLowerCase()) > -1;
    }
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
