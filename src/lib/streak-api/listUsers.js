import { get } from './ajax.js';

export default function listUsers(query) {
  const qs = Object.assign({}, query, {
    operation: 'list-users'
  });

  return get(qs).then(usersList => {
    return JSON.parse(usersList);
  });
}
