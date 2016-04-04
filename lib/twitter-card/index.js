var express = require('express');
var app = module.exports = express();
var api = require('lib/db-api');
var config = require('lib/config');
var path = require('path');
var resolve = path.resolve;
// TODO: Figure out solution
//var strip = require('strip');
var log = require('debug')('democracyos:twitter-card');

app.get('/candidate/:id', function(req, res, next){
  log('Twitter Request /candidate/%s', req.params.id);
  api.candidate.get(req.params.id, function (err, candidateDoc) {
    if (err) return _handleError(err, req, res);
    log('Serving Twitter candidate %s', candidateDoc.id);
    res.render(resolve(__dirname, 'candidate.jade'), { candidate: candidateDoc, config : config}); //, strip: strip });
  });
})

app.get('*', function(req, res, next){
  log('Twitter Request generic page');
  res.render(resolve(__dirname, 'generic.jade'), {config : config});
})
