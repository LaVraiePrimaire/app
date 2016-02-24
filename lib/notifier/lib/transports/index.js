var mailin = require("../mailin")
var templates = require('../templates')
var t = require('../translations').t
var log = require('debug')('democracyos:notifier:transports')

function createTransport(config) {
  log('Initializing SendinBlue API client')
  var apiKey = config.apiKey;
  return new Mailin("https://api.sendinblue.com/v2.0", apiKey);
}

function sendMail(transport, opts, callback) {
  var to = resolveRecipient(opts.to)
  var from = resolveRecipient(opts.from || {
    email: 'noreply@lavraieprimaire.fr',
    name: 'L\'Equipe La Vraie Primaire'
  })

  var attr = {};
  opts.vars.forEach(function(curVal, idx, arr) {
	  attr[curVal.name] = curVal.content;
  });
  log("attr: %s\n", attr.toString());
  
  var id = opts.templateId;
  
  log("id: %d", id);

  var data = {
	  "id" : id,
	  "from" : from,
	  "to" : to,
	  "attr" : attr
  };
  
  log("data: %s\n", JSON.stringify(data));

  transport.send_transactional_template(data).on('complete', function(data) {
	 log('SendInBlue send result: %s', JSON.stringify(data));
	 if (callback) callback(null);
  });
}

function resolveRecipient(rec) {
  if ('string' === typeof rec) return rec

  if ('object' === typeof rec) {
    if (rec.name) return rec.email
    return rec.email
  }

  if (Array.isArray(rec)) return rec.map(resolveRecipient)

  throw new Error('Invalid or undefined recipient object')
}

/**
 * Module exports
 */
var exports = module.exports = function transports(config) {
  var transport = createTransport(config.mailer)

  exports.mail = function (opts, callback){
    if (!opts.from && config.organizationName && config.organizationEmail) {
      opts.from = {
        email: config.organizationEmail,
        name: config.organizationName
      }
    }
    sendMail(transport, opts, callback)
  }
}
