<template>
  <div class='home'>
    <ui-toolbar text-color="white" brand='Streak' title='Projects' type='colored'>
      <div slot='icon'>
      </div>
      <div slot='actions'>
        <user-info :profile='profile' @signOut='signOut'></user-info>
      </div>

    </ui-toolbar>
  </div>
</template>

<script>
import { UiToolbar } from 'keen-ui';
import auth from '../lib/auth';
import UserInfo from './UserInfo.vue';

export default {
  name: 'hello',

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
