

exports.Commands = Commands;

exports.init = function( bot ) {
	return new Commands( bot );
}

function Commands( botref ) {
	
	var self = this;
	
	self.bot = botref;
	
	self.bot.on('message', function(from, to, message) {
		
		if( message.indexOf("!decide") === 0 )	{
			self.decide( from, to, message );
		}
		
		if( message.toLowerCase().indexOf("men hvad synes preben?") === 0 )	{
			self.synes( from, to, message );
		}
		
		if( message.indexOf("Preben, hvornår skal ") == 0 ) {
			self.when( from, to, message );
		}

		if( message.indexOf("flip") === 0) {
			self.flip( from, to, message );
		}
		
		if( message.indexOf("Tærsk de maracas") === 0 )	{
			self.bot.say( to, "^_^;;" );
			self.bot.say( to, ";;^_^" );
			self.bot.say( to, "^_^;;" );
		}
		
		if( message === "br />" && from.indexOf("Lotte") === 0 ) {
			self.bot.say( to, "hihi altså Lotte! :-)" );
		}
		
		if( message === "opa opa" ) {
			self.bot.say( to, "http://www.youtube.com/watch?v=Dqzrofdwi-g&feature=player_detailpage#t=72s" );
		}
	});
	
	self.bot.on('join', function(channel, who) {
		if( who === "Lotte" )
			self.bot.say( channel, "Hihi hejsa Lotte! :))" );
	});
	
};

Commands.prototype.when = function( from, to, message ) {
	var startPos 	= "Preben, hvornår skal ".length;
	var q	 		= message.substring( startPos );
	var rand		= Math.random();
	var self		= this;
	var person 		= '';
	
	// jeg => du
	if( q.substring(0,3) == 'jeg' ) {
		person = 'du';
		q = q.substring( 'jeg '.length );
	// Some other name
	} else {
		person = q.substring(0, q.indexOf(' '));
		q = q.substring( person.length+1 );
	}
	
	if( q.length == 0 )
		return;
	
	if( rand < 0.2 ) {
		self.bot.say(to, "Synes "+person+" skal " + q + " LIGE NU!");
	}
	
	else if( 0.2 < rand < 0.4 ) {
		self.bot.say(to, "Synes "+person+" skal " + q + " om 1 times tid...");
	}
	
	else if( 0.4 < rand < 0.8 ) {
		self.bot.say(to, "Synes "+person+" skal " + q + " om et par timer :D");
	}
	
	else if( 0.8 < rand <= 1 ) {
		self.bot.say(to, "Synes ikke "+person+" skal " + q + " i dag :( ");
	}
	
}

Commands.prototype.decide = function( from, to, message ) {
	var self = this;
	var rand = Math.random();
	var choices = message.split(" ");
	
	if( choices.length < 2 )
		return;
	
	if( rand > 0.5 )
		self.bot.say( to, "Besluttede sig for: " + choices[1] );
	else
		self.bot.say( to, "Besluttede sig for: " + choices[2] );
};

Commands.prototype.flip = function( from, to, message ) {
	var self = this;
	var rand = Math.random();
	
	if( rand < 0.25 ) {
		self.bot.say( to, "\\     /")
		self.bot.say( to, " \\./ /" );	
		self.bot.say( to, "Det var ærgeligt :)" );
	}
	if( rand > 0.25 && rand < 0.5 ) {
		self.bot.say( to, "\\.    /")
		self.bot.say( to, " \\ / /" );	
		self.bot.say( to, "Flot!" );
	}
	if( rand > 0.5 && rand < 0.75 ) {
		self.bot.say( to, "\\   . /")
		self.bot.say( to, " \\ \\ /" );	
		self.bot.say( to, "Flot!" );
	}
	else if( rand > 0.75 ) {
		self.bot.say( to, "\\ .   /")
		self.bot.say( to, " \\ / /" );	
		self.bot.say( to, "Flot!" );
	}
};

Commands.prototype.synes = function( from, to, message ) {
	var self = this;
	var rand = Math.random();
	
	if( rand > 0.5 )
		self.bot.say( to, "Synes ikke godt om det :(" );
	else
		self.bot.say( to, "Haha! Synes da det lyder dejligt! :))))" );
};


