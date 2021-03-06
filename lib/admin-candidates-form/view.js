/**
 * Module dependencies.
 */

import linkTemplate from './link.jade';
import closest from 'component-closest';
import confirm from 'democracyos-confirmation';
import Datepicker from 'democracyos-datepicker';
import FormView from '../form-view/form-view.js';
import debug from 'debug';
import o from 'component-dom';
import page from 'page';
import { dom as render } from '../render/render.js';
import request from '../request/request.js';
import t from 't-component';
import template from './template.jade';
import moment from 'moment';
import Richtext from '../richtext/richtext.js';
import Toggle from 'democracyos-toggle';
import * as serializer from '../proposal/body-serializer';
import candidateStore from '../candidate-store/candidate-store';

const log = debug('democracyos:admin-candidates-form');

/**
 * Expose CandidateForm
 */

module.exports = CandidateForm;

/**
 * Creates a password edit view
 */
let created = false;

export default class CandidateForm extends FormView {

  constructor(candidate) {
    super();
    this.setLocals(candidate);
    super(template, this.locals);

    this.renderDateTimePickers();
    if (created) {
      this.messages([t('admin-candidates-form.message.onsuccess')]);
      created = false;
    }

    this.pubButton = this.find('a.make-public');
    this.privButton = this.find('a.make-private');
	this.acceptNominationButton = this.find('a.accept-nomination');

    var body = this.find('textarea[name=body]');
    new Richtext(body);
    this.renderToggles();
  }

  /**
   * Set locals for template
   */

  setLocals(candidate) {
    if (candidate) {
	  this.newCandidate = false;
      this.action = '/api/candidate/' + candidate.id;
      this.title = 'admin-candidates-form.title.edit';
      candidate.body = serializer.toHTML(candidate.clauses);
    } else {
      this.newCandidate = true;
      this.action = '/api/candidate/create';
      this.title = 'admin-candidates-form.title.create';
    }

    this.candidate = candidate;
    this.adminUrl = 'admin';

    this.locals = {
      form: { title: this.title, action: this.action },
      candidate: this.candidate || { clauses: [] },
      moment: moment
    };
  }

  /**
   * Turn on event bindings
   */

  switchOn() {
    this.bind('click', 'a.add-link', this.bound('onaddlinkclick'));
	this.bind('click', 'a.save-link', this.bound('onsavelinkclick'));
    this.bind('click', 'a.remove-link', this.bound('onremovelinkclick'));
    this.bind('click', 'a.save', this.bound('onsaveclick'));
    this.bind('click', 'a.make-public', this.bound('onmakepublicclick'));
    this.bind('click', 'a.make-private', this.bound('onmakeprivateclick'));
	this.bind('click', 'a.accept-nomination', this.bound('onacceptnominationclick'));
    this.bind('click', 'a.delete-candidate', this.bound('ondeletecandidateclick'));
    this.bind('click', '.clear-closingAt', this.bound('onclearclosingat'));
    this.on('success', this.onsuccess);
  }

  /**
   * Handle `error` event with
   * logging and display
   *
   * @param {String} error
   * @api private
   */

  onsuccess(res) {
    log('Candidate successfully saved');
    if (this.candidate) {
      candidateStore.unset(this.candidate.id).parse(res.body).then(candidate => {
        candidateStore.set(candidate.id, candidate);
      });
    }

    created = true;
    var content = o('#content')[0];
    content.scrollTop = 0;
    // Forcefully re-render the form
    page(res.body.id);
  }

  /**
   * Renders datepicker and timepicker
   * elements inside view's `el`
   *
   * @return {CandidateForm|Element}
   * @api public
   */

  renderDateTimePickers() {
    this.closingAt = this.find('[name=closingAt]', this.el);
    this.closingAtTime = this.find('[name=closingAtTime]');
    this.dp = Datepicker(this.closingAt[0]);
    return this;
  };

  onaddlinkclick(ev) {
    ev.preventDefault();

    var id = this.candidate ? this.candidate.id : null;
    if (id != null) return this.addLinkForm();

    // if no candidate, reveal message forbidden
    o('.add-link-forbidden', this.el).removeClass('hide');
  }

  onsavelinkclick(ev) {
    ev.preventDefault();

	var id = this.candidate ? this.candidate.id : null;
	if (id != null) return this.saveLink(closest(ev.target, '.candidate-link', true));

	o('.add-link-forbidden', this.el).removeClass('hide');
  }

  addLinkForm() {
    var links = o('.candidate-links', this.el);
	links.append(o(render(linkTemplate)));
  }

