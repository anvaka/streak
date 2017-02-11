<template>
  <div class='dashboard'>
    <div class='projects-list'>
      <div class='projects-container'>
        <div v-if='hasProjects'>
          <div class='projects-header'>
            <h3 class='secondary'>Your Projects</h3>
            <ui-button color='green' type='secondary'> New Project </ui-button>
          </div>
          <div class='project-list'>
            <router-link v-for='project in dashboard.projects' :to='{name: "project-details", params: {id: project.id}}'>{{project.name}}</router-link>
          </div>
        </div>

        <div v-if='noProjects'>
          You don't have any projects yet. <router-link to='new-project'>Create a new project</router-link>
        </div>

        <div v-if='dashboard.loading'>
            <ui-icon-button icon="refresh" :loading="dashboard.loading" type='secondary'></ui-icon-button>
            Loading your projects...
        </div>
      </div>
    </div>
    <div class='projects-overview'>
    </div>
  </div>
</template>
<script>
import { UiButton, UiIconButton } from 'keen-ui';
import dashboard from '../lib/dashboard';

export default {
  name: 'Dashboard',
  data() {
    return {
      dashboard
    };
  },
  created () {
    dashboard.loadProjects();
  },
  computed: {
    hasProjects() {
      return !dashboard.loading && dashboard.projects.length > 0;
    },
    noProjects() {
      return !dashboard.loading && dashboard.projects.length === 0;
    }
  },
  components: {
    UiButton,
    UiIconButton,
  },
};
</script>

<style scoped lang='stylus'>
sidebar-width = 300px;

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
    font-weight: normal;
  }
}

</style>
