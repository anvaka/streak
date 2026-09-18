<template>
  <div class='field' :class='{error: field.error}'>
      <div class='form-field field-name'>
        <label>Field name</label>
        <input
            type='text'
            :disabled='readonly'
            autocomplete='off'
            placeholder='Give this field a name'
            v-model='field.title'
            :autofocus='focused'
        >
      </div>
      <div class='form-field field-type'>
        <label>Field type</label>
        <select :disabled='readonly' v-model='field.type'>
          <option disabled value=''>Select a field type</option>
          <option v-for='ft in fieldTypes' :key='ft.value' :value='ft'>{{ft.label}}</option>
        </select>
      </div>
      <a title='Remove this field' class='remove-row secondary' @click.prevent='removeField(field)' href='#' v-if='!readonly'>x</a>
  </div>
</template>
<script>
import { FIELD_TYPES } from '../../types/FieldTypes.js';

export default {
  name: 'FieldPair',
  props: {
    field: Object,
    focused: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    }
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
