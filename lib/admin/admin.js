/**
 * Module dependencies.
 */

import bus from 'bus';
import config from '../config/config';
import template from './admin-container.jade';
import Sidebar from '../admin-sidebar/admin-sidebar';
import CandidatesListView from '../admin-candidates/view';
import CandidateForm from '../admin-candidates-form/view';
import user from '../user/user';
import { dom as render } from '../render/render';
import title from '../title/title';
import candidateStore from '../candidate-store/candidate-store';
import page from 'page';
import o from 'component-dom';
import { findPrivateCandidates, findCandidate } from '../candidate-middlewares/candidate-middlewares';

page('/admin/*',
  valid,
  user.required,
  user.hasAccessToAdmin,
  (ctx, next) => {
    let section = ctx.section;
    let container = render(template);

    // prepare wrapper and container
    o('#content').empty().append(container);

    // set active section on sidebar
    ctx.sidebar = new Sidebar();
    ctx.sidebar.set(section);
    ctx.sidebar.appendTo(o('.sidebar-container', container)[0]);

    // Set page's title
    title();

    // if all good, then jump to section route handler
    next();
  }
);

page('/admin', function() {
  page.redirect('/admin/candidates/');
});

page('/admin/candidates/', findPrivateCandidates, ctx => {
  let currentPath = ctx.path;
  let candidatesList = new CandidatesListView(ctx.candidates);
  candidatesList.replace('.admin-content');
  ctx.sidebar.set('candidates');

  const onCandidatesUpdate = () => { page(currentPath); };
  bus.once('candidate-store:update:all', onCandidatesUpdate);
  bus.once('page:change', () => {
    bus.off('candidate-store:update:all', onCandidatesUpdate);
  });
});

page('/admin/candidates/create', ctx => {
  ctx.sidebar.set('candidates');
  // render new candidate form
  let form = new CandidateForm(null);
  form.replace('.admin-content');
  form.once('success', function() {
    candidateStore.findAll();
  });
});

page('/admin/candidates/:id', findCandidate, ctx => {
  // force section for edit
  // as part of list
  ctx.sidebar.set('candidates');

  // render candidate form for edition
  let form = new CandidateForm(ctx.candidate);
  form.replace('.admin-content');
  form.on('success', function() {
    candidateStore.findAll();
  });
});

if (config.usersWhitelist) {
  require('../admin-whitelists/admin-whitelists.js');
  require('../admin-whitelists-form/admin-whitelists-form.js');
}

/**
 * Check if page is valid
 */

function valid(ctx, next) {
  let section = ctx.section = ctx.params[0];
  if (/candidates|users/.test(section)) return next();
  if (/candidates|users\/create/.test(section)) return next();
  if (/candidates|users\/[a-z0-9]{24}\/?$/.test(section)) return next();
}
