import { request } from './ajax.js';
import { getUsers } from './users';

// maps from projectId -> Map<pageId>-> comment response
const cachedComments = new Map();

// Comments: [Comment,...]
// Comment: {
//  commentId,
//  projectId,
//  author: userId,
//  created: timestamp
//  modified: timestamp
// }

export function addComment(projectId, text) {
  if (!projectId) throw new Error('project id is required');
  if (!text) throw new Error('Comment text is required');

  invalidateProjectCommentCache(projectId);

  // For now this is just fire and forget call.
  return request({
    method: 'POST',
    body: {
      projectId,
      text,
      operation: 'add-project-comment',
    }
  });
}

export function listComments(projectId, pageCursor) {
  if (!projectId) throw new Error('project id is required');
  let comments = cachedComments.get(projectId);
  if (!comments) {
    comments = new Map();
    cachedComments.set(projectId, comments);
  }

  const cachedComment = comments.get(pageCursor);
  if (cachedComment) return new Promise(resolve => resolve(cachedComment));

  return request({
    method: 'GET',
    qs: {
      projectId,
      pageCursor,
      operation: 'list-project-comments',
    }
  }).then(res => JSON.parse(res))
  .then(res => {
    const response = {
      comments: res.comments.map(toViewModel),
      pageCursor: res.pageCursor
    };
    injectUsers(response.comments);

    comments.set(pageCursor, response);

    return response;
  });
}

function invalidateProjectCommentCache(projectId) {
  cachedComments.delete(projectId);
}

function injectUsers(commentsArray) {
  const usersToFetch = new Set();
  commentsArray.forEach(comment => {
    usersToFetch.add(comment.author.id);
  });

  getUsers(Array.from(usersToFetch)).then(response => {
    const userInfoLookup = new Map();
    response.forEach(user => {
      userInfoLookup.set(user.id, user);
    });
    return userInfoLookup;
  }).then(userInfoLookup => {
    commentsArray.forEach((comment) => {
      const u = userInfoLookup.get(comment.author.id);
      comment.author.name = u.name;
    });
  });
}

function toViewModel(comment) {
  return {
    id: comment.id,
    text: comment.text,
    created: new Date(comment.created).toLocaleString(),
    author: {
      id: comment.userId,
      name: ''
    }
  };
}
