import debug from 'debug';
import config from '../config/config';
import userStore from '../user-store/user-store';

const log = debug('democracyos:user-middlewares');

/**
 * Load private users from specified. 
 * Should only be used by admin modules.
 */
export function findUsers(ctx, next) {
  log("fetching all users");
  userStore.findAll().then(users => {
    ctx.users = users;
    next();
  }).catch(err => {
    if (404 !== err.status) throw err;
    log('Unable to load users.');
  });
}
