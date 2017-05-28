<template>
  <div class='discussions'>
    <div v-if='!isLoading && !discussions.length'>
      There are no discussions here yet...
    </div>
    <router-link  class='start-discussion action' :to='{name: "add-comment"}'>
      Start new discussion
    </router-link>

    <loading :isLoading='isLoading'>Loading latest comments...</loading>

    <div class='comment' v-for='comment in discussions' v-if='!isLoading'>
      <router-link class='header' :to='{name: "comment-details", params: { commentId: comment.id }}'>{{comment.text}}</router-link>
      <div class='byline'>
        <div class='time small secondary'>{{comment.created}}</div>
        <div class='author small' v-if='comment.author.name' >
          by <router-link :to='{name: "userPage", params: { userId: comment.author.id }}'>
            {{comment.author.name}}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from '../Loading.vue';
import { listComments } from '../../lib/streak-api/comments.js';

export default {
  name: 'ProjectDiscussions',
  props: ['project'],
  data() {
    return {
      isLoading: true,
      discussions: []
    };
  },
  created() {
    this.loadComments();
  },
  methods: {
    loadComments() {
      this.isLoading = true;
      listComments(this.project.id).then(res => {
        this.isLoading = false;
        this.discussions = res.comments;
      });
    }
  },
  components: {
    Loading
  }
};
</script>

<style lang='stylus' scoped>
@import '../../styles/variables.styl'

.time,
.author {
  display: inline-block;
}
.header {
  color: #2c3e50;
  display: block;
  width: 100%;
  font-weight: 500;
}
.comment {
  border-bottom: 1px solid strong-border-color;
  padding: 14px;
  &:hover {
    background: header-background;
  }
}
.start-discussion {
  font-size: 24px;
  margin: 14px 0;
  display: block;
}
</style>
