<template>
  <div class='form-field'>
    <label>{{vm.title}}</label>
    <!-- step='any' is required, not cosmetic: without it the input defaults to
         step=1, so any decimal is a stepMismatch. AddRecord.vue wraps these in
         a <form> with a submit button, and native validation runs BEFORE the
         submit event - so an invalid field means 'Save record' silently does
         nothing. The keen-ui textbox this replaced was not a bare number input
         and never hit that. -->
    <input type='number' step='any' v-model='vm.value'>
  </div>
</template>
<script>
export default {
  name: 'Number',
  props: ['vm'],
};
</script>
