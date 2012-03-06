var pm  = require("./passwordmanager");

exports.ModuleHandler = ModuleHandler;

function ModuleHandler( bot ) {
	var self = this;
	
	self.bot = bot;
	
	self.plugins = [
		"./quakelive",
		"./greeter",
		"./pickup",
		"./commands",
		"./quakelink",
		"./spotify",
		"./fredrik",
		"./qlchat"
	];

	self.loadedplugins = [];

	bot.on('pm', function( from, text ) {
		if(text === 'reload') {
			self.bot.say( from, "Reloading plugins..." );

			self.loadPlugins();
			
			self.bot.say( from, "Done." );
		}
	});
	
	self.init();
}

ModuleHandler.prototype.printPlugins = function() {
	var self = this;
	var str = '';

	self.loadedplugins.forEach(function (plugin){
		str += plugin + " ";
	});

	return str;
}

ModuleHandler.prototype.init = function() {
	var self = this;
	
	self.plugins.forEach(function (plugin){
		console.log("Attempting to load: %s", plugin);
		var loadedplugin = require( plugin ).init( self.bot );
		//self.loadedplugins.push( loadedplugin );
	});
}	

ModuleHandler.prototype.loadPlugins = function() {
	var self = this;

	self.bot.removeAllListeners('join');
	self.bot.removeAllListeners('pm');
	self.bot.removeAllListeners('message');
	self.bot.removeAllListeners('topic');


	self.bot.addListener('pm', function( from, text ) {
		if(text === "reload") {
			self.bot.say( from, "Reloading plugins..." );

			self.loadPlugins();
			
			self.bot.say( from, "Done." );
		}
	});

	self.plugins.forEach(function (plugin){

		var name = require.resolve( plugin );
		var cachedModule = require.cache[ name ];

		if( cachedModule ) {
			for( var i in cachedModule.exports ) {
				delete cachedModule.exports[i];
			}

			delete require.cache[ name ];
		}

		// reload
		var reloadedPlugin = require( plugin ).init( self.bot );
		
		console.log("Reloaded plugin --> %s", plugin);

		//self.loadedplugins.push( reloadedPlugin );
	});
	
}

