/**
 * Module Dependencies
 */

var api = require('lib/db-api');
var config = require('lib/config');
var utils = require('lib/utils');
var log = require('debug')('democracyos:is-owner');

var hasAccess = utils.staff;

module.exports.hasAccess = hasAccess;
