/**
 * Module dependencies
 */

import bus from 'bus';
import config from '../config/config';
import template from './nominate-container.jade';
import NominateForm from './nominate-form';
import { dom as render } from '../render/render';
import title from '../title/title';
import page from 'page';
import user from '../user/user';
import o from 'component-dom';

import sidebar from '../sidebar/sidebar';

page('/nominate',
  user.required,
  (ctx, next) => {
      let container = render(template);
      o('#content').empty().append(container);
      sidebar.render('.sidebar-container');
      sidebar.select('nominate');
      
      title();
      let form = new NominateForm(ctx.user);
      form.replace('.nominate-content');

  });
