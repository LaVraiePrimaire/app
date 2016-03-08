/**
 * Module dependencies
 */

import confirm from 'democracyos-confirmation';
import FormView from '../form-view/form-view.js';
import debug from 'debug';
import o from 'component-dom';
import page from 'page';
import { dom as render } from '../render/render.js';
import request from '../request/request.js';
import t from 't-component';
import template from './template.jade';
import moment from 'moment';

const log = debug('democracyos:admin-candidates-form');

module.exports = NominateForm;

export default class NominateForm extends FormView {

    constructor(user) {
        super();
        this.setLocals(user);
        super(template, this.locals);
        console.log("render nominate form");
    }

    setLocals(user) {
        this.user = user;
        this.title = 'nominate-form.title';
        this.action = '/nominate';
        this.locals = {
            form: { title: this.title, action: this.action },
            user: this.user,
            moment: moment
        };
    }

    switchOn() {
        this.bind('click', 'a.send', this.bound('onsendclick'));
        this.bind('click', 'label.third-party', this.bound('onthirdpclick'));
        this.bind('click', 'label.self', this.bound('onselfclick'));
        this.on('success', this.onsuccess);
    }

    onthirdpclick() {
        o('.form-group.not-for-self').removeClass('hide');
        console.log('third party candidate');
    }

    onselfclick() {
        o('.form-group.not-for-self').addClass('hide');
        console.log('self candidate');
    }

    onsuccess(res) {
        log('Candidate succesfully nominated');
        page('/');
    }

    onsendclick(ev) {
        ev.preventDefault();
        this.find('form input[type=submit]')[0].click();
    }

}
