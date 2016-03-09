/**
 * Module dependencies.
 */

var express = require('express');
var mongoose = require('mongoose');
var api = require('lib/db-api');
var utils = require('lib/utils');
var accepts = require('lib/accepts');
var restrict = utils.restrict;
var pluck = utils.pluck;
var expose = utils.expose;
var log = require('debug')('democracyos:candidate');
var config = require('lib/config');
var utils = require('lib/utils');
var notifier = require('lib/notifications').notifier;
var hasAccess = require('lib/is-owner').hasAccess;

var app = module.exports = express();

/**
 * Limit request to json format only
 */

app.use(accepts(['application/json', 'text/html']));

var candidateListKeys = [
  'id firstName lastName nominatorName pictureUrl email phone postal fullName acceptedNomination status open closed public draft deleted whatIsLife secondChartePos thirdChartePos fourthChartePos fifthChartePos firstProp secondProp thirdProp',
  'participants voted createdAt updatedAt closingAt acceptedNominationAt',
  'publishedAt candidateUser nominatorUser deletedAt votable clauseTruncationText links'
].join(' ');

var candidateKeys = candidateListKeys
              + ' '
              + 'summary state publicVotes';

function exposeCandidate(candidateDoc, user, keys) {
  if (!keys) keys = candidateKeys;

  var candidate = candidateDoc.toJSON();
  candidate.voted = candidateDoc.votedBy(user);

  return expose(keys)(candidate);
}

function onlyAdmins(req, res, next) {
  if (!req.user) _handleError(new Error('Unauthorized.'), req, res);
  if (req.user.staff) return next();
  return _handleError(new Error('Unauthorized.'), req, res);
}

app.get('/candidate/all',
function(req, res, next) {
  if (req.query.draft) {
    onlyAdmins(req, res, next);
  } else {
    next();
  }
},
function (req, res) {
  log('Request /candidate/all');

  api.candidate.all({}, function(err, candidates) {
    if (err) return _handleError(err, req, res);

    candidates = candidates.filter(function(candidate) {
      if (candidate.public) return true;
      if (req.query.draft && candidate.draft) return true;
      return false;
    });

    log('Serving candidates %j', pluck(candidates, 'id'));

    res.json(candidates.map(function(candidateDoc){
      return exposeCandidate(candidateDoc, req.user, candidateListKeys);
    }));
  });
});

app.get('/candidate/:id', function (req, res) {
  log('Request GET /candidate/%s', req.params.id);

  api.candidate.get(req.params.id, function (err, candidate) {
    if (err) return _handleError(err, req, res);
    if (!candidate) return res.send(404);
    log('Serving candidate %s', candidate.id);
	var candidateJson = exposeCandidate(candidate, req.user);
    res.json(exposeCandidate(candidate, req.user));
  });
});

// TODO: Change endpoint -- move to comment-api
app.get('/candidate/:id/sidecomments', function (req, res) {
  log('Requesting /candidate/%s/sidecomments', req.params.id);
  // var paging = { page: 0, limit: 0, sort: 'createdAt', exclude_user: null };
  api.comment.getSideComments(req.params.id, null, function (err, comments) {
    if (err) return _handleError(err, req, res);
    log('Serving candidate %s body\'s comments %j', req.params.id, pluck(comments, 'id'));

    var keys = [
      'id text createdAt editedAt context reference',
      'author.id author.fullName author.displayName author.avatar',
      'flags upvotes downvotes votes replies.length selfComment'
    ].join(' ');

    res.json(comments.map(expose(keys)));
  });
});

