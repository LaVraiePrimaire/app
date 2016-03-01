/**
 * Module Dependencies
 */

var mongoose = require('mongoose');
var Notification = mongoose.model('Notification');
var User = require('./user');
var Candidate = require('./candidate');
var Comment = require('./comment');
var log = require('debug')('democracyos:db-api:notification');
var utils = require('lib/utils');
var pluck = utils.pluck;

/**
 * Get all notifications
 *
 * @param {User} user to get notifications from
 * @return {Module} `notification` module
 * @api public
 */

exports.all = function all(user) {
  return new Promise(function(resolve, reject) {
    Notification
      .find({ user: user })
      .populate('user comment relatedUser candidate')
      .exec()
	  .then(function (notifications) {
	     resolve(notifications);
	  })
      .then(null, function (err) {
        reject(err);
      });
  });
};

/**
 * Creates a new notification
 *
 * @param {Notification} data of the notification to be created
 * @return {Promise} a Promise of creating a new notification
 * @api public
 */

exports.create = function create(data) {
  log("data is this: %j", data);
  return map(data)
  .then(saveNotification)
  .catch(err => Promise.reject(err));
};

function saveNotification (event) {
  log('Attempting to push new notification: %j', event);
  return new Promise((resolve, reject) => {
    var notification = new Notification(event);
    notification.save(function (err, doc) {
      if (err) {
        log('Error pushing notification: %s', err);
        return reject(err);
      }

      log('Notification pushed succesfully');
      return resolve(doc);
    });
  });
}

function map (eventData) {
  switch (eventData.event) {
    case 'comment-reply':
      return mappers.reply(eventData);
    case 'comment-upvote':
      return mappers.upvote(eventData);
    case 'comment-downvote':
      return mappers.downvote(eventData);
    default:
      return Promise.resolve();
  }
}

const mappers = {
  reply: function mapReply (eventData) {
    return new Promise((resolve, reject) => {
      getComment(eventData.comment.id)
      .then(comment => getCandidate(comment.reference))
      .then(candidate => resolve({
        type: 'reply',
        relatedUser: eventData.reply.author.id,
        user: eventData.comment.author.id,
        comment: eventData.comment.id,
        candidate: candidate.id
      }))
      .catch(err => reject(err));
    });
  },

  upvote: function mapUpvote (eventData) {
    return new Promise((resolve, reject) => {
      getCandidate(eventData.comment.reference)
      .then(candidate => resolve({
        type: 'upvote',
        user: eventData.comment.author._id,
        relatedUser: eventData.user._id,
        candidate: candidate.id,
        comment: eventData.comment.id
      }))
      .catch(err => reject(err));
    });
  },

  downvote: function mapDownvote (eventData) {
    return new Promise((resolve, reject) => {
      getCandidate(eventData.comment.reference)
      .then(candidate => resolve({
        type: 'downvote',
        user: eventData.comment.author._id,
        relatedUser: eventData.user._id,
        candidate: candidate.id,
        comment: eventData.comment.id
      }))
      .catch(err => reject(err));
    });
  },

  candidateVoted: function mapCandidateVoted (eventData) {
    return new Promise((resolve, reject) => {
      Promise.all([
        getUser(eventData.user),
        getCandidate(eventData.candidate)
      ])
      .then(data => resolve({
        type: 'candidate',
        user: data[1].author.id,
        relatedUser: data[0].id,
        candidate: data[1].id
      }))
      .catch(err => reject(err));
    });
  }
};

function getUser (email) {
  return new Promise((resolve, reject) => {
    User.getByEmail(email, function (err, user) {
      if (err) {
        return reject(err);
      }

      return resolve(user);
    });
  });
}

function getComment (id) {
  return new Promise((resolve, reject) => {
    Comment.getById(id, (err, doc) => {
      if (err) {
        return reject(err);
      } else if (!doc) {
        return reject(new Error('comment not found'))
      }

      return resolve(doc);
    })
  });
}

function getCandidate (id) {
  return new Promise((resolve, reject) => {
    Candidate.searchOne(id, function (err, candidate) {
      if (err) {
        return reject(err);
      }

      return resolve(candidate);
    });
  });
}
