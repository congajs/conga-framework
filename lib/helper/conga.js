var CongaHelper = function(container){
	this.container = container;
};

CongaHelper.prototype = {
	
	methods: {
	  'conga_init': 'init',
	  'conga_plugins': 'plugins'
	},
	
	init: function(){

		var config = {
			host: this.container.get('config').get('framework').app.host,
			port: this.container.get('config').get('framework').app.port
		};

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