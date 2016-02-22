/**
 * Module dependencies.
 */

var express = require('express');

/**
 * Exports Application
 */

var app = module.exports = express();

app.get('/topic/:id', require('lib/layout'));
