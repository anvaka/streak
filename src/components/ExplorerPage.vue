<template>
  <div class='explore'>
    <h2>Streakers</h2>
    <p> This is a list of all our users.  </p>

    <loading :isLoading='isLoading'>Loading list...</loading>

    <div>
      <router-link :to='{name: "userPage", params: { userId: user.id }}' v-for='user in users' class='user-container' >
        <img :src='user.picture'>
        <div class='owner-name'>{{user.name}}</div>
      </router-link>
      <div v-if='users.length === 0 && !isLoading'> No more users. Invite your friends :)?  </div>
    </div>
    <div class='pager' v-if='!isLoading'>
      <router-link :to='{name: "explore"}' v-if='shouldShowStart'>Start over</router-link>
      <router-link :to='{name: "explore", query: {
        pageCursor: nextCursor
      }}' v-if='nextCursor'>Next</router-link>
    </div>

    <router-link :to='{name: "redirectToUser"}' class='go-home'>↰ back to your projects</router-link>
  </div>
</template>
<script>
import Loading from './Loading.vue';
import listUsers from '../lib/streak-api/listUsers.js';

export default {
  name: 'Explorer',
  components: {
    Loading
  },
  data() {
    return {
      isLoading: true,
      users: [],
      nextCursor: null
    };
  },
  computed: {
    shouldShowStart() {
      return !!(this.$route.query && this.$route.query.pageCursor);
    }
  },
  created() {
    this.updateUsers();
  },
  watch: {
    $route(/* to */) {
      this.updateUsers();
    },
  },
  methods: {
    updateUsers() {
      this.isLoading = true;
      listUsers(this.$route.query).then(response => {
        this.isLoading = false;
        this.users = response.users;
        this.nextCursor = response.users.length > 0 ? response.pageCursor : null;
      });
    }
  }
};
</script>

<style lang='stylus' scoped>
@import '../styles/variables.styl'

.explore {
  padding:  default-padding;
}
a.user-container {
  display: inline-block;
  padding: 14px;
}
.pager {
  display: flex;
  justify-content: space-between;
  max-width: 300px;
}

.go-home {
  margin-top: 24px;
  display: inline-block;
}
</style>
