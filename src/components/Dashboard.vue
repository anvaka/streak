<template>
  <div class='dashboard'>
    <div class='projects-list'>
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

    <div v-if='noProjects'>
      You don't have any projects yet. <router-link to='new-project'>Start a new project</router-link>
    </div>

    <div class='projects-overview'>
      <router-view></router-view>
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
  line-height: 28px;
  font-size: 18px;
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
  padding: 0 7px 7px 7px;
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
  .projects-list {
    width: 100%;
    height: 100px;
    overflow-y: auto;
  }
  .projects-overview {
    left: 0;
    top: 100px;
  }
}

</style>
