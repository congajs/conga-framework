var CongaHelper = function(container){
	this.container = container;
};

CongaHelper.prototype = {
	
	methods: {
	  'conga_init': 'init',
	  'conga_plugins': 'plugins'
	},
	
	init: function(group){

		var config = this.container.get('config').get('client')[group];

		var js = ''; 
		js += '<script type="text/javascript">';
		js += 'var conga = new Conga(' + JSON.stringify(config.config) + ');';
		js += '</script>';

		return js;
	},

	plugins: function(){

	}
};

module.exports = CongaHelper;