import View from '../view/view.js';
import o from 'component-dom';
import closest from 'component-closest';
import Chart from 'chart.js';
import t from 't-component';
import debug from 'debug';
import user from '../user/user';
import candidateStore from '../candidate-store/candidate-store';
import request from '../request/request';
import Participants from '../participants-box/view.js';
import ProposalClauses from '../proposal-clauses/proposal-clauses.js';
import template from './template.jade';
import {toHTML} from '../proposal/body-serializer';
import config from '../config/config';
import { dom } from '../render/render';
import alert from './vote-alert.jade';

var log = debug("democracyos:candidate:template");


export default class ProposalArticle extends View {

  /**
   * Creates a new proposal-article view
   * from proposals object.
   *
   * @param {Object} proposal proposal's object data
   * @return {ProposalArticle} `ProposalArticle` instance.
   * @api public
   */

  constructor (proposal, charteLink) {
    super();

    super(template, {
      proposal: proposal,
      reference: proposal.url,
      charteLink: config.charteLink,
      baseUrl: window.location.origin,
      toHTML: toHTML
    });
    this.proposal = proposal;

    let participants = new Participants(proposal.participants || []);
    participants.appendTo(this.find('.participants')[0]);
    participants.fetch();
    
    if(this.proposal.firstName !== 'Charte') {
      this.bind('click', '.vote-box .direct-vote .vote-option', 'vote');
      this.on('vote', this.onvote.bind(this));
      this.on('voting', this.onvoting.bind(this));
      this.on('voteerror', this.onvoteerror.bind(this));
      this.buttonsBox = this.find('.vote-box .vote-options');
    }
  }

  vote (ev) {
    let id = this.proposal.id;

    ev.preventDefault();

    let target = ev.delegateTarget || closest(ev.target, '[data-proposal]');

    if (user.id) {
      log('casting vote for %s', id);
      this.emit('voting');

      candidateStore.vote(id).then(() => {
        this.emit('vote');
      }).catch(err => {
        this.emit('voteerror');
        log('Failed cast for %s with error: %j', id, err);
      });
    } else {
      this.find('.proposal-options p.text-mute').removeClass('hide');
    }
  }

  onvoting () {
    this.find('#voting-error').addClass('hide');
    this.find('.vote-options').addClass('hide');
    this.find('a.meta-item').addClass('hide');

    let el;

    this.unvote();
    this.proposal.publicVotes.push(user.id);
    el = dom(alert);

    var meta = this.find('.meta-data');

    meta.find('.alert').remove();

    //TODO: clear this of array handling when `dom` supports `insertBefore`
    meta[0].insertBefore(el, meta[0].firstChild);
  }

  onvoteerror () {
    this.find('.change-vote').addClass('hide');
    this.find('.vote-options').removeClass('hide');
    this.find('#voting-error').removeClass('hide');

    this.find('.meta-data').find('.alert').remove();
  }

  onvote () {
    this.find('.change-vote').removeClass('hide');

    var cast = this.find('.votes-cast em');

    var votes = this.proposal.publicVotes || [];

    cast.html(t(t('proposal-options.votes-cast', { num: votes.length || "0" })));
    this.track('vote candidate');
  }

  track (event) {
    analytics.track(event, {
      candidate: this.proposal.id
    });
  }

  unvote () {
    if (~this.proposal.publicVotes.indexOf(user.id)) {
      this.proposal.publicVotes.splice(user.id, 1);
    }
  }


  post (path, payload, fn) {
    request
    .post(path)
    .send(payload)
    .end(fn);
  }
}
