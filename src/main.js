// Welcome to the streak app. This is the entry point.

import Vue from 'vue';
import Home from './components/Home.vue';
import router from './router';
import './styles/styles.styl';

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<Home/>',
  components: { Home },
});
