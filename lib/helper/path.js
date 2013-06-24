var path = require('path');

var PathHelper = function(container){
  this.container = container;
};

PathHelper.prototype = {
    
    methods: {
      'path': 'path'
    },
    
    /**
     * Get the relative web path for an asset url
     *
     * @param {String} name
     * @returns {String}
     */
    path: function(name){
      return path.join('/', name);
    }
};

module.exports = PathHelper;