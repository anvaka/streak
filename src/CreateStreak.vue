<template>
<div>
  <h3>Create new Streak</h3>
  <h4>TODO: Implmenet me</h4>
</div>
</template>

<script>
import appModel from './lib/appModel.js'

export default {
  beforeRouteEnter(from, to, next) {
    next(_ => {
      appModel.pageName = 'Create a Streak'
    })
  }
}
</script>
