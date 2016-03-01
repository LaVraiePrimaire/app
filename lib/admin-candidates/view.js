/**
 * Module dependencies.
 */

import debug from 'debug';
import t from 't-component';
import template from './template.jade';
import candidateStore from '../candidate-store/candidate-store';
import List from 'democracyos-list.js';
import moment from 'moment';
import confirm from 'democracyos-confirmation';
import View from '../view/view';

const log = debug('democracyos:admin-candidates');

/**
 * Creates a list view of candidates
 */

export default class CandidatesListView extends View {
  constructor(candidates) {
    super(template, { candidates, moment});
  }

  switchOn() {
    this.bind('click', '.btn.delete-candidate', this.bound('ondeletecandidateclick'));
    this.list = new List('candidates-wrapper', { valueNames: ['candidate-title', 'candidate-id', 'candidate-date'] });
  }

  ondeletecandidateclick(ev) {
    ev.preventDefault();
    const el = ev.target.parentElement.parentElement;
    const candidateId = el.getAttribute('data-candidateid');

    const _t = s => t(`admin-candidates-form.delete-candidate.confirmation.${s}`);

    const onconfirmdelete = (ok) => {
      if (!ok) return;

      candidateStore.destroy(candidateId)
        .catch(err => { log('Found error %o', err); });
    };

    confirm(_t('title'), _t('body'))
      .cancel(_t('cancel'))
      .ok(_t('ok'))
      .modal()
      .closable()
      .effect('slide')
      .show(onconfirmdelete);
  }
}
