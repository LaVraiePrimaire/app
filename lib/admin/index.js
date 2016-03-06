/**
 * Module dependencies.
 */

var express = require('express');
var utils = require('lib/utils');
var restrict = utils.restrict;
var log = require('debug')('democracyos:admin');
var t = require('t-component');
var config = require('lib/config');

/**
 * Exports Application
 */

var app = module.exports = express();

app.get('/admin', require('lib/layout'));
app.get('/admin/users', require('lib/layout'));
app.get('/admin/candidates', require('lib/layout'));
app.get('/admin/candidates/:id', require('lib/layout'));
app.get('/admin/candidates/create', require('lib/layout'));
