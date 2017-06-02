<template>
    <div class="ui-textbox multi-suggest" :class="classes">
        <div class="ui-textbox__icon-wrapper" v-if="icon || $slots.icon">
            <slot name="icon">
                <ui-icon :icon="icon"></ui-icon>
            </slot>
        </div>

        <div class="ui-textbox__content">
            <label class="ui-autocomplete__label">
                <div
                    class="ui-textbox__label-text"
                    :class="labelClasses"
                    v-if="label || $slots.default"
                >
                    <slot>{{ label }}</slot>
                </div>

                <textarea
                    class="ui-textbox__textarea"
                    ref="textarea"

                    autocomplete="off"
                    :autocorrect="hasSuggestions ? 'off' : 'on'"
                    :disabled="disabled"
                    :maxlength="enforceMaxlength ? maxlength : null"
                    :name="name"
                    :placeholder="hasFloatingLabel ? null : placeholder"
                    :readonly="readonly"
                    :required="required"
                    :rows="rows"
                    :value="value"

                    @blur="onBlur"
                    @change="onChange"
                    @focus="onFocus"
                    @input="updateValue($event.target.value)"
                    @keydown.enter="onKeydownEnter"
                    @keydown.esc="closeDropdown"
                    @keydown="onKeydown"

                    v-autofocus="autofocus"
                >{{ value }}</textarea>

                <ul class="ui-autocomplete__suggestions" :style='{"width": currentWidth, "top": currentBottom}' v-show="showDropdown">
                    <ui-autocomplete-suggestion
                        ref="suggestions"
                        :highlighted="highlightedIndex === index"
                        :keys="keys"
                        :suggestion="suggestion"
                        type="simple"

                        @click.native="selectSuggestion(suggestion)"

                        v-for="(suggestion, index) in matchingSuggestions"
                    >
                        <slot
                            name="suggestion"

                            :highlighted="highlightedIndex === index"
                            :index="index"
                            :suggestion="suggestion"
                        ></slot>
                    </ui-autocomplete-suggestion>
                </ul>
            </label>

            <div class="ui-textbox__feedback" v-if="hasFeedback || maxlength">
                <div class="ui-textbox__feedback-text" v-if="showError">
                    <slot name="error">{{ error }}</slot>
                </div>

                <div class="ui-textbox__feedback-text" v-else-if="showHelp">
                    <slot name="help">{{ help }}</slot>
                </div>

                <div class="ui-textbox__counter" v-if="maxlength">
                    {{ value.length + '/' + maxlength }}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
// eslint-disable
import UiIcon from 'keen-ui/src/UiIcon';
import UiAutocompleteSuggestion from 'keen-ui/src/UiAutocompleteSuggestion';
import autosize from 'autosize';

import autofocus from './autofocus';

