<template>
  <form class='start-discussion' @submit.prevent='addComment'>
    <h3>Start discussion</h3>

    <div class='form-field'>
      <textarea
          placeholder='Enter text here'
          required
          autofocus
          rows='1'
          v-model='comment'></textarea>
    </div>

    <div class='actions' v-if='showActions'>
      <router-link type='secondary' class='cancel-btn small secondary'  buttonType='button' :to='{name: "project-discussion"}'>
        Cancel
      </router-link>
      <button type='submit' class='btn btn--primary commit-btn'>
        Start public discussion
      </button>
    </div>
  </form>
</template>

<script>
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
