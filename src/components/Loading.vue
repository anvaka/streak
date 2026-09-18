<template>
  <div class='loading loading-spinner' v-if='isLoading'>
      <span class='spinner'></span>
      <slot>Loading...</slot>
  </div>
</template>

<script>
export default {
  name: 'Loading',
  props: ['isLoading'],
};
</script>