app.get('/candidate/:id/comments', function (req, res) {
  log('Request /candidate/%s/comments', req.params.id);

  var sort = '';
  if (~['-score', '-createdAt', 'createdAt'].indexOf(req.query.sort)) {
    sort = req.query.sort;
  } else {
    sort = '-score';
  }

  var paging = {
    page: req.query.page || 0,
    limit: req.query.limit || 0,
    sort: sort,
    exclude_user: req.query.exclude_user || null
  };

  api.candidate.comments(req.params.id, paging, function (err, comments) {
    if (err) return _handleError(err, req, res);

    if (!req.query.count) {
      log('Serving candidate %s comments %j', req.params.id, pluck(comments, 'id'));

      var keys = [
        "id text createdAt editedAt context reference",
        "author.id author.fullName author.displayName author.avatar",
        "flags upvotes downvotes votes replies.length selfComment"
      ].join(' ');

      res.json(comments.map(expose(keys)));
    } else {
      log('Serving candidate %s comments count: %d', req.params.id, comments.length);

      res.json(comments.length);
    }
  });
});

app.get('/candidate/:id/my-comments', restrict, function (req, res) {
  log('Request /candidate/%s/my-comments', req.params.id);

  api.candidate.userComments(req.params.id, req.user.id, function (err, comments) {
    if (err) return _handleError(err, req, res);

    log('Serving candidate %s comments %j for user %s', req.params.id, pluck(comments, 'id'), req.user.id);

    var keys = [
      "id text createdAt editedAt context reference",
      "author.id author.fullName author.displayName author.avatar",
      "flags upvotes downvotes votes replies.length selfComment"
    ].join(' ');

    res.json(comments.map(expose(keys)));
  });
});

app.post('/candidate/:id/comment', restrict, function (req, res) {
  log('Request /candidate/%s/comment %j', req.params.id, req.body.comment);

  var comment = {
    text: req.body.text,
    context: req.body.context || 'candidate',
    reference: req.params.id,
    candidateId: req.body.candidateId,
    author: req.user.id,
  };

  api.candidate.comment(comment, function (err, commentDoc) {
    if (err) return _handleError(err, req, res);

    var keys = [
      'id text',
      'author.id author.fullName author.displayName author.avatar',
      'upvotes downvotes flags',
      'createdAt replies context reference selfComment'
    ].join(' ');

    res.json(200, expose(keys)(commentDoc));
  });
});

app.post('/candidate/:id/vote', restrict, function (req, res) {
  log('Request /candidate/%s/vote', req.param('id'));

  api.candidate
  .vote(
    req.param('id'),
    req.user,
    function (err, candidate) {
      if (err) return _handleError(err, req, res);
      res.json(exposeCandidate(candidate, req.user));
    }
  );
});

app.post('/candidate/create', restrict, hasAccess, function (req, res, next) {
  log('Request /candidate/create %j', req.body);

  api.candidate.create(req.body, function (err, candidate) {
    if (err) return next(err);
    var keys = [
      'id firstName lastName fullName nominatorName pictureUrl postal email phone body state whatIsLife secondChartePos thirdChartePos fourthChartePos fifthChartePos firstProp secondProp thirdProp',
      'status open closed public draft deleted acceptedNomination participants',
      'publicVotes createdAt updatedAt closingAt acceptedNominationAt',
      'publishedAt deletedAt votable bodyTruncationText links candidateUser nominatorUser'
    ].join(' ');
    res.json(exposeCandidate(candidate, req.user));
  });
});

app.post('/candidate/:id', restrict, hasAccess, function (req, res) {
  log('Request POST /candidate/%s', req.params.id);

  api.candidate.update(req.params.id, req.body, function (err, candidate) {
    if (err) return _handleError(err, req, res);
    log('Serving candidate %s', candidate.id);
    res.json(exposeCandidate(candidate, req.user));
  });
});

app.post('/candidate/:id/link', restrict, hasAccess, function (req, res) {
  log('Request POST /candidate/%s/link', req.params.id);

  var link = req.body.link;
  console.log('link: %s', link);
  log('this is the link: %s', link);
  api.candidate.get(req.params.id, function (err, candidateDoc) {
    if (err) return _handleError(err, req, res);

    var linkDoc = link && link.id
      ? candidateDoc.links.id(link.id)
      : candidateDoc.links.create();

    linkDoc.update(link);
    if (linkDoc.isNew) candidateDoc.links.push(linkDoc);

    candidateDoc.save(function (err, saved) {
      if (err) return _handleError(err, req, res);

      res.json(200, expose('id text url type')(linkDoc));
    });
  });
});

