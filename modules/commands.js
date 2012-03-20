var util = require('util');
var http = require('http');

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

		if( message === 'streams' ) {
			self.streams( from, to, message );
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

Commands.prototype.streams = function( from , to, message ) {
	var self = this;
	
	var options = {
	  host: 'liveql.com',
	  port: 80,
	  method: 'GET'
	};

	var qlRanksRequest = http.get(options, function(res) {

		var data = [];
		
		res.on('data', function(chunk) {
			data.push( chunk );
		});

		res.on('end', function() {
			data = data.join('');

			var streams = data.split('<\/option>');

			streams = streams.slice( 1, streams.length-1 );

			for( var i in streams ) {
				if( streams[i].indexOf('class="off"') > 0 || streams[i].indexOf('++++++++++') > 0 || streams[i].indexOf('class') == -1)
					continue;

				var url = streams[i].match(/value="(.*?)">/)[1];
				var name = streams[i].substring( streams[i].indexOf('>')+1 );

				self.bot.say( to, util.format('\u0002%s\u0002 -> http://liveql.com?s=%s', name, url) );
			}
		});
	});	
};

