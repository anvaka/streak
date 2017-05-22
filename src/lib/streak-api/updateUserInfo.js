import { request } from './ajax.js';

export default function updateUserInfo() {
  // This is required to render list of users
  return request({
    method: 'POST',
    body: { operation: 'update-user-info' }
  });
}
