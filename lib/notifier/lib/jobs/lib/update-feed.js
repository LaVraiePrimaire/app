var db = require('../../db')
var log = require('debug')('democracyos:notifier:candidate-published-update-feed')
var ObjectId = require('mongojs').ObjectId

var jobName = 'update-feed'

module.exports = function updateFeed(opts) {
  db = db(opts.mongoUrl)
  opts.eventsAndJobs[jobName] = jobName

  opts.agenda.define(jobName, function (job, done) {
    var data = job.attrs.data

    db.candidates.findOne({_id: ObjectId(data.id)}, function (err, candidate) {
      if (err) return log('Error found %s', err), done(err)

	  db.feeds.findOne(function (err, feed) {
      	if (err) return log('Error found %s', err), done(err)

      	feed = feed || {}
      	feed.type = 'candidate-published'
      	feed.candidate = data.id
      	feed.createdAt = Date.now()

      	db.feeds.save(feed, function (err, feed) {
        	if (err) return log('Error found %s', err), done(err)

        	log('Saved feed for published candidate %s', feed.candidate)
        	done()
      	})
	  })
    })
  })
}

module.exports.jobName = jobName
