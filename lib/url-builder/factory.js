module.exports = function factory() {
  return {
    topic: function (topic) {
      if (!topic) throw new Error('Topic is required.');
      var url = '/topic/' + topic.id;
      return url;
    },

    admin: function () {
      return '/admin';
    }
  };
};
