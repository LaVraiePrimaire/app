var express = require('express');
var app = module.exports = express();
var api = require('lib/db-api');
var config = require('lib/config');
var path = require('path');
var url = require('url');
var resolve = path.resolve;
//// TODO Sol'n
//var strip = require('strip');
var log = require('debug')('democracyos:facebook-card');

app.get('/candidate/:id', function(req, res, next){
  log('Facebook Request /candidate/%s', req.params.id);
  api.candidate.get(req.params.id, function (err, candidateDoc) {
    if (err) return _handleError(err, req, res);
    log('Serving Facebook candidate %s', candidateDoc.id);
    var baseUrl = url.format({
        protocol: config.protocol
      , hostname: config.host
      , port: config.publicPort
    });
    res.render(resolve(__dirname, 'candidate.jade'),
                       { candidate: candidateDoc,
                         baseUrl : baseUrl,
                         config : config
                         //strip: strip
                       });
  });
})

app.get('*', function(req, res, next){
  log('Facebook Request generic page');
  var baseUrl = url.format({
      protocol: config.protocol
    , hostname: config.host
    , port: config.publicPort
  });
  res.render(resolve(__dirname, 'generic.jade'),
                     { baseUrl : baseUrl,
                      config : config});
})