  saveLink(link) {
    var id = link.getAttribute('data-link');
	var linkRow = link.firstChild;
	var typeEl = linkRow.firstChild.firstChild;
	var urlEl = linkRow.childNodes[1].firstChild;
    var type = typeEl.value;
	var url = urlEl.value;
	var data = {
	  link: {
	    'id': id,
	    'url': url,
	    'type': type
	  }
	};
    request
    .post(this.action + '/link')
	.send(data)
    .end(function (err, res) {
      if (err || !res.ok) return log('Found error %o', err || res.error);
    });
  }

  onremovelinkclick(ev) {
    ev.preventDefault();

    var link = closest(ev.target, '[data-link]', true);
    var id = link ? link.getAttribute('data-link') : null;
    if (null == id) return false;

    confirm(t('admin-candidates-form.link.confirmation.title'), t('admin-candidates-form.delete-candidate.confirmation.body'))
    .cancel(t('admin-candidates-form.clause.confirmation.cancel'))
    .ok(t('admin-candidates-form.clause.confirmation.ok'))
    .modal()
    .closable()
    .effect('slide')
    .show(onconfirm.bind(this));

    function onconfirm(ok) {
      if (ok) return this.removeLink(id);
    }
  }

  onsaveclick(ev) {
    ev.preventDefault();
    this.find('form input[type=submit]')[0].click();
  }

  removeLink(id) {
    var link = o('[data-link="' + id + '"]', this.el);

    request
    .del(this.action + '/link')
    .send({ link: id })
    .end(function (err, res) {
      if (err || !res.ok) return log('Found error %o', err || res.error);
      link[0].remove();
    });
  }

  postserialize(data) {
    data = data || {};

    var links = {};
    var linksregexp = /^links\[([a-z0-9]*)\]\[([^\]]*)\]/;

    for (var key in data) {
      var isLink = linksregexp.test(key)
        && data.hasOwnProperty(key);

      if (isLink) {
        var parsed = linksregexp.exec(key);
        var id = parsed[1];
        var prop = parsed[2];
        var value = data[key];
        links[id] = links[id] || {};
        links[id][prop] = value;
        delete data[key];
      }
    }

    var linksids = Object.keys(links);
    var linksret = [];

    linksids.forEach(function(id) {
      links[id].id = id;
      linksret.push(links[id]);
    });

    data.links = linksret;

    if (data.closingAt && data.closingAtTime) {
      var d = data.closingAt + ' ' + data.closingAtTime;
      data.closingAt = new Date(d);
    }

    delete data.body;
    data.votable = data.votable || false;
    data.author = data.candidateAuthor;

    return data;
  }

  onmakepublicclick(ev) {
    ev.preventDefault();
    var view = this;

    this.pubButton.addClass('disabled');

    candidateStore
      .publish(this.candidate.id)
      .then(() => {
        view.pubButton.removeClass('disabled').addClass('hide');
        view.privButton.removeClass('hide');
      })
      .catch(err => {
        view.pubButton.removeClass('disabled');
        log('Found error %o', err);
      });
  }

  onmakeprivateclick(ev) {
    ev.preventDefault();
    var view = this;

    this.privButton.addClass('disabled');

    candidateStore
      .unpublish(this.candidate.id)
      .then(() => {
        view.privButton.removeClass('disabled');
        view.privButton.addClass('hide');
        view.pubButton.removeClass('hide');
      })
      .catch(err => {
        view.pubButton.removeClass('disabled');
        log('Found error %o', err);
      });
  }
  
  onacceptnominationclick(ev) {
    ev.preventDefault();
    var view = this;

    this.acceptNominationButton.addClass('disabled');

    candidateStore
      .acceptNomination(this.candidate.id)
      .then(() => {
        view.acceptNominationButton.removeClass('disabled').addClass('hide');
      })
      .catch(err => {
        view.acceptNominationButton.removeClass('disabled');
        log('Found error %o', err);
      });
  }

  ondeletecandidateclick(ev) {
    ev.preventDefault();

    const _t = s => t(`admin-candidates-form.delete-candidate.confirmation.${s}`);

    const onconfirmdelete = (ok) => {
      if (!ok) return;

      candidateStore.destroy(this.candidate.id)
        .then(() => { page(this.adminUrl); })
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

  onclearclosingat(ev) {
    ev.preventDefault();
    this.closingAt.value('');
    if (this.dp && this.dp.popover) {
      this.dp.popover.hide();
      this.dp = Datepicker(this.closingAt[0]);
    }
  }

  renderToggles() {
    var toggle = new Toggle();
    toggle.label('Yes', 'No');
    toggle.name('votable');
    toggle.value(this.candidate == undefined || this.candidate.votable === undefined ? true : !!this.candidate.votable);
    this.find('.votable-toggle').append(toggle.el);
  }

}
