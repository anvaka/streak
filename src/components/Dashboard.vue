<template>
  <div class='dashboard'>
    <div v-if='noProjects'>
      You don't have any projects yet. <router-link to='new-project'>Start a new project</router-link>
    </div>

    <div class='projects-overview'>
      <router-view></router-view>
    </div>

    <div class='projects-list-container' :class='{expanded: projectsListExpanded}'>
      <div v-if='hasProjects'>
        <div class='projects-header' @click.prevent='toggleProjectLists'>
          <h2>Your Projects <span class='toggle-list' v-if='canHide'>{{projectsListExpanded ? "hide" : "show"}}</span></h2>
        </div>
        <div class='project-list'>
            <router-link class='project-link'
              v-for='project in dashboard.projects' :to='{name: "project-details", params: {projectId: project.id}}'
              :class='{ current: projectId === project.id }'
              >{{project.name}}</router-link>
        </div>
        <div>
          <router-link :to='{name: "new-project"}' class='start-new-project'>Start new project</router-link>
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
      dashboard,
      // If there is no project ID, we are looking at home page
      projectsListExpanded: this.projectId === undefined
    };
  },
  created () {
    dashboard.loadDashboard();
  },

  watch: {
    $route(to) {
      // TODO: this doesn't work very well, if you click on the same project.
      // if we clicked on the "Home" folder, the name is not projects anymore
      this.projectsListExpanded = to.name === 'dashboard';
    }
  },
  computed: {
    canHide () {
      // Only shouw hide button when on project details view
      return this.$route.name === 'project-details';
    },

    hasProjects() {
      return !dashboard.loading && dashboard.projects.length > 0;
    },
    noProjects() {
      return !dashboard.loading && dashboard.projects.length === 0;
    }
  },
  methods: {
    toggleProjectLists() {
      this.projectsListExpanded = !this.projectsListExpanded;
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
  right: 0;
  top: 0;
  padding-top: 56px;
  overflow-y: auto;
  position: absolute;
  -webkit-overflow-scrolling: touch;
}

.project-link {
  color: secondary-text-color;
  line-height: 24px;
  font-size: 18px;
  display: inline-block;
  padding-top: 6px;
  padding-bottom: 7px;
}

.project-link.current {
  color: black;
  font-weight: bold;
}

.project-list {
  display: flex;
  flex-direction: column;
}

.projects-list-container {
  position: absolute;
  width: sidebar-width;
  .start-new-project {
    font-size: 14px;
    color: action-color;
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
    font-size: 14px;
    color: rgba(0, 0, 0, 0.4);
  }
}
.toggle-list {
  display: none;
}

@media only screen and (max-width: small-screen-size) {
  .projects-list-container {
    width: 100%;
    height: 100%;
    padding-top: 12px;
    bottom: 0;
    overflow-y: auto;
    background: screen-background;
    display: none;
  }
  .projects-list-container.expanded {
    top: 50px;
    display: block;
  }

  .projects-overview {
    left: 0;
    top: 55px;
    bottom: 0;
    padding: 7px;
  }
  .toggle-list {
    display: inline-block;
    font-size: 14px;
    color: action-color;
  }
}

</style>
