module.exports = {

  'newest-first': {
    name: 'newest-first',
    label: 'sorts.newest-first',
    sort: function (a, b) {
      // Newest dates first
      if(a.firstName === 'Charte') return -1;
      if(b.firstName === 'Charte') return 1;
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    }
  },

  'oldest-first': {
    name: 'oldest-first',
    label: 'sorts.oldest-first',
    sort: function (a, b) {
      // Oldest dates first
      if(a.firstName === 'Charte') return -1;
      if(b.firstName === 'Charte') return 1;
      return new Date(a.publishedAt) - new Date(b.publishedAt);
    }
  },

  'recently-updated': {
    name: 'recently-updated',
    label: 'sorts.recently-updated',
    sort: function (a, b) {
      // Newest dates first
      if(a.firstName === 'Charte') return -1;
      if(b.firstName === 'Charte') return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
  },

  'alphabetical': {
     name: 'alphabetical',
	 label: 'sorts.alphabetical',
	 sort: function (a, b) {
        if(a.firstName === 'Charte') return -1;
        if(b.firstName === 'Charte') return 1;
        return a.lastName.toLocaleUpperCase().localeCompare( b.lastName.toLocaleUpperCase());
	 }
    },

   'random': {
       name: 'random',
       label: 'sorts.random',
       sort: function (a, b) {
           if(a.firstName === 'Charte') return -1;
           if(b.firstName === 'Charte') return 1;
           return (Math.random() >= 0.5) ? -1 : 1;
       }
   },
};
