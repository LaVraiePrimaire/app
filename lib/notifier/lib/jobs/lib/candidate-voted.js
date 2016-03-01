var db = require('../../db')
var log = require('debug')('democracyos:notifier:candidate-voted')
var ObjectId = require('mongojs').ObjectId

var jobName = 'candidate-voted'

module.exports = function (opts) {
  db = db(opts.mongoUrl)
  opts.eventsAndJobs[jobName] = jobName

  opts.agenda.define(jobName, function (job, done) {
    var data = job.attrs.data

    db.candidates.findOne({_id: ObjectId(data.candidate)}, function (err, candidate) {
      if (err) return log('Error found %s', err), done(err);
	  db.feeds.findOne(function (err, feed) {

      	feed = feed || {};
      	feed.type = jobName;
      	feed.createdAt = Date.now();
      	feed.candidate = data.candidate;
      	feed.data = { user: data.user, vote: data.vote };

      	db.feeds.save(feed, function (err, feed) {
        	if (err) return log('Error found %s', err), done(err);

        	log('Saved feed for published candidate %s', data.candidate);
        	done();
      	});
	  })
    });
  })
}
