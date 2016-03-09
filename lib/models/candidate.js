/**
 * Extend module's NODE_PATH
 * HACK: temporary solution
 */

require('node-path')(module);

/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var validators = require('mongoose-validators');
var log = require('debug')('democracyos:models:candidate');
var xss = require('lib/richtext').xssFilter({ video: true, image: true, link: true });

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

/**
 * Candidate Vote Schema
 */

var Vote = new Schema({
    author: { type: ObjectId, ref: 'User', required: true }
  , trustee: { type: ObjectId, ref: 'User' }
  , caster: { type: ObjectId, ref: 'User' }
  , createdAt: { type: Date, default: Date.now }
});

/**
 * Link
 */

var LinkSchema = new Schema({
    url: { type: String, validate: validators.isURL({ skipEmpty: true }), required: true }
  , type: { type: String, default: 'personal', required: true}
});

mongoose.model('Link', LinkSchema);

LinkSchema.methods.update = function update(data) {
  data = data || {};
  this.url = data.url || this.url;
  this.type = data.type || this.type;
};

/**
 * Paragraph Schema
 */

var ParagraphSchema = new Schema({
    markup:   { type: String }
  , position: { type: Number }
  , empty:    { type: Boolean, default: false }
});

mongoose.model('Paragraph', ParagraphSchema);

/**
 * Candidate Schema
 */

var CandidateSchema = new Schema({
    firstName: { type: String, required: true }
  , lastName: { type: String }
  , pictureUrl: { type: String, validate: validators.isURL({ skipEmpty: true}) }
  , postal: { type: String }
  , email: { type: String, validate: validators.isEmail( { skipEmpty: true }) }
  , phone: { type: String }
  , whatIsLife: { type: String }
  , secondChartePos: { type: String }
  , thirdChartePos: { type: String }
  , fourthChartePos: { type: String }
  , fifthChartePos: { type: String }
  , firstProp: { type: String }
  , secondProp: { type: String }
  , thirdProp: { type: String }
  , votes: [Vote]
  , participants: [{type: ObjectId, ref: 'User' }]
  , candidateUser: {type: ObjectId, ref: 'User' }
  , nominatorUser: {type: ObjectId, ref: 'User' }
  , createdAt: { type: Date, default: Date.now }
  , updatedAt: { type: Date }
  , closingAt: { type: Date }
  , publishedAt: { type: Date }
  , acceptedNominationAt: { type: Date}
  , deletedAt: { type: Date }
  , votable: { type: Boolean, required: true, default: true }
  , bodyTruncationText: { type: String }
  , links: [LinkSchema]
})

/**
 * Define Schema Indexes for MongoDB
 */

CandidateSchema.index({ createdAt: -1 });
CandidateSchema.index({ participants: -1 });
CandidateSchema.index({ firstName: -1, lastName: -1}); 

/**
 * Make Schema `.toObject()` and
 * `.toJSON()` parse getters for
 * proper JSON API response
 */

CandidateSchema.set('toObject', { getters: true });
CandidateSchema.set('toJSON', { getters: true });

CandidateSchema.options.toObject.transform =
CandidateSchema.options.toJSON.transform = function(doc, ret) {
  if (ret.votes) delete ret.votes;
  if (ret.publicVotes) ret.publicVotes = ret.publicVotes.map(function(v) { return v.author; });
};

/**
 * -- Model's event hooks
 */

/**
 * Pre update modified time
 *
 * @api private
 */

CandidateSchema.pre('save', function(next) {
  this.updatedAt = this.isNew ? this.createdAt : Date.now();
  this.body = xss(this.body);

  next();
});

/**
 * -- Model's API extension
 */

CandidateSchema.virtual('fullName').get(function() {
	return this.firstName + " " + this.lastName;
});

/**
 * Compile to generate
 * a human readable title
 *
 * @return {String} title 
 * @api public
 */

CandidateSchema.virtual('title').get(function() {
  return this.fullName;
});


CandidateSchema.virtual('publicVotes').get(function() {
  return this.votes;
});


/**
 * Get candidate `status`
 *
 * @return {String} status
 * @api public
 */

