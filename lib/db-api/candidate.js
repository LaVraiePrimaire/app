/**
 * Extend module's NODE_PATH
 * HACK: temporary solution
 */

require('node-path')(module);

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Candidate = mongoose.model('Candidate');
var commentApi = require('./comment');
var utils = require('lib/utils');
var log = require('debug')('democracyos:db-api:candidate');
var pluck = utils.pluck;

/**
 * Get all candidates
 *
 * @param {Function} fn callback function
 *   - 'err' error found on query or `null`
 *   - 'candidates' list items found or `undefined`
 * @return {Module} `candidate` module
 * @api public
 */

exports.all = function all(params, fn) {
  log('Looking for all candidates.');

  var query = { deletedAt: null };


  Candidate
  .find(query)
  .select('id firstName lastName fullName pictureUrl postal email phone participants votes createdAt updatedAt closingAt publishedAt deletedAt acceptedNominationAt status open closed acceptedNomination links')
  .exec(function (err, candidates) {
    if (err) {
      log('Found error %j', err);
      return fn(err);
    }

    log('Delivering candidates %j', pluck(candidates, 'id'));
    fn(null, candidates);
  });

  return this;
};

/**
 * Search candidates from query
 *
 * @param {Object} query filter
 * @param {Function} fn callback function
 *   - 'err' error found while process or `null`
 *   - 'candidates' list of candidates objects found or `undefined`
 * @return {Module} `candidate` module
 * @api public
 */

exports.search = function search(query, fn) {
  log('Searching for candidates matching %j', query);

  Candidate
    .find(query, function(err, candidates) {
    if (err) {
      log('Found error: %j', err);
      return fn(err);
    }

    log('Found candidates %j for %j', pluck(candidates, 'id'), query);
    fn(null, candidates);
  });

  return this;
};

/**
 * Creates candidate
 *
 * @param {Object} data to create candidate
 * @param {Function} fn callback function
 *   - 'err' error found on query or `null`
 *   - 'candidate' item created or `undefined`
 * @return {Module} `candidate` module
 * @api public
 */

exports.create = function create(data, fn) {
  log('Creating new candidate %j', data);
  createCandidate(data, fn);

  return this;
};

function createCandidate(data, fn) {
  var candidate = new Candidate(data);
  candidate.save(onsave);

  function onsave(err) {
    if (err) return fn(err);
    log('Saved candidate %s', candidate.id);
    fn(null, candidate);
  }
}

/**
 * Update candidate by `id` and `data`
 *
 * @param {ObjectId|String} data to create candidate
 * @param {Function} fn callback function
 *   - 'err' error found on query or `null`
 *   - 'candidate' item created or `undefined`
 * @return {Module} `candidate` module
 * @api public
 */

exports.update = function update(id, data, fn) {
  log('Updating candidate %s with %j', id, data);

  exports.get(id, onget);

  function onget(err, candidate) {
    if (err) {
      log('Found error %s', err.message);
      return fn(err);
    }

    var clauses = data.clauses || [];
    delete data.clauses;

    // Delete non submitted clauses
    var submittedIds = clauses.map(function(c) { return c.id });
    var persistedIds = candidate.clauses.map(function(c) { return c.id });
    var clausesToDelete = persistedIds.filter(function(i) { return !~submittedIds.indexOf(i) });
    log('submittedIds: %j', submittedIds);
    log('persistedIds: %j', persistedIds);
    log('clausesToDelete: %j', clausesToDelete);
    clausesToDelete.forEach(function(id) { candidate.clauses.pull({ _id: id }) });

    // Add new clauses or update existing
    clauses.forEach(function(clause) {
      log('clause: %j', clause);
      if (clause.id) {
        var c = candidate.clauses.id(clause.id);
        c.set(clause);
      } else {
        candidate.clauses.addToSet(clause);
      }
    });

    var links = data.links || [];
	console.log('data links: %s', data.links[0]);
    delete data.links;

    links.forEach(function(link) {
      var l = candidate.links.id(link.id);
      l.set(link);
    });

    // update and save candidate document with data
    candidate.set(data);
    candidate.save(onupdate);
  }

  function onupdate(err, candidate) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }
    log('Saved candidate %s', candidate.id);

    candidate.clauses = candidate.clauses.sort(byPosition);
    return fn(null, candidate);
  }

  return this;
};

/**
 * Search single candidate from _id
 *
 * @param {ObjectId} candidate Id to search by `_id`
 * @param {Function} fn callback function
 *   - 'err' error found while process or `null`
 *   - 'candidate' single candidate object found or `undefined`
 * @return {Module} `candidate` module
 * @api public
 */

exports.searchOne = function searchByCandidateId(id, fn) {
  var query = { _id: id, deletedAt: null };

  log('Searching for single candidate matching %j', query);
  Candidate
  .findOne(query)
  .populate('participants')
  .exec(function (err, candidate) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    if (!candidate) {
      log('Candidate with id %s not found.', id);
      return fn(new Error('Candidate not found'));
    }

    log('Delivering candidate %s', candidate.id);
    fn(null, candidate);
  });

  return this;
};

/**
 * Get Candidate form `id` string or `ObjectId`
 *
 * @param {String|ObjectId} id Candidate's `id`
 * @param {Function} fn callback function
 *   - 'err' error found while process or `null`
 *   - 'candidate' found item or `undefined`
 * @api public
 */

