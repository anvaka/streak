<template>
  <div class='dashboard'>
    <div class='projects-list'>
      <div class='projects-container'>
        <div v-if='hasProjects'>
          <div class='projects-header'>
            <h3 class='secondary'>Your Projects</h3>
          </div>
          <div class='project-list'>
            <router-link class='project-link'
              v-for='project in dashboard.projects' :to='{name: "project-details", params: {projectId: project.id}}'
              :class='{ current: projectId === project.id }'
              >{{project.name}}</router-link>
          </div>
          <div>
            <router-link to='new-project'>Start new project</router-link>
          </div>
        </div>

        <div v-if='noProjects'>
          You don't have any projects yet. <router-link to='new-project'>Start a new project</router-link>
        </div>

        <div v-if='dashboard.loading'>
            <ui-icon-button icon="refresh" :loading="dashboard.loading" type='secondary'></ui-icon-button>
            Loading your projects...
        </div>
      </div>
    </div>
    <div class='projects-overview'>
      {{projectId}}
    </div>
  </div>
</template>
<script>
import { UiButton, UiIconButton } from 'keen-ui';
import dashboard from '../lib/dashboard';

export default {
  name: 'Dashboard',
  props: ['projectId'],
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
@import '../styles/variables.styl'

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

.project-link {
  text-decoration: none;
  color: secondary-text-color;
  line-height: 24px;
}

.project-link.current {
  color: black;
  font-weight: bold;
}

.projects-list {
  position: absolute;
  width: sidebar-width;
}
.project-list {
  display: flex;
  flex-direction: column;
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