CandidateSchema.virtual('status').get(function() {
  if (!this.closingAt) return 'open';

  return this.closingAt.getTime() < Date.now()
    ? 'closed'
    : 'open';
});

/**
 * Wether the `candidate` is open
 *
 * @return {Boolean} open
 * @api public
 */

CandidateSchema.virtual('open').get(function() {
  return 'open' === this.status;
});

/**
 * Wether the `candidate` is closed
 *
 * @return {Boolean} closed
 * @api public
 */

CandidateSchema.virtual('closed').get(function() {
  return 'closed' === this.status;
});


/**
 * Whether the candidate accepted their own nonimation
 *
 * @return {Boolean} acceptedNomination
 * @api public
 */

CandidateSchema.virtual('acceptedNomination').get(function () {
  return !!this.acceptedNominationAt;
});

/**
 * Wether the `candidate` was deleted
 *
 * @return {Boolean} deleted
 * @api public
 */

CandidateSchema.virtual('deleted').get(function() {
  return !!this.deletedAt;
});


/**
 * Wether the `candidate` is public
 *
 * @return {Boolean} public
 * @api public
 */

CandidateSchema.virtual('public').get(function() {
  return !!this.publishedAt;
});

/**
 * Wether the `candidate` is draft
 *
 * @return {Boolean} draft
 * @api public
 */

CandidateSchema.virtual('draft').get(function() {
  return !this.publishedAt;
});

/**
 * Vote Candidate with provided user
 *
 * @param {User|ObjectId|String} user
 * @param {Function} cb
 * @api public
 */

CandidateSchema.methods.vote = function(user, cb) {
  if ('recount' === this.status) return cb(new Error('Voting is closed on recount.'));
  if ('closed' === this.status) return cb(new Error('Voting is closed.'));
  // Here we could provide a 5000ms tolerance (5s)
  // or something... to prevent false positives
  if (this.closingAt && (+new Date(this.closingAt) < +new Date) ) return cb(new Error('Can\'t vote after closing date.'));

  var vote = { author: user, caster: user };

  this.unvote(user, onunvote.bind(this));

  function onunvote(err) {
    if (err) {
      if ('function' === typeof cb) return cb(err);
      else throw err;
    }

    this.votes.push(vote);

    if ('function' === typeof cb) this.save(cb);
  }
};

/**
 * Add participant to candidate
 *
 * @param {User|ObjectId|String} user
 * @param {Function} cb
 * @api public
 */

CandidateSchema.methods.addParticipant = function(user, cb) {
  this.participants.addToSet(user);
  if (cb) this.save(cb);
};

/**
 * Unvote Candidate from provided user
 *
 * @param {User|ObjectId|String} user
 * @param {Function} cb
 * @api public
 */

CandidateSchema.methods.unvote = function(user, cb) {
  var votes = this.votes;
  var c = user.get ? user.get('_id') : user;

  var voted = votes.filter(function(v) {
    var a = v.author.get ? v.author.get('_id') : v.author;
    return a.equals ? a.equals(c) : a === c;
  });

  log('About to remove votes %j', voted);
  if (voted.length) voted.forEach(function(v) {
    var removed = votes.id(v.id).remove();
    log('Remove vote %j', removed);
  });

  if ('function' === typeof cb) this.save(cb);
};

/**
 * Check for vote status of user
 *
 * @param {User|ObjectId|String} user
 * @api public
 */

CandidateSchema.methods.votedBy = function(user) {
  if (!user) return false;

  var votes = this.votes;
  var c = user.get ? user.get('_id') : user;

  var voted = votes.filter(function(v) {
    var a = v.author.get ? v.author.get('_id') : v.author;
    return a.equals ? a.equals(c) : a === c;
  });

  return 1 === voted.length;
};

/**
 * Close candidate to prevent future vote casts
 *
 * @param {Function} cb
 * @api public
 */

CandidateSchema.methods.close = function(cb) {
  if (+new Date(this.closingAt) < +new Date) {
    log('Deny to close candidate before closing date.');
    return cb(new Error('Deny to close candidate before closing date.'));
  }
  this.status = 'closed';
  if (cb) this.save(cb);
};

module.exports = function initialize(conn) {
  return conn.model('Candidate', CandidateSchema);
};
