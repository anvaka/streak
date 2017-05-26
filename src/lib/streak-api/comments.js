import { request } from './ajax.js';

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
  return request({
    method: 'GET',
    qs: {
      projectId,
      pageCursor,
      operation: 'list-project-comments',
    }
  }).then(res => JSON.parse(res));
}
