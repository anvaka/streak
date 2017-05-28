const Datastore = require('@google-cloud/datastore');
const datastore = require('./streakGraph.js').datastore;
const shortid = require('shortid');

module.exports = {
  list,
  add,
  getComment,
  reply,
};

function getComment(commentId) {
  console.log('get comment', commentId);
  const commentKey = datastore.key(['comment', commentId]);
  const commentRecord = datastore.get(commentKey).then(addId);

  const query = datastore.createQuery('reply')
    .hasAncestor(commentKey)
    .order('created', { descending: false });

  const replies = datastore.runQuery(query).then(results => {
    return addId(results[0]);
  });

  return Promise.all([commentRecord, replies]).then(res => {
    return {
      comment: res[0][0],
      replies: res[1]
    };
  });
}

function reply(info, user) {
  console.log('Adding reply', JSON.stringify({ info, user }));

  const userId = user.id;
  const { commentId, text } = info;
  if (!text || !commentId) {
    return new Promise((resolve, reject) => {
      reject('Comment text/id cannot be empty');
    });
  }

  const replyId = shortid.generate();
  const replyKey = datastore.key(['comment', commentId, 'reply', replyId]);

  // TODO: Update comment should verify user id and run it inside transaction
  // TODO: We probably want to take into account private projects?
  return datastore.save({
    key: replyKey,
    data: [{
      name: 'userId',
      value: userId
    }, {
      name: 'text',
      value: text,
      excludeFromIndexes: true
    }, {
      name: 'created',
      value: new Date()
    }]
  }).then(() => ({
    commentId,
    replyId
  }));
}

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

    return {
      comments: addId(entities),
      pageCursor: nextPage,
    };
  });
}

function addId(entities) {
  entities.forEach(e => {
    if (e) {
      const key = e[datastore.KEY];
      e.id = key.id || key.name;
    }
  });
  return entities;
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

  const commentKey = datastore.key(['comment', shortid.generate()]);

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
