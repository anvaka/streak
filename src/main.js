// Welcome to the streak app. This is the entry point.

import { createApp } from 'vue';
import Home from './components/Home.vue';
import router from './router';
import './styles/styles.styl';

createApp(Home).use(router).mount('#app');
