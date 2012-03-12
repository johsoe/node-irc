var fs = require('fs'),
	util = require('util');

exports.Greeter = Greeter;

exports.init = function( bot ) {
	return new Greeter( bot );
}

function Greeter( botref ) {
	var self = this;
	
	self.bot = botref;
	
	self.options = {
		'filename' : 'modules/greetings.json',
		//'channel' : '#quakelive.NO-TARD-ZONE'
		'channel' : '#Fromage&champagne'
	};
	
	self.greetings = {};
	
	self.loadGreetings();
	
	self.setupListeners();
};

Greeter.prototype.setupListeners = function() {
	var self = this;
	
	self.bot.on('join', function(channel, who) {
		//console.log('Greeter hook: ' + channel + " - " + who);
		
		if(channel === self.options.channel) {
			var greet = self.getGreeting( who );
			
			if( greet )
				self.bot.say( channel, self.getGreeting( who ) );
			else {
				self.bot.say( channel, "d:)");
				self.bot.say( channel, "d :) Guduw " + who);
				self.bot.say( channel, "d:)");
			}	
		}
	});
	
	self.bot.on('pm', function(nick, message) {
		if('string' == typeof self.bot.chanData( self.options.channel ).users[ nick ] ) {
			
			var cmd = message.substring(0, message.indexOf(" "));
			
			if(cmd === "greet")
				self.updateGreeting( nick, message.substring("greet ".length));
			else if( cmd === "resetgreet" )
				self.resetGreeting( nick );
		}
	});
};

Greeter.prototype.resetGreeting = function( nick ) {
	var self = this;
	
	if( self.greetings[nick] !== undefined ) {
		delete self.greetings[nick];
		self.saveGreetings();
	}
		
};

Greeter.prototype.loadGreetings = function() {
	var self = this;
	
	var data = new String(fs.readFileSync( self.options.filename ));

	self.greetings = JSON.parse(data);
};

Greeter.prototype.saveGreetings = function() {
	var self = this;
	
	var data = self.greetings;
	
	fs.writeFileSync( self.options.filename, JSON.stringify( data ) );
	
};

Greeter.prototype.getGreeting = function( nick ) {
	var self = this;
	if( self.greetings[nick] !== undefined )
		return self.greetings[nick];
		
	return undefined;
}

Greeter.prototype.updateGreeting = function( nick, greeting ) {
	var self = this;
	
	if(!nick || !greeting) 
		return;
	
	self.greetings[ nick ] = greeting;
	
	//console.log( JSON.stringify( self.greetings ) );
	
	self.saveGreetings();
};