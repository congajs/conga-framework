var Toolbar = function(container){
	this.container = container;
};

Toolbar.prototype = {

	isEnabled: function(){
		return this.enabled;
	},

	broadcast: function(type, message){
		
	}

};

module.exports = Toolbar;