<template>
  <form @submit.prevent='commitChanges' class='editor-form'>
    <div class='input-fields'>
      <div class='input-container' v-for='field in fields'>
        <div v-if='field.valueType === "date"'>
          <date :vm='field'></date>
        </div>
        <div v-if='field.valueType === "multiline-text"'>
          <multi-line-text :vm='field'></multi-line-text>
        </div>
        <div v-if='field.valueType === "string"'>
          <single-line-text :vm='field'></single-line-text>
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
import { UiTextbox, UiButton, UiIconButton } from 'keen-ui';
import Date from './inputs/Date';
import MultiLineText from './inputs/MultiLineText';
import SingleLineText from './inputs/SingleLineText';
import Number from './inputs/Number';
import ImageInput from './inputs/Image';

export default {
  props: ['fields', 'showActions', 'row'],
  components: {
    UiTextbox,
    UiButton,
    UiIconButton,
    Date,
    MultiLineText,
    SingleLineText,
    Number,
    ImageInput
  },
  data() {
    return {};
  },
  methods: {
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
