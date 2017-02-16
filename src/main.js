// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'keen-ui/dist/keen-ui.min.css';
import moment from 'moment';

import Vue from 'vue';
import App from './App.vue';
import router from './router';

window.moment = moment;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App },
});
