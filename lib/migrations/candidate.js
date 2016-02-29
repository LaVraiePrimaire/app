var api = require('lib/db-api');
var log = require('debug')('democracyos:migrations:candidate');
var jsdom = require('jsdom').jsdom;

/**
 * Gets a HTML `document` element based on a provided HTML markup
 * @api private
 */

function getDOM (str) {
  var dom = jsdom(str);
  return dom.documentElement;
}

/**
 * Infers a candidate version based on its structure
 * @return Number
 * @api private
 */

function guessVersion(candidate) {
  log('Guessing version of candidate %s', candidate._id);
  var migratedClauses = candidate.clauses.filter(function(clause) {
    return !!clause.markup;
  });

  // Migrated and unmigrated clauses may coexist. Better catch it early.
  if (migratedClauses.length) {
    return 3;
  }

  // Handle the case when a v1 candidate has summary but no clauses
  if (candidate._doc.summary && '<div' !== candidate._doc.summary.toLowerCase().substring(0,4)) {
    return 1;
  }

  if (candidate.clauses[0] && candidate.clauses[0]._doc && candidate.clauses[0]._doc.clauseName) {
    log('Candidate %s is v1 (very old stuff with clauses)');
    return 1;
  } else if (candidate.clauses[0] && candidate.clauses[0]._doc && candidate._doc.clauses[0]._doc.markup) {
    log('Candidate %s is v3 (wrote with a rich text editor in DemocracyOS 1.0) or already migrated');
    return 3;
  } else if (candidate._doc.summary) {
    log('Candidate %s is v2 (wrote with a rich text editor)');
    return 2;
  } else {
    log('Can\'t guess candidate version');
    return 3;
  }
}

/**
 * Performs a candidate migration supposing it has v1 structure.
 * @param candidate The candidate mongoose document
 * @param cb A callback function with two params: err and candidate, that represents the migrated candidate
 * @api private
 */

function migrateV1(candidate, cb) {
  log('Starting migration from v1');
  var data = {};
  data.clauses = candidate.clauses.map(function (clause) {
    log('Migrating clause %s', clause._id.toString());
    return {
      id: clause._id,
      markup: '<div>' + clause._doc.text + '</div>',
      position: clause._doc.order,
      empty: false
    };
  });

  log('Migrating summary');
  data.clauses.push({
    markup: '<div>' + candidate._doc.summary + '</div>',
    position: -1,
    empty: false
  });

  candidate.set(data);
  log('Saving candidate')
  candidate.save(function (err) {
    if (err) {
      log('An error occurred while saving candidate: %s', err);
      return cb(err);
    }
    log('Candidate saved, updating side comments...');
    return updateSideComments(candidate, cb);
  });

  function updateSideComments(candidate, cb) {
    for (var i = 0; i < candidate.clauses.length; i++) {
      var clause = candidate.clauses[i];
      var context = (-1 === clause.position) ? 'summary' : 'clause';
      var reference;
      if ('summary' === context) {
        reference = candidate._id.toString() + '-0';
      } else {
        reference = clause._id.toString();
      }
      var query = {
        context: context,
        reference: reference
      };
      var data = {
        reference: clause._id,
        context: 'paragraph',
        candidateId: candidate._id
      };

      log('Updating %j with %j', query, data);

      api.comment.update(query, data, function (err) {
        if (err) {
          log('Error saving comment: ' + err.toString());
        }
        log('comment.save() => OK!');
      });
    }

    return cb(null, candidate);
  }
}

/**
 * Performs a candidate migration supposing it has v1 structure.
 * @param candidate The candidate mongoose document
 * @param cb A callback function with two params: err and candidate, that represents the migrated candidate
 * @api private
 */

function migrateV2(candidate, cb) {
  var html = candidate._doc.summary;
  var document = getDOM(html);
  log('candidate.summary: ' + html)
  var divs = document.getElementsByTagName('div');
  for (i in divs) {
    if (divs.hasOwnProperty(i)) {
      var div = divs[i];
      var markup = div.outerHTML;
      log('candidate.clauses[' + i + ']: ' + markup);
      // TODO: Detect <br /> and set empty to true
      var doc = {
        markup: markup,
        position: i,
        empty: false
      };
      candidate.clauses.push(doc);

      // The newly created clause ID
      var clauseId = candidate.clauses[candidate.clauses.length - 1]._id.toString();
      log('candidate.clauses[' + i + '].id: ' + clauseId);

      // Now update its side-comments
      var reference = candidate._id + '-' + (+i);
      log('Getting comments for ' + 'summary' + ' referenced to ' + reference);

      var query = {
        context: 'summary',
        reference: reference
      };
      var data = {
        reference: clauseId,
        context: 'paragraph',
        candidateId: candidate._id
      };

      api.comment.update(query, data, function (err) {
        if (err) {
          log('Error saving comment: ' + err.toString());
        }
        log('comment.save() => OK!');
      });
    }
  }

  candidate.save(function (err) {
    if (err) {
      log('Error saving candidate: ' + err.toString());
      return cb(err);
    }
    log('Candidate saved!');
    return cb(null, candidate);
  });
}

/**
 * Ensures the candidate document has a DemocracyOS 1.0 compatible structure
 * This action could alter the document structure and its associated side-comments
 * @param candidate The actual candidate document
 * @param cb A callback function with two params: err and candidate, that represents the migrated candidate
 * @api public
 */

module.exports = function migrateCandidate(candidate, cb) {
  var version = guessVersion(candidate);
  if (1 === version) {
    return migrateV1(candidate, cb);
  } else if (2 === version) {
    return migrateV2(candidate, cb);
  } else {
    // Version 3 does not need to be migrated
    cb(null, candidate);
  }
};
