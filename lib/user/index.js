/**
 * Module dependencies.
 */

var express = require('express');
var utils = require('lib/utils');
var accepts = require('lib/accepts')
var restrict = utils.restrict;
var pluck = utils.pluck;
var api = require('lib/db-api');
var log = require('debug')('democracyos:user');

var app = module.exports = express();

/**
 * Limit request to json format only
 */

function onlyAdmins(req, res, next) {
    if (!req.user) _handleError(new Error('Unauthorized.'), req, res);
    if (req.user.staff) return next();
    return _handleError(new Error('Unauthorized.'), req, res);
}

app.use(accepts('application/json'));

app.get('/user/me', restrict, function (req, res) {
    log('Request user/me');

    log('Serving user %j', req.user.id);
    res.json(api.user.expose.confidential(req.user));
});

app.get('/user/search', restrict, function (req, res) {
    var q = req.param('q');

    log('Request user/search %j', q);

    api.user.search(q, function(err, users) {
        if (err) return _handleError(err, req, res);

        log('Serving users %j', pluck(users, 'id'));
        res.json(users.map(api.user.expose.ordinary));
    });
});

app.get('/user/lookup', function (req, res) {
    var ids = req.param('ids');

    log('Request user/lookup %j', ids);

    if (!ids) return log('Cannot process without ids'), res.json(500,{});

    api.user.lookup(ids.split(','), function(err, users) {
        if (err) return _handleError(err, req, res);

        log('Serving users %j', pluck(users, 'id'));
        res.json(users.map(api.user.expose.ordinary));
    });
});

// This is a temporary hack while lookinf for a better solution to
// this error: 414 Request-URI Too Large
app.post('/user/lookup', function (req, res) {
    var ids = req.param('ids');

    log('Request user/lookup %j', ids);

    if (!ids) return log('Cannot process without ids'), res.json(500,{});

    api.user.lookup(ids, function(err, users) {
        if (err) return _handleError(err, req, res);

        log('Serving users %j', pluck(users, 'id'));
        res.json(users.map(api.user.expose.ordinary));
    });
});


app.get('/user/all',
        onlyAdmins,
        function (req, res) {
            log('Request /user/all');

            api.user.all(function(err, users) {
                if (err) return _handleError(err, req, res);
                log('Serving users %j', pluck(users, 'id'));
                res.json(users.map(api.user.expose.confidential));
            });
        }
       );

app.post('/user/:id/ban',
        onlyAdmins,
        function(req, res) {
            log('Request POST /user/%s/ban', req.params.id);
            api.user.get(req.params.id, function (err, candidateDoc) {
                if (err) return _handleError(err, req, res);

                candidateDoc.disabledAt = new Date;
                candidateDoc.save(function (err, saved) {
                    if (err) return _handleError(err, req, res);
                    log('disabled user%s', candidateDoc.id);
                    log(candidateDoc.disabledAt);
                    res.json(200);
                });
            });
        });

app.delete('/user/:id',
        onlyAdmins,
        function(req, res) {
            log('Request DEL /user/%s', req.params.id);
            api.user.get(req.params.id, function (err, candidateDoc) {
                if (err) return _handleError(err, req, res);

                candidateDoc.disabledAt = new Date;
                console.log("Calling clear activity");
                candidateDoc.clearActivity(function (err) {
                    candidateDoc.save(function (err, saved) {
                      if (err) return _handleError(err, req, res);
                      log('disabled user%s', candidateDoc.id);
                      log(candidateDoc.disabledAt);
                      res.json(200);
                    });
                });
            });
        });


app.post('/user/:id/unban',
        onlyAdmins,
        function(req, res) {
            log('Request unban /user/%s', req.params.id);
            api.user.get(req.params.id, function (err, candidateDoc) {
                if (err) return _handleError(err, req, res);

                candidateDoc.disabledAt = null;
                candidateDoc.save(function (err, saved) {
                    if (err) return _handleError(err, req, res);
                    log('disabled user%s', candidateDoc.id);
                    log(candidateDoc.disabledAt);
                    res.json(200);
                });
            });
        });






app.get('/user/:id', restrict, function (req, res) {
    log('Request user/%s', req.params.id);

    api.user.get(req.params.id, function (err, user) {
        if (err) return _handleError(err, req, res);

        log('userjs Serving user %j', user.id);
        res.json(api.user.expose.ordinary(user));
    });
});


function _handleError (err, req, res) {
    res.format({
        html: function() {
            // this should be handled better!
            // maybe with flash or even an
            // error page.
            log('Error found with html request %j', err);
            res.redirect('back');
        },
        json: function() {
            log("Error found: %j", err);
            res.json({ error: err });
        }
    })
}
