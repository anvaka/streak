<template>
  <div id='app'>
    <div class='home'>
      <ui-toolbar type='clear' :raised='false' :removeBrandDivider='true'>
        <div slot='brand'>
          <router-link to='/' class='logo-text'>Streak</router-link>
        </div>
        <div slot='icon'>
        </div>
        <div slot='actions'>
          <user-info :profile='profile' @signOut='signOut'></user-info>
        </div>
      </ui-toolbar>
      <loading :isLoading='loading'></loading>
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
import { UiToolbar } from 'keen-ui';
import Loading from './Loading.vue';
import auth from '../lib/auth';
import UserInfo from './UserInfo.vue';
import Welcome from './Welcome.vue';

export default {
  name: 'Home',

  data() {
    return auth.signInStatus;
    // return {
    //   profile: auth.signInStatus.profile
    // };
  },

  created() {
    console.log('created');
    this.loading = true;
    this.error = null;
    auth.initiateSignInStatus();
  },

  methods: {
    signOut() {
      auth.signOut();
    }
  },

  components: {
    Loading,
    UserInfo,
    UiToolbar,
    Welcome,
  },
};
</script>

<style lang='stylus' scoped>
@import './../styles/variables.styl'

.loading {
  padding-left: 7px;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.router-container {
  width: 100%;
  height: 100%;
}

.ui-toolbar {
  padding: default-padding;
  .ui-toolbar__brand {
    min-width: initial;
  }
}

.home {
  display: flex;
  flex-direction: column;
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
</style>
