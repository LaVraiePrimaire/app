/**
 * Module dependencies
 */

var express = require('express');
var utils = require('lib/utils');
var restrict = utils.restrict;
var log = require('debug')('democracyos:nominate');
var t = require('t-component');
var config = require('lib/config');
var notifier = require('lib/notifications').notifier;

/**
 * Exports Application
 */

var app = module.exports = express();

app.get('/nominate', restrict, require('lib/layout'));

app.post('/nominate', restrict, function (req, res, next) {
    log('Request /api/nominate %j', req.body);
    nominateCandidate(req.body, function (err, nominatedCandidate) {
        if (err) return next(err);
        res.json(nominatedCandidate);
    });
});

function nominateCandidate(candidateData, cb) {
    var nominatedCandidate;
    console.log(candidateData);
    var user = { id: candidateData._user_id,
                 email: candidateData._user_email,
                 fullName: candidateData._user_firstName + " " + candidateData._user_lastName,
                 postal: candidateData.postal,
                 phone: candidateData.phone
    };
    var nominationType = candidateData.nominationType;
    if ('self' === nominationType) {
        var candidate = { firstName: candidateData._user_firstName,
                          lastName: candidateData._user_lastName,
                          internet: candidateData.internet,
                          facebook: candidateData.facebook,
                          pictureUrl: candidateData.pictureUrl
        };
    } else {
        var candidate = { firstName: candidateData.firstName,
                          lastName: candidateData.lastName,
                          internet: candidateData.internet,
                          facebook: candidateData.facebook,
                          pictureUrl: candidateData.pictureUrl
        };
    }
    candidateData = { user: user, candidate: candidate, nominationType: nominationType };

    var eventName = 'candidate-nominated';
    notifier.notify(eventName)
      .withData(candidateData)
      .send(function (err) {
        if (err) {
          log('Error when sending notification for event %s', eventName);
        } else {
          log('Successfully notified nomination of candidate %s', candidateData);
        }
      });
    cb(null, nominatedCandidate);
}
