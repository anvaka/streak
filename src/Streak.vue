<template>
<div>
  <h3>Streak will be here</h3>
  <h4>TODO: Implement me</h4>
</div>
</template>

<script>
import appModel from './lib/appModel.js'

export default {
  beforeRouteEnter(from, to, next) {
    next(_ => {
      appModel.pageName = 'Streak'
    })
  }
}
</script>
