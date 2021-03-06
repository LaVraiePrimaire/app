/**
* Module dependencies.
*/

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require('lib/config');

/*
 * Notification Schema
 */

var NotificationSchema = new Schema({
  user: { type: ObjectId, ref: 'User' },
  type: { type: String, enum: ['reply', 'upvote', 'downvote'] },
  comment: { type: ObjectId, ref: 'Comment' },
  relatedUser: { type: ObjectId, ref: 'User' },
  candidate: { type: ObjectId, ref: 'Candidate' },
  createdAt: { type: Date, default: Date.now }
});

/**
 * Set translation key according to
 * notification type
 *
 * @return {String} text
 * @api public
 */

NotificationSchema.virtual('translationKey').get(function() {
  return 'notifications.:type.text'.replace(':type', this.type);
});

/**
 * Gets the URL associated to the notified object.
 *
 * @return {String} url
 * @api public
 */

NotificationSchema.virtual('url').get(function() {
  var url = '/candidate/:candidateId'.replace(':candidateId', this.candidate.id.toString());
  return url;
});

/**
 * Make Schema `.toObject()` and
 * `.toJSON()` parse getters for
 * proper JSON API response
 */

NotificationSchema.set('toObject', { getters: true });
NotificationSchema.set('toJSON', { getters: true });

module.exports = function initialize(conn) {
  return conn.model('Notification', NotificationSchema);
};
