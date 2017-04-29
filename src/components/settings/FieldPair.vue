<template>
  <div class='field' :class='{error: field.error}'>
      <ui-textbox
            class='field-name'
            label='Field name'
            autocomplete='off'
            placeholder='Give this field a name'
            v-model='field.title'
            :autofocus='focused'
            :invalid='field.error'
      ></ui-textbox>
      <ui-select
            class='field-type'
            label='Field type'
            placeholder='Select a field type'
            :options='fieldTypes'
            v-model='field.type'></ui-select>
      <a title='Remove this field' class='remove-row secondary' @click.prevent='removeField(field)' href='#'>x</a>
  </div>
</template>
<script>
import UiTextbox from 'keen-ui/src/UiTextbox';
import UiButton from 'keen-ui/src/UiButton';
import UiSelect from 'keen-ui/src/UiSelect';

import { FIELD_TYPES } from '../../types/FieldTypes.js';

export default {
  name: 'FieldPair',
  props: {
    field: Object,
    focused: {
      type: Boolean,
      default: false
    }
  },
  components: {
    UiTextbox,
    UiButton,
    UiSelect,
  },
  data() {
    return {
      fieldTypes: FIELD_TYPES
    };
  },
  methods: {
    removeField() {
      this.$emit('remove', this.field);
    }
  }
};
</script>
<style lang='stylus'>
@import '../../styles/variables.styl';

.field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid strong-border-color;
  padding: 7px 14px;
  margin-top: 14px;
  position: relative;

  .field-name, .field-type {
    flex: 1;
    margin: 7px;
  }
  .remove-row {
    position: absolute;
    right: 0;
    top: 0;
    display: inline-block;
    width: 21px;
    padding-left: 7px;
  }
  .ui-textbox__input {
    border-bottom: 1px solid transparent;
  }
  .ui-select__display {
    border-bottom: 1px solid transparent;
  }
}
.field.error {
	border-color: error-color;
}

@media only screen and (max-width: small-screen-size) {
  .field {
    flex-direction: column;
    align-items: stretch;
    height: 142px;

    .remove-row {
      width: 36px;
      padding-left: 14px;
      padding-top: 7px;
      padding-bottom: 5px;
    }
  }
}
</style>
