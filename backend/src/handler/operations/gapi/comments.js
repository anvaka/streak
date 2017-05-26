const Datastore = require('@google-cloud/datastore');
const datastore = require('./streakGraph.js').datastore;

module.exports = {
  list,
  add
};

function list(projectId, pageCursor) {
  // TODO: Probably want to check permissions
  const query = datastore.createQuery('comment')
      .order('created', { descending: true })
      .filter('projectId', '=', projectId)
      .limit(20);

  if (pageCursor) {
    query.start(pageCursor);
  }

  return datastore.runQuery(query).then(results => {
    const entities = results[0];
    const info = results[1];
    let nextPage = null;
    if (info.moreResults !== Datastore.NO_MORE_RESULTS) {
      nextPage = info.endCursor;
    }

    entities.forEach(comment => {
      comment.id = comment[datastore.KEY].id;
    });

    return {
      comments: entities,
      pageCursor: nextPage,
    };
  });
}

function add(commentInfo, user) {
  console.log('Adding comment', JSON.stringify({ commentInfo, user }));

  const userId = user.id;
  const { projectId, text } = commentInfo;
  if (!text) {
    return new Promise((resolve, reject) => {
      reject('Comment text cannot be empty');
    });
  }

  const commentKey = datastore.key(['comment']);

  // TODO: Update comment should verify user id and run it inside transaction
  // TODO: We probably want to take into account private projects?
  return datastore.save({
    key: commentKey,
    data: [{
      name: 'userId',
      value: userId
    }, {
      name: 'projectId',
      value: projectId
    }, {
      name: 'text',
      value: text,
      excludeFromIndexes: true
    }, {
      name: 'created',
      value: new Date()
    }]
  }).then(() => {});
}
