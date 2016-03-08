var db = require('../../db')
var mail = require('../../transports').mail
var log = require('debug')('democracyos:notifier:forgot')
var name = require('../../utils/name')
var async = require('async')
var jobs = require('../../jobs')

var jobName = 'candidate-nominated'
var sendInBlueTemplateId = '10';

module.exports = function (opts) {
  db = db(opts.mongoUrl)
  opts.eventsAndJobs[jobName] = jobName

  opts.agenda.define(jobName, function (job, done) {
    var data = job.attrs.data

    var params = {
      template: jobName,
	  templateId: sendInBlueTemplateId,
      to: process.env.NOMINATION_EMAIL,
      vars: [
        { name: 'USER_ID', content: data.user.id },
        { name: 'USER_EMAIL', content: data.user.email},
        { name: 'USER_NAME', content: data.user.fullName },
        { name: 'USER_PHONE', content: data.user.phone },
        { name: 'USER_POSTAL', content: data.user.postal },
        { name: 'NOMINATION_TYPE', content: data.nominationType },
        { name: 'CANDIDATE_PRENOM', content: data.candidate.firstName },
        { name: 'CANDIDATE_NOM', content: data.candidate.lastName },
        { name: 'CANDIDATE_WEB', content: data.candidate.internet },
        { name: 'CANDIDATE_FB', content: data.candidate.facebook },
        { name: 'PICTURE_URL', content: data.candidate.pictureUrl }
      ]
    }

    mail(params, done)
  })
}
