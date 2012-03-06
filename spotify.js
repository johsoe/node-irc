var http = require('http');

exports.SpotifyListener = SpotifyListener;
exports.init = function( bot ) {
	return new SpotifyListener( bot );
}


function SpotifyListener( botref ) {
	var self = this;
	
	self.bot = botref;
	
	self.bot.on('message', function(from, to, message) {
		if( message.indexOf("http://open.spotify.com/track") >= 0 )	
			self.search( to, message );
	});
}

SpotifyListener.prototype.search = function( channel, message ) {
	var self	= this;
	var trackid = message.substring( (message.indexOf("track/") + "track/".length) );
	
	var options = { //https://gdata.youtube.com/feeds/api/videos/QdrXCjZOqDQ?v=2
	  host: 'open.spotify.com',
	  path: '/track/' + trackid
	};
	
	var req = http.get(options, function( res ) {
		var data = [];
		
		res.on('data', function( chunk ) {
			data.push( chunk );
		});
		
		res.on('end', function() {
			var title = data.join('').match( /\<title\>(.*?)\ on Spotify<\/title\>/i );
			
			if( title[1] )
				self.bot.say( channel, '\u0002Spotify\u0002: ' + title[1] );
		});
	});
}
