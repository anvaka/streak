<template>
  <div class='dashboard'>
    <div class='projects-list'>
      <div class='projects-container'>
        <div class='projects-header'>
          <h3>Your Projects</h3>
          <ui-button color='green' type='secondary'>
            New Project
          </ui-button>
        </div>
      </div>
    </div>
    <div class='projects-overview'>
    </div>
  </div>
</template>
<script>
import { UiButton } from 'keen-ui';

export default {
  name: 'Dashboard',
  data() {
    return {};
  },
  components: {
    UiButton,
  },
};
</script>

<style scoped lang='stylus'>
sidebar-width = 300px;
secondary-text-color = rgba(black, 0.54);

.dashboard {
  position: relative;
  width: 100%;
  height: 100%;
}

.projects-overview {
  position: absolute;
  left: sidebar-width;
  top: 0;
  right: 0;
  bottom: 0;
}

.projects-list {
  position: absolute;
  width: sidebar-width;
}

.projects-container {
  padding: 7px;
}
.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  h3 {
    margin: 0;
    color: secondary-text-color;
    font-weight: normal;
  }
}

</style>
