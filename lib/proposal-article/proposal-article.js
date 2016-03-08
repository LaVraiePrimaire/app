import View from '../view/view.js';
import Participants from '../participants-box/view.js';
import ProposalClauses from '../proposal-clauses/proposal-clauses.js';
import template from './template.jade';
import {toHTML} from '../proposal/body-serializer';
import config from '../config/config';


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
      charteLink: config.charteLink,
      baseUrl: window.location.origin,
      toHTML: toHTML
    });

    console.log(config.charteLink);
    let participants = new Participants(proposal.participants || []);
    participants.appendTo(this.find('.participants')[0]);
    participants.fetch();
  }
}
