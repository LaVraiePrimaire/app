/**
 * Module dependencies.
 */

import debug from 'debug';
import t from 't-component';
import template from './template.jade';
import userStore from '../user-store/user-store';
import List from 'democracyos-list.js';
import moment from 'moment';
import confirm from 'democracyos-confirmation';
import View from '../view/view';

const log = debug('democracyos:admin-users');

/**
 * Creates a list view of users 
 */

export default class UsersListView extends View {
  constructor(users) {
    super(template, { users, moment});
  }

  switchOn() {
    HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
    var banButtons = document.getElementsByClassName("ban-user");
    var unbanButtons = document.getElementsByClassName("unban-user");
    var deleteButtons = document.getElementsByClassName("delete-user");
    var self = this;
    for (var button of banButtons) {
        button.onclick = function() { 
            var btnUser = this.parentElement.getAttribute('data-userid');
            self.banUser(btnUser); 
        };
    }
    for (var button of deleteButtons) {
        button.onclick = function() { 
            var btnUser = this.parentElement.getAttribute('data-userid');
            self.deleteUser(btnUser); 
        };
    }
    for (var button of unbanButtons) {
        button.onclick = function() { 
            var btnUser = this.parentElement.getAttribute('data-userid');
            self.unbanUser(btnUser); 
        };
    }
    this.list = new List('users-wrapper', { valueNames: ['user-name', 'user-email', 'user-ip', 'user-phone', 'user-zip'] });
  }

  banUser(id) {
    const _t = s => t(`admin-users-form.ban-user.confirmation.${s}`);

    const onconfirmban = (ok) => {
      if (!ok) return;

      userStore.ban(id)
        .catch(err => { log('Found error %o', err); });
    };

    confirm(_t('title'), _t('body'))
      .cancel(_t('cancel'))
      .ok(_t('ok'))
      .modal()
      .closable()
      .effect('slide')
      .show(onconfirmban);
  }

  unbanUser(id) {
    const _t = s => t(`admin-users-form.unban-user.confirmation.${s}`);

    const onconfirmunban = (ok) => {
      if (!ok) return;

      userStore.unban(id)
        .catch(err => { log('Found error %o', err); })
    };

    confirm(_t('title'), _t('body'))
      .cancel(_t('cancel'))
      .ok(_t('ok'))
      .modal()
      .closable()
      .effect('slide')
      .show(onconfirmunban);
  }

  deleteUser(id) {
    const _t = s => t(`admin-users-form.delete-user.confirmation.${s}`);

    const onconfirmdelete = (ok) => {
      if (!ok) return;

      userStore.destroy(id)
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
