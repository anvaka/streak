<template>
  <form class='start-discussion' @submit.prevent='addComment'>
    <h3>Start discussion</h3>

    <ui-textbox
        :autofocus='true'
        floating-label
        :rows='1'
        :multi-line='true'
        v-model='comment'></ui-textbox>

    <div class='actions' v-if='showActions'>
      <router-link type='secondary' class='cancel-btn'  buttonType='button' :to='{name: "project-discussion"}'>
        Cancel
      </router-link>
      <ui-button type='secondary' class='commit-btn' color='primary'  buttonType='submit'>
        Start new discussion
      </ui-button>
    </div>
  </form>
</template>

<script>
import UiTextbox from 'keen-ui/src/UiTextbox';
import UiButton from 'keen-ui/src/UiButton';

import { addComment } from '../lib/streak-api/comments.js';

export default {
  name: 'AddComment',
  props: ['project'],
  data() {
    return {
      comment: '',
      showActions: true
    };
  },

  methods: {
    addComment() {
      if (!this.comment) {
        // TODO: Validation
        return;
      }
      addComment(this.project.id, this.comment).then(() =>
        this.$router.push({ name: 'project-discussion' })
      );
    },
    cancel() {
      this.$router.push({ name: 'project-overview' });
    }
  },
  components: {
    UiTextbox,
    UiButton
  }
};
</script>

<style lang='stylus'>
.start-discussion {
  max-width: 500px;
}
.cancel-btn {
  line-height: 36px;
  text-transform: uppercase;
  font-weight: 500;
  font-size: 0.875rem;
}
</style>