app.delete('/candidate/:id/link', restrict, hasAccess, function (req, res) {
  log('Request DELETE /candidate/%s/link', req.params.id);

  var link = req.body.link;
  api.candidate.get(req.params.id, function (err, candidateDoc) {
    if (err) return _handleError(err, req, res);

    candidateDoc.links.remove(link);
    log('removed link %s from candidate %s', link, candidateDoc.id);

    candidateDoc.save(function (err, saved) {
      if (err) return _handleError(err, req, res);

      res.json(200);
    });
  });
});

app.post('/candidate/:id/publish', restrict, hasAccess, function (req, res) {
  log('Request POST /candidate/%s/publish', req.params.id);

  api.candidate.get(req.params.id, function (err, candidate) {
    if (err) return _handleError(err, req, res);

    candidate.publishedAt = new Date;
    candidate.save(function (err, saved) {
      if (err) return _handleError(err, req, res);
      log('publish candidate %s at %s', candidate.id, candidate.publishedAt);

      var eventName = 'candidate-published';

      var candidateUrl = utils.buildUrl(false, { pathname: '/candidate/' + candidate.id });

      var data = {
        candidate: { fullName: candidate.fullName, id: candidate.id },
        url: candidateUrl
      };

      if (config.deploymentId) {
        data.deploymentId = config.deploymentId;
      }

      notifier.notify(eventName)
        .withData(data)
        .send(function (err) {
          if (err) {
            log('Error when sending notification for event %s', eventName);
          } else {
            log('Successfully notified publishing of candidate %s', candidate.id);
          }
        });
    });

    res.json(exposeCandidate(candidate, req.user));
  });
});

app.post('/candidate/:id/unpublish', restrict, hasAccess, function (req, res) {
  log('Request POST /candidate/%s/unpublish', req.params.id);

  api.candidate.get(req.params.id, function (err, candidateDoc) {
    if (err) return _handleError(err, req, res);

    candidateDoc.publishedAt = null;
    candidateDoc.save(function (err, saved) {
      if (err) return _handleError(err, req, res);
      log('unpublished candidate %s', candidateDoc.id);
      res.json(exposeCandidate(candidateDoc, req.user));
    });
  });
});

app.post('/candidate/:id/acceptNomination', restrict, hasAccess, function (req, res) {
  log('Request POST /candidate/%s/acceptNomination', req.params.id);

  api.candidate.get(req.params.id, function (err, candidate) {
    if (err) return _handleError(err, req, res);

    candidate.acceptedNominationAt = new Date;
    candidate.save(function (err, saved) {
      if (err) return _handleError(err, req, res);
      log('accepted nomination of candidate %s at %s', candidate.id, candidate.publishedAt);

      var eventName = 'candidate-accepted';

      var candidateUrl = utils.buildUrl(false, { pathname: '/candidate/' + candidate.id });

      var data = {
        candidate: { fullName: candidate.fullName, id: candidate.id },
        url: candidateUrl
      };

      if (config.deploymentId) {
        data.deploymentId = config.deploymentId;
      }

      notifier.notify(eventName)
        .withData(data)
        .send(function (err) {
          if (err) {
            log('Error when sending notification for event %s', eventName);
          } else {
            log('Successfully notified nomination of candidate %s', candidate.id);
          }
        });
    });

    res.json(exposeCandidate(candidate, req.user));
  });
});

app.delete('/candidate/:id', restrict, hasAccess, function (req, res) {
  log('Request DEL /candidate/%s', req.params.id);

  api.candidate.get(req.params.id, function (err, candidateDoc) {
    if (err) return _handleError(err, req, res);

    candidateDoc.deletedAt = new Date;
    candidateDoc.save(function (err, saved) {
      if (err) return _handleError(err, req, res);
      log('deleted candidate %s', candidateDoc.id);
      res.json(200);
    });
  });
});

function _handleError (err, req, res) {
  log("Error found: %s", err);
  var error = err;
  if (err.errors && err.errors.text) error = err.errors.text;
  if (error.type) error = error.type;

  res.json(400, { error: error });
}
