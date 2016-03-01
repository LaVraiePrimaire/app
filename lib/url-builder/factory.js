module.exports = function factory() {
  return {
    candidate: function (candidate) {
      if (!candidate) throw new Error('Candidate is required.');
      var url = '/candidate/' + candidate.id;
      return url;
    },

    admin: function () {
      return '/admin';
    }
  };
};
