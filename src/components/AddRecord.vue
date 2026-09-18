<template>
  <form @submit.prevent='commitChanges' class='editor-form'>
    <div class='input-fields'>
      <div class='input-container' v-for='field in fields'>
        <div v-if='field.valueType === "date"'>
          <date :vm='field'></date>
        </div>
        <div v-if='isTextField(field)'>
          <multi-line-text :vm='field'></multi-line-text>
        </div>
        <div v-if='field.valueType === "number"'>
          <number :vm='field'></number>
        </div>
        <div v-if='field.valueType === "image"'>
          <image-input :vm='field'></image-input>
        </div>
      </div>
    </div>
    <div class='actions' v-if='showActions'>
      <button type='button' class='btn cancel-btn' @click.prevent='cancel'>
        Cancel
      </button>
      <button type='submit' class='btn btn--primary commit-btn'>
        Save record
      </button>
    </div>
  </form>
</template>
<script>
import Date from './inputs/Date';
import MultiLineText from './inputs/MultiLineText';
import Number from './inputs/Number';
import ImageInput from './inputs/Image';
import isTextField from '../lib/isTextField.js';

export default {
  props: ['fields', 'showActions', 'row'],
  components: {
    Date,
    MultiLineText,
    Number,
    ImageInput
  },
  data() {
    return {};
  },
  methods: {
    isTextField(cell) {
      return isTextField(cell);
    },
    commitChanges() {
      const newRowValues = this.fields.map(field => field.value);
      this.$emit('commit', newRowValues);
    },
    cancel() {
      this.$emit('cancel');
    }
  }
};
</script>

<style lang='stylus'>
.actions {
  display: flex;
  justify-content: space-between;
  margin: 14px 0;
}

.editor-form {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.input-fields {
  overflow-y: auto;
  flex: 1;
}
</style>
