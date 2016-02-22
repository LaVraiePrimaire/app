module.exports = function factory() {
  return {
    forum: function (forum) {
      return '';
    },

    topic: function (topic, forum) {
      if (!topic) throw new Error('Topic is required.');
      var url = '/topic/' + topic.id;
      return url;
    },

    admin: function (forum) {
      return '/admin';
    }
  };
};
