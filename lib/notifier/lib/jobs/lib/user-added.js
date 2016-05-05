var db = require('../../db')
var log = require('debug')('democracyos:notifier:candidate-commented')
var mailList = require('../../transports')

var jobName = 'user-added'

module.exports = function (opts) {
  db = db(opts.mongoUrl);
  opts.eventsAndJobs[jobName] = jobName;
  opts.agenda.define(jobName, function (job, done) {
    mailList.addUser(job.attrs.data, done);
  });
}
