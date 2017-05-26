const test = require('tap').test;
const createUserModel = require('./lib/create-user.js');
const rp = require('./lib/rp.js');

test('it can update user info', t => {
  const userName = 'john smith 1';
  const userPicture = 'www.site.com/picture.png';
  const user = createUserModel(userName, userPicture);

  createUserRequest(user)
  .then(() => rp('get', {
    qs: {
      id_token: user,
      operation: 'list-all-users'
    }
  })).then(response => {
    const ourUserIsHere = response.users.find(u => {
      return u.name === userName && u.picture === userPicture;
    });

    t.ok(ourUserIsHere, 'User info updated');

    t.end();
  })
  .catch(err => {
    t.fail(err);
  });
});

function createUserRequest(user) {
  return rp('post', {
    qs: { id_token: user },
    form: { operation: 'update-user-info' }
  });
}

test('it can update project info', t => {
  const user = createUserModel('Anna Bella');

  const project = {
    projectId: 'anna_project_1',
    name: 'my project',
    description: 'simple project',
    isPublic: true
  };

  setProjectPublic(project, true)
  .then(listProjects)
  .then(response => {
    t.equals(response.user.name, user.data.name, 'user name is correct');
    t.equals(response.user.id, user.id, 'project owner is correct');
    t.equals(response.projects.length, 1, 'number of projects is correct');
    const myProject = response.projects[0];

    t.equals(myProject.id, project.projectId, 'project id is valid');
    t.equals(myProject.data.name, project.name, 'project name is avlid');
    t.equals(myProject.data.description, project.description, 'project description is valid');
  })
    // Now lets remove this project from public
  .then(() => setProjectPublic(project, false))
  .then(listProjects)
  .then(response => {
    t.equals(response.user.name, user.data.name, 'user name is still here');
    t.equals(response.user.id, user.id, 'project owner is still correct');
    t.equals(response.projects.length, 0, 'no public projects');

    t.end();
  });

  function setProjectPublic(project, isPublic) {
    const form = Object.assign({
      operation: 'set-project-public',
    }, project);
    form.isPublic = isPublic;

    return rp('post', {
      form,
      qs: { id_token: user }
    });
  }

  function listProjects() {
    return rp('get', {
      qs: {
        id_token: user,
        operation: 'list-projects',
        userId: user.id
      }
    });
  }
});

test('it can list specific users', (t) => {
  const userModels = [];
  const userLookup = new Map();
  for (let i = 0; i < 5; ++i) {
    const model = createUserModel('user' + i, 'http://user' + i);
    userLookup.set(model.id, model);
    userModels.push(model);
  }

  Promise.all(userModels.map(createUserRequest))
  .then(() => {
    return getSpecificUsers([userModels[0].id, userModels[3].id]);
  }).then(users => {
    t.equals(users.length, 2, 'both users are here');
    users.forEach(assertPresent);
    t.end();
  });

  function assertPresent(user) {
    const ourUser = userLookup.get(user.id);
    t.ok(ourUser, 'user is found');
    t.equals(user.name, ourUser.data.name, 'name is ok');
    t.equals(user.picture, ourUser.data.picture, 'picture is ok');
  }

  function getSpecificUsers(userIds) {
    return rp('get', {
      qs: {
        id_token: userModels[0],
        operation: 'list-specific-users',
        users: JSON.stringify(userIds)
      }
    });
  }
});

test('it can add comments', (t) => {
  const user = createUserModel('anvaka');
  const comment = {
    projectId: 'project-1',
    text: 'hello world',
  };

  addComment(comment)
    .then(() => listComments('project-1'))
    .then(c => {
      t.equals(c.comments.length, 1, 'One comment is here');
      t.equals(c.comments[0].text, comment.text, 'Comment text is valid');
      t.equals(c.comments[0].projectId, comment.projectId, 'project is valid');
      t.equals(c.comments[0].userId, user.id, 'user is valid');
      t.ok(c.comments[0].id !== undefined, 'comment id is here');
      t.ok(c.comments[0].created !== undefined, 'created date here');
      t.end();
    });

  function addComment(comment) {
    return rp('post', {
      form: comment,
      qs: {
        id_token: user,
        operation: 'add-project-comment',
      }
    });
  }

  function listComments(projectId) {
    return rp('get', {
      qs: {
        projectId,
        id_token: user,
        operation: 'list-project-comments',
      }
    });
  }
});

