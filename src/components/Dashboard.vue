<template>
  <div class='dashboard'>
    <div v-if='noProjects'>
      You don't have any projects yet. <router-link to='new-project'>Start a new project</router-link>
    </div>

    <div class='projects-overview'>
      <router-view></router-view>
    </div>

    <div class='projects-container'>
      <div v-if='hasProjects'>
        <div class='projects-header'>
          <h2>Your Projects</h2>
        </div>
        <div class='project-list'>
          <router-link class='project-link'
            v-for='project in dashboard.projects' :to='{name: "project-details", params: {projectId: project.id}}'
            :class='{ current: projectId === project.id }'
            >{{project.name}}</router-link>
        </div>
        <div>
          <router-link to='new-project' class='start-new-project'>Start new project</router-link>
        </div>
      </div>

      <div v-if='dashboard.loading'>
          <ui-icon-button icon="refresh" :loading="dashboard.loading" type='secondary'></ui-icon-button>
          Loading your projects...
      </div>
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
    dashboard.loadDashboard();
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
  flex: 1;
}

.projects-overview {
  left: sidebar-width;
  bottom: 0;
  top: 56px;
  position: absolute;
}

.project-link {
  text-decoration: none;
  color: secondary-text-color;
  line-height: 28px;
  font-size: 18px;
}

.project-link.current {
  color: black;
  font-weight: bold;
}

.project-list {
  display: flex;
  flex-direction: column;

}

.projects-container {
  position: absolute;
  width: sidebar-width;
  .start-new-project {
    font-size: 12px;
    text-decoration: none;
    color: secondary-text-color;
    display: inline-block;
    margin-top: 22px;
  }
}

.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  h2 {
    margin: 0;
    font-weight: normal;
    font-size: 1.5rem;
    color: rgba(0, 0, 0, 0.4);
  }
}

@media only screen and (max-width: 560px) {
  .projects-container {
    width: 100%;
    height: 50px;
    padding-top: 12px;
    bottom: 0;
    overflow-y: auto;
  }
  .projects-overview {
    left: 0;
    top: 55px;
    bottom: 50px;
    padding: 7px;
  }
}

</style>
