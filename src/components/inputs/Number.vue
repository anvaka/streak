<template>
  <div class='form-field'>
    <label>{{vm.title}}</label>
    <input type='number' v-model='vm.value'>
  </div>
</template>
<script>
export default {
  name: 'Number',
  props: ['vm'],
};
</script>
