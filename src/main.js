import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import ListFiles from './ListFiles.vue'
import CreateStreak from './CreateStreak.vue'
import Streak from './Streak.vue'
import {initializeGoogleApi} from './lib/goog.js'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: App,
    children: [
      { path: '', component: ListFiles },
      { path: 'streak/:id', component: Streak },
      { path: 'create-streak', component: CreateStreak }
    ]
  }
]

const router = new VueRouter({
  routes
})

new Vue({
  router
}).$mount('#app')

initializeGoogleApi()
