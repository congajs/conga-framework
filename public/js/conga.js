var Conga = {};

Conga.socket = io.connect('http://1.1.1.3:3000/chat');


/**
 * Special socket.io request method with request to named
 * conga route and callback
 * 
 * @param  {String}   route
 * @param  {Object}   params
 * @param  {Function} cb
 * @return {void}
 */
Conga.socket.request = function(route, params, cb){

	var json = io.JSON.stringify({
		route : route,
		params: params
	});

	this.emit('message', json, function(data){
		if (typeof cb === 'function'){
			cb(data);
		}
	});

};