import View from '../view/view.js';
import Participants from '../participants-box/view.js';
import ProposalClauses from '../proposal-clauses/proposal-clauses.js';
import template from './template.jade';
import {toHTML} from '../proposal/body-serializer';

export default class ProposalArticle extends View {

  /**
   * Creates a new proposal-article view
   * from proposals object.
   *
   * @param {Object} proposal proposal's object data
   * @return {ProposalArticle} `ProposalArticle` instance.
   * @api public
   */

  constructor (proposal) {
    super();

    super(template, {
      proposal: proposal,
      charteLink: 'http://lvp.mod.bz/candidate/56deabca58810cf200ca08ed',
      baseUrl: window.location.origin,
      toHTML: toHTML
    });

    let participants = new Participants(proposal.participants || []);
    participants.appendTo(this.find('.participants')[0]);
    participants.fetch();
  }
}