export default {
  name: 'multi-complete',

  props: {
    name: String,
    placeholder: String,
    value: {
      type: [String, Number],
      required: true
    },
    icon: String,
    iconPosition: {
      type: String,
      default: 'left' // 'left' or 'right'
    },
    label: String,
    floatingLabel: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'text' // all the possible HTML5 input types, except those that have a special UI
    },
    rows: {
      type: Number,
      default: 2
    },
    autofocus: {
      type: Boolean,
      default: false
    },
    autosize: {
      type: Boolean,
      default: true
    },
    min: Number,
    max: Number,
    step: {
      type: String,
      default: 'any'
    },
    maxlength: Number,
    enforceMaxlength: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    help: String,
    error: String,
    invalid: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    suggestions: {
      type: Array,
      default() {
        return [];
      }
    },
    limit: {
      type: Number,
      default: 8
    },
    minChars: {
      type: Number,
      default: 1
    },
    showOnUpDown: {
      type: Boolean,
      default: false
    },
    highlightOnFirstMatch: {
      type: Boolean,
      default: true
    },
    cycleHighlight: {
      type: Boolean,
      default: true
    },
    keys: {
      type: Object,
      default() {
        return {
          label: 'label',
          value: 'value',
          image: 'image'
        };
      }
    },
  },

  data() {
    return {
      currentWidth: '100%',
      currentBottom: '0',
      isActive: false,
      isTouched: false,
      initialValue: this.value,
      autosizeInitialized: false,
      showDropdown: false,
      highlightedIndex: -1
    };
  },

  computed: {
    classes() {
      return [
        `ui-textbox--icon-position-${this.iconPosition}`,
        { 'is-active': this.isActive },
        { 'is-invalid': this.invalid },
        { 'is-touched': this.isTouched },
        { 'is-multi-line': true },
        { 'has-counter': this.maxlength },
        { 'is-disabled': this.disabled },
        { 'has-label': this.hasLabel },
        { 'has-floating-label': this.hasFloatingLabel }
      ];
    },

    hasSuggestions() {
      return this.suggestions && this.suggestions.length > 0;
    },

    labelClasses() {
      return {
        'is-inline': this.hasFloatingLabel && this.isLabelInline,
        'is-floating': this.hasFloatingLabel && !this.isLabelInline
      };
    },

    hasLabel() {
      return Boolean(this.label) || Boolean(this.$slots.default);
    },

    hasFloatingLabel() {
      return this.hasLabel && this.floatingLabel;
    },

    isLabelInline() {
      return this.value.length === 0 && !this.isActive;
    },

    minValue() {
      if (this.type === 'number' && this.min !== undefined) {
        return this.min;
      }

      return null;
    },

    maxValue() {
      if (this.type === 'number' && this.max !== undefined) {
        return this.max;
      }

      return null;
    },

    stepValue() {
      return this.type === 'number' ? this.step : null;
    },

    hasFeedback() {
      return Boolean(this.help) || Boolean(this.error);
    },

    showError() {
      return this.invalid && Boolean(this.error);
    },

    showHelp() {
      return !this.showError && Boolean(this.help);
    },

    matchingSuggestions() {
      return this.suggestions
        .filter(suggestion => {
          return this.defaultFilter(suggestion, this.value);
        })
        .slice(0, this.limit);
    }
  },

  watch: {
    value() {
      if (this.isActive && this.value.length >= this.minChars) {
        this.openDropdown();
      }
      this.highlightedIndex = this.highlightOnFirstMatch ? 0 : -1;
    }
  },

  mounted() {
    if (this.autosize) {
      autosize(this.$refs.textarea);
      this.autosizeInitialized = true;
    }
    document.addEventListener('click', this.onExternalClick);
  },

  beforeDestroy() {
    if (this.autosizeInitialized) {
      autosize.destroy(this.$refs.textarea);
    }
    document.removeEventListener('click', this.onExternalClick);
  },

  methods: {
    defaultFilter(suggestion, query) {
      if (!query) return true;

      return suggestion.toLowerCase().indexOf(query.toLowerCase()) === 0;
    },

    selectSuggestion(suggestion) {
      let value;
      if (this.append) {
        value += this.appendDelimiter + (suggestion[this.keys.value] || suggestion);
      } else {
        value = suggestion[this.keys.value] || suggestion;
      }
      this.updateValue(value);
      this.$emit('select', suggestion);
      this.$nextTick(() => {
        this.closeDropdown();
        this.$refs.textarea.focus();
        this.refreshSize();
      });
    },

    highlightSuggestion(index) {
      const firstIndex = 0;
      const lastIndex = this.$refs.suggestions.length - 1;
      if (index === -2) { // Allows for cycling from first to last when cycleHighlight is disabled
        index = lastIndex;
      } else if (index < firstIndex) {
        index = this.cycleHighlight ? lastIndex : index;
      } else if (index > lastIndex) {
        index = this.cycleHighlight ? firstIndex : -1;
      }
      this.highlightedIndex = index;
      if (this.showOnUpDown) {
        this.openDropdown();
      }
      if (index < firstIndex || index > lastIndex) {
        this.$emit('highlight-overflow', index);
      } else {
        this.$emit('highlight', this.$refs.suggestions[index].suggestion, index);
      }
    },

    selectHighlighted(index, e) {
      if (this.showDropdown && this.$refs.suggestions && this.$refs.suggestions.length > 0) {
        e.preventDefault();
        const currentSuggestion = this.$refs.suggestions[index];
        if (currentSuggestion) this.selectSuggestion(currentSuggestion.suggestion);
      }
    },

    openDropdown() {
      if (!this.hasSuggestions) {
        return;
      }

      if (!this.showDropdown) {
        this.showDropdown = true;
        this.$emit('dropdown-open');
      }
    },

    closeDropdown() {
      if (this.showDropdown) {
        this.$nextTick(() => {
          this.showDropdown = false;
          this.highlightedIndex = -1;
          this.$emit('dropdown-close');
        });
      }
    },

    updateValue(value) {
      this.$emit('input', value);
    },

    onChange(e) {
      this.$emit('change', this.value, e);
    },

    onFocus(e) {
      this.isActive = true;
      this.updateSuggestionsPosition();
      this.$emit('focus', e);
    },

    onBlur(e) {
      this.isActive = false;
      this.$emit('blur', e);

      if (!this.isTouched) {
        this.isTouched = true;
        this.$emit('touch');
      }
    },

    onKeydown(e) {
      let preventDefault = false;
      if (this.showDropdown) {
        if (e.key === 'ArrowDown') {
          this.highlightSuggestion(this.highlightedIndex + 1);
          preventDefault = true;
        } else if (e.key === 'ArrowUp') {
          this.highlightSuggestion(this.highlightedIndex - 1);
          preventDefault = true;
        }
      }
      if (preventDefault) {
        e.preventDefault();
        return;
      }

      if (e.key === 'Tab') {
        this.closeDropdown();
      }
      this.$emit('keydown', e);
    },

    onKeydownEnter(e) {
      if (this.showDropdown) {
        this.selectHighlighted(this.highlightedIndex, e);
      }
      this.$emit('keydown-enter', e);
    },

    onExternalClick(e) {
      if (!this.$el.contains(e.target) && this.showDropdown) {
        this.closeDropdown();
      }
    },

    updateSuggestionsPosition() {
      const bbox = this.$refs.textarea.getBoundingClientRect();
      this.currentWidth = bbox.width + 'px';
      this.currentBottom = bbox.bottom + 'px';
    },

    reset() {
      // Blur the input if it's focused to prevent required errors
      // when it's value is reset
      if (document.activeElement === this.$refs.textarea) {
        document.activeElement.blur();
      }

      this.updateValue(this.initialValue);
      this.resetTouched();
    },

    resetTouched(options = { touched: false }) {
      this.isTouched = options.touched;
    },

    refreshSize() {
      if (this.autosizeInitialized) {
        autosize.update(this.$refs.textarea);
      }
    }
  },

  components: {
    UiIcon,
    UiAutocompleteSuggestion
  },

  directives: {
    autofocus
  }
};
</script>

