<template>
  <form class='start-discussion' @submit.prevent='addComment'>
    <h3>Start discussion</h3>

    <ui-textbox
        placeholder='Enter text here'
        required
        :autofocus='true'
        :rows='1'
        :multi-line='true'
        v-model='comment'></ui-textbox>

    <div class='actions' v-if='showActions'>
      <router-link type='secondary' class='cancel-btn small secondary'  buttonType='button' :to='{name: "project-discussion"}'>
        Cancel
      </router-link>
      <ui-button type='secondary' class='commit-btn' color='primary'  buttonType='submit'>
        Start public discussion
      </ui-button>
    </div>
  </form>
</template>

<script>
import UiTextbox from 'keen-ui/src/UiTextbox';
import UiButton from 'keen-ui/src/UiButton';

import { addComment } from '../../lib/streak-api/comments.js';

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

<style lang='stylus' scoped>
.start-discussion {
  max-width: 500px;
}

.cancel-btn {
  text-transform: uppercase;
}
.actions {
  align-items: baseline;
}
</style>
