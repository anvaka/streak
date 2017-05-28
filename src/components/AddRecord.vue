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
      <ui-button type='secondary' class='cancel-btn'  buttonType='button' @click.prevent='cancel'>
        Cancel
      </ui-button>
      <ui-button type='secondary' class='commit-btn' color='primary'  buttonType='submit'>
        Save record
      </ui-button>
    </div>
  </form>
</template>
<script>
import UiTextbox from 'keen-ui/src/UiTextbox';
import UiButton from 'keen-ui/src/UiButton';
import UiIconButton from 'keen-ui/src/UiIconButton';
import Date from './inputs/Date';
import MultiLineText from './inputs/MultiLineText';
import Number from './inputs/Number';
import ImageInput from './inputs/Image';
import isTextField from '../lib/isTextField.js';

export default {
  props: ['fields', 'showActions', 'row'],
  components: {
    UiTextbox,
    UiButton,
    UiIconButton,
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
      // note: we are not using this.isTextField() - that would be a recursion
      // This method comes from the lib folder. See imports above.
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
