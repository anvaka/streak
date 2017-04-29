<template>
  <div class='loading' v-if='isLoading'>
      <ui-icon-button icon="refresh" :loading="isLoading" type='secondary'></ui-icon-button>
      <slot>Loading...</slot>
  </div>
</template>

<script>
import { UiIconButton } from 'keen-ui';

export default {
  name: 'Loading',
  props: ['isLoading'],
  components: {
    UiIconButton
  }
};
</script>
