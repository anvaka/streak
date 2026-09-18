<template>
  <div class='form-field'>
    <label>{{vm.title}}</label>
    <input type='text' placeholder='Paste image url' v-model='vm.value'>
  </div>
</template>
<script>
export default {
  name: 'Image',
  props: ['vm'],
};
</script>