function onget(fn) {
  return function(err, candidate) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    if (!candidate) {
      log('Candidate not found');
      return fn(null);
    }

    candidate.clauses = candidate.clauses.sort(byPosition);
    log('Delivering candidate %s', candidate.id);
    fn(null, candidate);
  };
}

exports.get = function get(id, fn) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    log('ObjectId %s is not valid', id);
    return fn(null);
  }

  var query = { _id: id, deletedAt: null };

  log('Looking for candidate %s', id);
  Candidate
  .findOne(query)
  .exec(onget(fn));
};


/**
 * Vote candidate
 *
 * @param {String} id Candidate `id`
 * @param {String} user author of the vote
 * @param {Function} fn callback function
 *   - 'err' error found while process or `null`
 *   - 'proposal' single object created or `undefined`
 * @api public
 */

exports.vote = function vote(id, user, fn) {
  var query = { _id: id, deletedAt: null };

  log('Proceding to vote at candidate %s by user %s', id, user.id || user);

  Candidate
  .findOne(query)
  .exec(function (err, candidate) {
    if (err) {
      log('Found error %s', err);
      return fn(err);
    }

    doVote(candidate, user, fn);
  });
};

function doVote(candidate, user, cb) {
  candidate.vote(user.id, function (err) {
    if (err) {
      log('Found error %s', err);
      return cb(err);
    }

    log('Voted at candidate %s by user %s', candidate.id, user.id || user);
    cb(null, candidate);
  });
}

/**
 * Direct comment to candidate
 *
 * @param {String} id Proposal's `id`
 * @param {Object} comment to attach
 * @param {Function} fn callback function
 *   - 'err' error found while process or `null`
 *   - 'candidate' single object created or `undefined`
 * @api public
 */

exports.comment = function comment(item, fn) {
  log('Creating comment %j for candidate %s', item.text, item.reference);
  commentApi.create(item, function (err, commentDoc) {
    if (err) {
      log('Found error %j', err);
      return fn(err);
    }

    Candidate.findById(item.reference, function(err, candidate) {
        if (err) {
            log('Found error %j', err);
            return fn(err);
        }
        console.log("adding participant %s to candidate %s", item.author, candidate);
        candidate.addParticipant(item.author);
        log('Delivering comment %j', commentDoc);
        fn(null, commentDoc);
    });
  });
};

/**
 * Get comments for candidate
 *
 * @param {String} id Candidate's `id`
 * @param {Function} fn callback function
 *   - 'err' error found while process or `null`
 *   - 'candidate' single object created or `undefined`
 * @api public
 */

exports.comments = function comments(id, paging, fn) {
  log('Get comments for candidate %s', id);

  var query = {
    $or: [
      { context: 'candidate', reference: id },
      { context: 'candidate', reference: mongoose.Types.ObjectId(id) }
    ]
  };

  if (paging.exclude_user) {
    query.author = { $ne: paging.exclude_user };
  }

  commentApi.getFor(query, paging, function (err, items) {
    if (err) {
      log('Found error %j', err);
      return fn(err);
    }

    log('Delivering comments %j', pluck(items, 'id'));
    fn(null, items);
  });
};

/**
 * Get comments for candidate
 *
 * @param {String} id Candidate's `id`
 * @param {Function} fn callback function
 *   - 'err' error found while process or `null`
 *   - 'candidate' single object created or `undefined`
 * @api public
 */

exports.userComments = function userComments(id, userId, fn) {
  log('Get comments for candidate %s from user %s', id, userId);

  var query = {
    context: 'candidate',
    $or: [
      { context: 'candidate', reference: id },
      { context: 'candidate', reference: mongoose.Types.ObjectId(id) }
    ],
    author: userId
  };

  var paging = { limit: 0, sort: 'createdAt' };

  commentApi.getFor(query, paging, function (err, comments) {
    if (err) {
      log('Found error %j', err);
      return fn(err);
    }

    log('Delivering comments %j from user %s', pluck(comments, 'id'), userId);
    fn(null, comments);
  });
};

/**
 * Get candidates for RSS
 *
 * @param {Function} fn callback function
 *   - 'err' error found on query or `null`
 *   - 'candidates' list items found or `undefined`
 * @return {Module} `candidate` module
 * @api public
 */

exports.rss = function all(fn) {
  log('Looking for RSS candidates.');

  Candidate
  .find({ deletedAt: null })
  .select('id fullName publishedAt body')
  .exec(function (err, candidates) {
    if (err) {
      log('Found error %j', err);
      return fn(err);
    }

    log('Delivering candidates %j', pluck(candidates, 'id'));
    fn(null, candidates);
  });

  return this;
};

/**
 * Search total votes
 *
 * @param {Function} fn callback function
 *   - 'err' error found while process or `null`
 *   - 'votes', total casted or `undefined`
 * @return {Module} `candidate` module
 * @api public
 */

exports.votes = function votes(fn) {
  log('Counting total casted votes');

  Candidate
    .aggregate(
      { $unwind: '$votes' },
      { $group: { _id: '#votes', total: { $sum: 1 } } },
      function (err, res) {
        if (err) {
          log('Found error: %j', err);
          return fn(err);
        }

        if (!res[0]) return fn(null, 0);

        var total = res[0].total;

        log('Found %d casted votes', total);
        fn(null, total);
      }
    );

  return this;
};

/**
 * Sorting function for candidate clauses
 */

function byPosition(a, b) {
  return a.position - b.position;
}
