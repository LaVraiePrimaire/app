import debug from 'debug';
import config from '../config/config';
import candidateStore from '../candidate-store/candidate-store';

const log = debug('democracyos:candidate-middlewares');

/**
 * Clear candidate store, to force a fetch to server on next call
 */

export function clearCandidateStore (ctx, next) {
  candidateStore.clear();
  next();
}

/**
 * Load private candidates from specified. 
 * Should only be used by admin modules.
 */
export function findPrivateCandidates(ctx, next) {

  let query = { draft: true };
  candidateStore.findAll(query).then(candidates => {
    ctx.candidates = candidates;
    next();
  }).catch(err => {
    if (404 !== err.status) throw err;
    log('Unable to load candidates.');
  });
}

/**
 * Load public candidates from specified
 */
export function findCandidates(ctx, next) {

  let query = {};

  candidateStore.findAll(query).then(candidates => {
    ctx.candidates = candidates;
    next();
  })
}

/**
 * Load specific candidate from context params
 */

export function findCandidate(ctx, next) {
  candidateStore
    .findOne(ctx.params.id)
    .then(candidate => {
      ctx.candidate = candidate;
      next();
    })
    .catch(err => {
      if (404 !== err.status) throw err;
      log(`Unable to load candidate for ${ctx.params.id}`);
    });
}
