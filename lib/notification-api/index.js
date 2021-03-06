/**
 * Module dependencies.
 */

var express = require('express');
var utils = require('lib/utils');
var accepts = require('lib/accepts');
var restrict = utils.restrict;
var pluck = utils.pluck;
var expose = utils.expose;
var log = require('debug')('democracyos:candidate');
var utils = require('lib/utils');
var api = require('lib/db-api');

var app = module.exports = express();
var _handleError = utils._handleError;
var notification = api.notification;

/**
 * Limit request to json format only
 */

app.use(accepts('application/json'));

var keys = ['id type user candidate relatedUser comment text translationKey url createdAt'].join(' ');

app.get('/notification/all', restrict, function (req, res, next) {
  notification
    .all(req.user)
    .then(function (notifications) {
      console.log('Delivering notifications %j', pluck(notifications, 'id'));
      res.json(notifications.map(expose(keys)));
    })
    .catch(function (err) {
      _handleError(err, req, res);
    })
});
