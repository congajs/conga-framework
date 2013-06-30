var CongaHelper = function(container){
	this.container = container;
};

CongaHelper.prototype = {
	
	methods: {
	  'conga_init': 'init',
	  'conga_plugins': 'plugins'
	},
	
	init: function(group){

		var config = this.container.get('config').get('client');

		if (typeof config[group] !== 'undefined'){
			config = config[group];

			if (typeof config.config !== 'undefined'){
				config = config.config;
			} else {
				config = {};
			}

		} else {
			config = {};
		}

		var js = ''; 
		js += '<script type="text/javascript">';
		js += 'var conga = new Conga(' + JSON.stringify(config) + ');';
		js += '</script>';

		return js;
	},

	plugins: function(){

	}
};

module.exports = CongaHelper;