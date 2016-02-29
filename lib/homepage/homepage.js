import bus from 'bus';
import debug from 'debug';
import page from 'page';
import dom from 'component-dom';
import { domRender } from '../render/render';
import user from '../user/user';
import noCandidates from './no-candidates.jade';
import createFirstCandidate from './create-first-candidate.jade';
import visibility from '../visibility/visibility';
import config from '../config/config';
import { findCandidates, clearCandidateStore } from '../candidate-middlewares/candidate-middlewares';
import candidateStore from '../candidate-store/candidate-store';
import candidateFilter from '../candidate-filter/candidate-filter';
import title from '../title/title';
import { show as showCandidate } from '../candidate/candidate';

const log = debug('democracyos:homepage');

function initHomepage(ctx, next) {
  document.body.classList.add('browser-page');
  dom('#browser .app-content, #content').empty();
  next();
}

page('/',
  initHomepage,
  clearCandidateStore,
  user.optional,
  visibility,
  findCandidates,
  (ctx, next) => {
    let candidate = candidateFilter.filter(ctx.candidates)[0];

    if (!candidate) {
      let content = dom('#browser .app-content');
      content.append(domRender(noCandidates));

      if (user.isAdmin()) content.append(domRender(createFirstCandidate, {
        url: 'admin/candidates/create'
      }));

      bus.once('page:change', () => {
        document.body.classList.remove('browser-page');
      });

      bus.emit('page:render');
      return;
    }

    title(null);

    log(`render candidate ${candidate.id}`);

    let path;
    path = `/candidate/${candidate.id}`;

    candidateStore.findOne(candidate.id).then(showCandidate);
  }
);
