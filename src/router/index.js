import Vue from 'vue';
import Router from 'vue-router';
import Home from '../components/Home.vue';
import Dashboard from '../components/Dashboard.vue';
import AddRecordContainer from '../components/AddRecordContainer.vue';
import NewProject from '../components/NewProject.vue';
import ProjectDetails from '../components/ProjectDetails.vue';

Vue.use(Router);

export default new Router({
  routes: [{
    path: '/',
    component: Home,
    children: [{
      path: '',
      name: 'dashboard',
      component: Dashboard,
      props: true
    }, {
      path: 'new-project',
      name: 'new-project',
      component: NewProject
    }, {
      path: 'project/:projectId',
      component: Dashboard,
      props: true,
      children: [{
        path: '',
        name: 'project-details',
        component: ProjectDetails,
        props: true
      }, {
        path: 'add',
        name: 'add-record',
        component: AddRecordContainer,
        props: true
      }]
    }
    ]
  }],
});
