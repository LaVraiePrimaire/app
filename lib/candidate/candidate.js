import o from 'component-dom';
import bus from 'bus';
import debug from 'debug';
import page from 'page';
import title from '../title/title';
import { findCandidates, findCandidate } from '../candidate-middlewares/candidate-middlewares';
import sidebar from '../sidebar/sidebar';
import user from '../user/user';
import Article from '../proposal-article/proposal-article';
import Options from '../proposal-options/proposal-options';
import Comments from '../comments-view/view';
import locker from '../browser-lock/locker';

const log = debug('democracyos:candidate:page');

export function show (candidate) {
  analytics.track('view candidate', { candidate: candidate.id });
  bus.emit('page:render', candidate.id);

  const appContent = o('section.app-content');

  sidebar.select(candidate.id);

  // Clean page's content
  o('#content').empty();
  appContent.empty();

  // Build article's content container
  // and render to section.app-content
  let article = new Article(candidate);
  article.appendTo(appContent);

  // Build article's comments, feth them
  // and render to section.app-content
  let comments = new Comments(candidate);
  comments.appendTo(appContent);
  comments.initialize();

  o(document.body).addClass('browser-page');

  bus.once('page:change', pagechange);
  function pagechange(url) {
    // restore page's original title
    title();

    // lock article's section
    locker.lock();

    // hide it from user
    appContent.addClass('hide');

    // once render, unlock and show
    bus.once('page:render', function() {
      locker.unlock();
      appContent.removeClass('hide');
    });

    // scroll to top
    o('section#browser').scrollTop = 0;

    o(document.body).removeClass('browser-page');
  }
}

page('/candidate/:id', user.optional, findCandidates, findCandidate, (ctx, next) => {
  log(`rendering Candidate ${ctx.params.id}`);

  if (!ctx.candidate) {
    log('Candidate %s not found', ctx.params.id);
    return next();
  }

  show(ctx.candidate);

  title(ctx.candidate.fullName);

  log('render %s', ctx.params.id);
});
