import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import ListFiles from './ListFiles.vue'
import {initializeGoogleApi} from './lib/goog.js'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: App,
    children: [
      { path: '', component: ListFiles }
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
