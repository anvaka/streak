<template>
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
    <router-view></router-view>
  </div>
</template>

<script>
import { UiToolbar } from 'keen-ui';
import auth from '../lib/auth';
import UserInfo from './UserInfo.vue';

export default {
  name: 'Home',

  data() {
    return {
      profile: auth.signInStatus.profile
    };
  },

  methods: {
    signOut() {
      auth.signOut();
    }
  },

  components: {
    UserInfo,
    UiToolbar
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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

a {
  color: #42b983;
}
</style>
