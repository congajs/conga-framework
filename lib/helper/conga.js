var CongaHelper = function(container){
	this.container = container;
};

CongaHelper.prototype = {
	
	methods: {
	  'conga_init': 'init'
	},
	
	init: function(group) {

		var config = this.container.get('config').get('client');

		if (typeof config[group] !== 'undefined') {
			config = config[group];
		} else {
			config = {};
		}

		var js = ''; 
		js += '<script type="text/javascript">';
		js += 'var conga = new Conga(' + JSON.stringify(config) + ');';
		js += '</script>';

		return js;
	}
};

module.exports = CongaHelper;