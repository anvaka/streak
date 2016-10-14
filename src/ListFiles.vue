<template>
  <div>
    <div v-if='empty'>
      <h3>No streak sheets?</h3>
      <p>I could not find any Streak in your account. <a v-link="{path: '/create-streak'}">Create new streak</a>.
      </p>
    </div>
    <div v-if='filesLoaded && !empty'>
      <h4>Your Streaks</h4>
      <div class='collection'>
        <router-link :to="{path: '/streak/' + file.id}" class='collection-item' v-for='file in files'>{{file.name}}</router-link>
      </div>
      <div class='fixed-action-btn'>
        <router-link class='btn-floating btn-small red' :to="{path: '/create-streak'}" title='Create new streak'>
          <i class='small material-icons'>add</i>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import appModel from './lib/appModel.js'

export default {
  data() {
    return appModel
  },

  beforeRouteEnter(to, from, next) {
    next(_ => {
      appModel.pageName = 'Select Streak'
    })
  },

  computed: {
    empty() {
      return appModel.files.length === 0 && appModel.filesLoaded
    }
  }
}
</script>
