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
      <div class='replies'>
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
          <div>
              <img :src='profile.image' class='avatar'>
          </div>
          <ui-textbox
              placeholder='Add a comment'
              class='my-comment-input'
              required
              :rows='2'
              :multi-line='true'
              v-model='myReply'></ui-textbox>
        </div>

        <div class='actions' v-if='showActions'>
          <router-link type='secondary' class='cancel-btn small secondary'  buttonType='button' :to='{name: "project-discussion"}'>
            Cancel
          </router-link>
          <ui-button type='secondary' class='commit-btn' color='primary'  buttonType='submit'>Post</ui-button>
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
  border-bottom: 1px solid strong-border-color;
  .avatar {
    width: 36px;
    margin: 14px;
  }
}

.main-comment {
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid strong-border-color;

  .content {
    margin-top: 14px;
  }
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

.add-comment-form {
  padding-top: 14px;
  border-top: 1px solid strong-border-color;
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
}
.my-comment-input {
  flex: 1;
  margin-left: 14px;
}
</style>
