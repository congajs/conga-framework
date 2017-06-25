var UrlHelper = function(router){
  this.router = router;
};

UrlHelper.prototype = {

    methods: {
      'url_for': 'urlFor'
    },

    urlFor: function(route, params){
      return this.router.generateUrl(route, params);
    }
};

module.exports = UrlHelper;
