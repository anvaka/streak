<template>
  <div class='discussions'>
    Here will be discussions! Yay
    <router-link  class='add-comment-link action' :to='{name: "add-comment"}'>
      Start new discussion
    </router-link>.
    <div class='comment' v-for='comment in discussions'>
      {{comment.content}}
    </div>
  </div>
</template>

<script>
import comments from '../lib/gapi/comments.js';

export default {
  name: 'ProjectDiscussions',
  props: ['project'],
  data() {
    return {
      loading: true,
      discussions: []
    };
  },
  created() {
    this.loadComments();
  },
  methods: {
    loadComments() {
      this.loading = true;
      comments('list', {
        fileId: this.project.id,
        fields: '*',
      }).then(res => {
        this.loading = false;
        this.discussions = res.comments;
      });
    }
  }
};
</script>
