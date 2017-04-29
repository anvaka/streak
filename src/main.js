// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'keen-ui/dist/keen-ui.min.css';

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
