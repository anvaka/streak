<template>
  <div class='comment-details'>
    <loading :isLoading='isLoading'>Loading discussion...</loading>
    <div v-if='!isLoading'>
      <div class='main-comment'>
        <div class='header'>
          <img :src='comment.author.picture' class='avatar'>
          <div>
            <router-link :to='{name: "userPage", params: { userId: comment.author.id }}' class='user-link'>
              {{comment.author.name}}
            </router-link>
            <span class='time-stamp small secondary'> {{comment.created}}</span>
          </div>
        </div>
        <div class='content'>
            {{comment.text}}
        </div>
      </div>
      <div class='replies' v-if='replies.length'>
        <div v-for='reply in replies' class='reply'>
          <img :src='reply.author.picture' class='avatar'>
          <div class='content'>
            <div>
              <router-link :to='{name: "userPage", params: { userId: reply.author.id }}' class='user-link'>
                {{reply.author.name}}
              </router-link>
              <span class='time-stamp small secondary'>{{reply.created}}</span>
            </div>
            <div>{{reply.text}}</div>
          </div>
        </div>
      </div>
      <form class='add-comment-form' @submit.prevent='addComment'>
        <div class='my-comment' >
          <img :src='profile.image' class='avatar'>
          <div class='my-comment-input'>
            <ui-textbox
                placeholder='Add a comment'
                required
                :rows='2'
                :multi-line='true'
                v-model='myReply'></ui-textbox>
            <div class='actions' v-if='showActions'>
              <router-link type='secondary' class='cancel-btn small secondary'  buttonType='button' :to='{name: "project-discussion"}'>
                Cancel
              </router-link>
              <ui-button type='secondary' class='commit-btn' color='primary'  buttonType='submit'>Post</ui-button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import UiTextbox from 'keen-ui/src/UiTextbox';
import UiButton from 'keen-ui/src/UiButton';

import Loading from '../Loading.vue';
import auth from '../../lib/auth';
import { getComment, reply } from '../../lib/streak-api/comments.js';

export default {
  name: 'CommentDetails',
  props: ['commentId'],
  data() {
    return {
      isLoading: true,
      profile: auth.signInStatus.profile,
      myReply: '',
      replies: [],
      comment: null,
      showActions: true
    };
  },

  created() {
    this.loadComments();
  },
  methods: {
    addComment() {
      if (!this.comment) {
        // TODO: Validation
        return;
      }

      this.showActions = false;
      reply(this.commentId, this.myReply).then(() => {
        this.showActions = true;
        this.myReply = '';
        this.loadComments();
      }).catch(e => {
        this.showActions = true;
        throw e;
      });
    },
    cancel() {
      this.$router.push({ name: 'project-discussion' });
    },
    loadComments() {
      this.isLoading = true;
      getComment(this.commentId).then(res => {
        this.isLoading = false;
        this.comment = res.comment;
        this.replies = res.replies;
      });
    }
  },
  components: {
    UiTextbox,
    Loading,
    UiButton
  }
};
</script>

<style lang='stylus' scoped>

@import '../../styles/variables.styl'

.comment-details {
  max-width: 500px;
}

.header {
  display: flex;
  align-items: center;
  .avatar {
    width: 36px;
    margin: 14px;
  }
}

.main-comment {
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid strong-border-color;
}
.user-link {
  color: base-text-color;
  font-weight: 500;
}

.reply {
  display: flex;
  margin: 14px;
  .avatar {
    width: 24px;
    height: 24px;
  }
  .content {
    flex: 1;
    margin-left: 14px;
  }
}

.replies {
  border-bottom: 1px solid strong-border-color;
}

.add-comment-form {
  padding-top: 14px;
}

.cancel-btn {
  text-transform: uppercase;
}
.actions {
  align-items: baseline;
}

.my-comment {
  display: flex;
  flex-direction: row;
  .avatar {
    margin-left: 14px;
    width: 24px;
    height: 24px;
  }
}

.my-comment-input {
  flex: 1;
  margin-left: 14px;
  display: flex;
  flex-direction: column;
  .ui-textbox {
    margin-bottom: 0;
  }
}
</style>
