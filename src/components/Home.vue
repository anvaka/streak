<template>
  <div id='app'>
    <div class='home'>
      <div class='toolbar' >
        <div slot='brand'>
          <router-link to='/' class='logo-text'>Streak</router-link>
        </div>
        <div>
          <user-info :profile='profile' @signOut='signOut'></user-info>
        </div>
      </div>
      <loading :isLoading='loading' class='page-loading'>Signing in...</loading>
      <div class='error' v-if='error'>
        <p>Something is wrong. Try refreshing the page. If error persists, please reach out to me at <a href='mailto:anvaka@gmail.com'>anvaka@gmail.com</a>.</p>
        <pre>{{error}}</pre>
      </div>
      <div v-if='signedIn' class='router-container'>
        <router-view></router-view>
      </div>
      <div v-if='signedOut'>
        <welcome />
      </div>
    </div>
  </div>
</template>

<script>
import 'flatpickr/dist/flatpickr.css';
import Loading from './Loading.vue';
import auth from '../lib/auth';
import UserInfo from './UserInfo.vue';
import Welcome from './Welcome.vue';

export default {
  name: 'Home',

  data() {
    return auth.signInStatus;
  },

  created() {
    auth.initiateSignInStatus().then(() => {
      this.ensureOnUserPage();
    });
  },

  watch: {
    $route() {
      this.ensureOnUserPage();
    }
  },

  methods: {
    signOut() {
      auth.signOut();
    },
    ensureOnUserPage() {
      if (this.$route.name === 'redirectToUser') {
        this.$router.replace({
          name: 'userPage',
          params: {
            userId: this.userId
          }
        });
      }
    }
  },

  components: {
    Loading,
    UserInfo,
    Welcome,
  },
};
</script>

<style lang='stylus' scoped>
@import './../styles/variables.styl'

.page-loading {
  margin-left: 5px;
  margin-top: 13px;
}

#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.router-container {
  flex: 1;
  overflow-y: auto;
}

.toolbar {
  padding: default-padding;
  height: 56px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-shrink: 0;
  align-items: center;
}

.home {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.logo-text {
  color: rgba(0, 0, 0, 0.2);
  text-decoration: none;
  font-size: 24px;
}

h1, h2 {
  font-weight: normal;
  margin: 0;
}
.mui-appbar {
  display: flex;
  justify-content: space-between;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

@media only screen and (max-width: small-screen-size) {
  .toolbar {
    background-color: header-background;
  }
}
</style>