<style lang="scss">
@import '../../../node_modules/keen-ui/src/styles/imports';
// TODO: Remove dependency on keen&#45;us styles

.ui-autocomplete {
    align-items: flex-start;
    display: flex;
    font-family: $font-stack;
    margin-bottom: $ui-input-margin-bottom;
    position: relative;
    &:hover:not(.is-disabled) {
        .ui-autocomplete__label-text {
            color: $ui-input-label-color--hover;
        }
        .ui-autocomplete__input {
            border-bottom-color: $ui-input-border-color--hover;
        }
    }
    &.is-active:not(.is-disabled) {
        .ui-autocomplete__label-text,
        .ui-autocomplete__icon-wrapper .ui-icon {
            color: $ui-input-label-color--active;
        }
        .ui-autocomplete__input {
            border-bottom-color: $ui-input-border-color--active;
            border-bottom-width: $ui-input-border-width--active;
        }
    }
    &.has-floating-label {
        .ui-autocomplete__label-text {
            // Behaves like a block, but width is the width of its content.
            // Needed here so label doesn't overflow parent when scaled.
            display: table;
            &.is-inline {
                color: $ui-input-label-color; // So the hover styles don't override it
                cursor: text;
                transform: translateY($ui-input-label-top--inline) scale(1.1);
            }
            &.is-floating {
                transform: translateY(0) scale(1);
            }
        }
    }
    &.has-label {
        .ui-autocomplete__icon-wrapper {
            padding-top: $ui-input-icon-margin-top--with-label;
        }
        .ui-autocomplete__clear-button {
            top: $ui-input-button-margin-top--with-label;
        }
    }
    &.is-invalid:not(.is-disabled) {
        .ui-autocomplete__label-text,
        .ui-autocomplete__icon-wrapper .ui-icon {
            color: $ui-input-label-color--invalid;
        }
        .ui-autocomplete__input {
            border-bottom-color: $ui-input-border-color--invalid;
        }
        .ui-autocomplete__feedback {
            color: $ui-input-feedback-color--invalid;
        }
    }
    &.is-disabled {
        .ui-autocomplete__input {
            border-bottom-style: $ui-input-border-style--disabled;
            border-bottom-width: $ui-input-border-width--active;
            color: $ui-input-text-color--disabled;
        }
        .ui-autocomplete__icon-wrapper .ui-icon {
            opacity: $ui-input-icon-opacity--disabled;
        }
        .ui-autocomplete__feedback {
            opacity: $ui-input-feedback-opacity--disabled;
        }
    }
}
.ui-autocomplete__label {
    display: block;
    margin: 0;
    padding: 0;
    position: relative;
    width: 100%;
}
.ui-autocomplete__icon-wrapper {
    flex-shrink: 0;
    margin-right: $ui-input-icon-margin-right;
    padding-top: $ui-input-icon-margin-top;
    .ui-icon {
        color: $ui-input-icon-color;
    }
}
.ui-autocomplete__content {
    flex-grow: 1;
}
.ui-autocomplete__label-text {
    color: $ui-input-label-color;
    font-size: $ui-input-label-font-size;
    line-height: $ui-input-label-line-height;
    margin-bottom: $ui-input-label-margin-bottom;
    transform-origin: left;
    transition: color 0.1s ease, transform 0.2s ease;
}
.ui-autocomplete__input {
    background: none;
    border: none;
    border-bottom-color: $ui-input-border-color;
    border-bottom-style: solid;
    border-bottom-width: $ui-input-border-width;
    border-radius: 0;
    color: $ui-input-text-color;
    cursor: auto;
    font-family: $font-stack;
    font-size: $ui-input-text-font-size;
    font-weight: normal;
    height: $ui-input-height;
    outline: none;
    padding: 0;
    transition: border 0.1s ease;
    width: 100%;
    // Hide Edge and IE input clear button
    &::-ms-clear {
        display: none;
    }
}
.ui-autocomplete__clear-button {
    color: $ui-input-button-color;
    cursor: pointer;
    font-size: $ui-input-button-size;
    position: absolute;
    right: 0;
    top: $ui-input-button-margin-top;
    &:hover {
        color: $ui-input-button-color--hover;
    }
}
.ui-autocomplete__suggestions {
    background-color: white;
    box-shadow: 1px 2px 8px $md-grey-600;
    color: $primary-text-color;
    display: block;
    list-style-type: none;
    margin: 0;
    margin-bottom: rem-calc(8px);
    padding: 0;
    position: absolute;
    z-index: $z-index-dropdown;
}
.ui-autocomplete__feedback {
    color: $ui-input-feedback-color;
    font-size: $ui-input-feedback-font-size;
    line-height: $ui-input-feedback-line-height;
    margin: 0;
    padding-top: $ui-input-feedback-padding-top;
    position: relative;
}
// ================================================
// Icon positions
// ================================================
.ui-autocomplete--icon-position-right {
    .ui-autocomplete__icon-wrapper {
        margin-left: rem-calc(8px);
        margin-right: 0;
        order: 1;
    }
}

.multi-suggest {
  .ui-autocomplete__suggestions {
    position: fixed;
  }
}
</style>
