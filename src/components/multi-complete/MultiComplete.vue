<template>
    <div class="multi-suggest" :class="classes">
        <div class="mc-icon-wrapper" v-if="icon || $slots.icon">
            <slot name="icon">
                <i class="material-icons">{{icon}}</i>
            </slot>
        </div>

        <div class="mc-content">
            <label class="mc-label">
                <div
                    class="mc-label-text"
                    :class="labelClasses"
                    v-if="label || $slots.default"
                >
                    <slot>{{ label }}</slot>
                </div>

                <textarea
                    class="mc-textarea"
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
                    :value="modelValue"

                    @blur="onBlur"
                    @change="onChange"
                    @focus="onFocus"
                    @input="updateValue($event.target.value)"
                    @keydown.enter="onKeydownEnter"
                    @keydown.esc="closeDropdown"
                    @keydown="onKeydown"

                    v-autofocus="autofocus"
                >{{ modelValue }}</textarea>

                <ul class="mc-suggestions" :style='{"width": currentWidth, "top": currentBottom}' v-show="showDropdown">
                    <li
                        ref="suggestions"
                        class="mc-suggestion-item"
                        :class="{ 'is-highlighted': highlightedIndex === index }"
                        v-for="(suggestion, index) in matchingSuggestions"
                        @click="selectSuggestion(suggestion)"
                    >
                        {{ suggestion }}
                    </li>
                </ul>
            </label>

            <div class="mc-feedback" v-if="hasFeedback || maxlength">
                <div class="mc-feedback-text" v-if="showError">
                    <slot name="error">{{ error }}</slot>
                </div>

                <div class="mc-feedback-text" v-else-if="showHelp">
                    <slot name="help">{{ help }}</slot>
                </div>

                <div class="mc-counter" v-if="maxlength">
                    {{ modelValue.length + '/' + maxlength }}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import autosize from 'autosize';

import autofocus from './autofocus';

export default {
  name: 'multi-complete',

  props: {
    name: String,
    placeholder: String,
    modelValue: {
      type: [String, Number],
      required: true
    },
    icon: String,
    iconPosition: {
      type: String,
      default: 'left'
    },
    label: String,
    floatingLabel: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'text'
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

  emits: ['update:modelValue', 'select', 'focus', 'blur', 'touch', 'change',
          'keydown', 'keydown-enter', 'highlight', 'highlight-overflow',
          'dropdown-open', 'dropdown-close'],

  data() {
    return {
      currentWidth: '100%',
      currentBottom: '0',
      isActive: false,
      isTouched: false,
      initialValue: this.modelValue,
      autosizeInitialized: false,
      showDropdown: false,
      highlightedIndex: -1
    };
  },

  computed: {
    classes() {
      return [
        `mc--icon-position-${this.iconPosition}`,
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
      return this.modelValue.length === 0 && !this.isActive;
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
          return this.defaultFilter(suggestion, this.modelValue);
        })
        .slice(0, this.limit);
    }
  },

  watch: {
    modelValue() {
      if (this.isActive && this.modelValue.length >= this.minChars) {
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

  beforeUnmount() {
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
      const lastIndex = this.matchingSuggestions.length - 1;
      if (index === -2) {
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
        this.$emit('highlight', this.matchingSuggestions[index], index);
      }
    },

    selectHighlighted(index, e) {
      if (this.showDropdown && this.matchingSuggestions.length > 0) {
        e.preventDefault();
        const suggestion = this.matchingSuggestions[index];
        if (suggestion) this.selectSuggestion(suggestion);
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
      this.$emit('update:modelValue', value);
    },

    onChange(e) {
      this.$emit('change', this.modelValue, e);
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

  directives: {
    autofocus
  }
};
</script>

<style lang="stylus">
@import '../../styles/variables.styl'

.multi-suggest
  align-items flex-start
  display flex
  margin-bottom 1rem
  position relative

  &:hover:not(.is-disabled)
    .mc-label-text
      color rgba(0, 0, 0, 0.75)
    .mc-textarea
      border-bottom-color rgba(0, 0, 0, 0.54)

  &.is-active:not(.is-disabled)
    .mc-label-text
      color #2196f3
    .mc-textarea
      border-bottom-color #2196f3
      border-bottom-width 2px

  &.has-floating-label
    .mc-label-text
      display table
      &.is-inline
        color secondary-text-color
        cursor text
        transform translateY(1.6rem) scale(1.1)
      &.is-floating
        transform translateY(0) scale(1)

  &.is-invalid:not(.is-disabled)
    .mc-label-text
      color error-color
    .mc-textarea
      border-bottom-color error-color

  &.is-disabled
    .mc-textarea
      border-bottom-style dashed
      color rgba(0, 0, 0, 0.38)

.mc-label
  display block
  margin 0
  padding 0
  position relative
  width 100%

.mc-icon-wrapper
  flex-shrink 0
  margin-right 12px
  .material-icons
    color secondary-text-color

.mc-content
  flex-grow 1

.mc-label-text
  color secondary-text-color
  font-size 0.8125rem
  line-height 1.2
  margin-bottom 4px
  transform-origin left
  transition color 0.1s ease, transform 0.2s ease

.mc-textarea
  background none
  border none
  border-bottom 1px solid rgba(0, 0, 0, 0.12)
  border-radius 0
  color base-text-color
  cursor auto
  font-family inherit
  font-size 1rem
  font-weight normal
  outline none
  padding 6px 0
  resize vertical
  transition border 0.1s ease
  width 100%

.mc-suggestions
  background-color white
  box-shadow 1px 2px 8px rgba(0, 0, 0, 0.3)
  color base-text-color
  display block
  list-style-type none
  margin 0
  margin-bottom 8px
  padding 0
  position fixed
  z-index 100

.mc-suggestion-item
  padding 8px 16px
  cursor pointer
  font-size 0.875rem
  &:hover, &.is-highlighted
    background-color #f5f5f5

.mc-feedback
  color secondary-text-color
  font-size 0.75rem
  line-height 1.4
  margin 0
  padding-top 4px
  position relative

.mc-counter
  position absolute
  right 0
  top 4px

.mc--icon-position-right
  .mc-icon-wrapper
    margin-left 8px
    margin-right 0
    order 1
</style>
