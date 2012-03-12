var https = require('https'),
	http  = require('http'),
	pm	  = require('./../passwordmanager'),
	url   = require('url');

exports.Quakelink = Quakelink;
exports.init = function( bot ) {
	return new Quakelink( bot );
}

function Quakelink( botref ) {
	var self = this;
	
	self.bot = botref;
	
	self.loginopt = {
		'user' : pm.ql.user,
		'pass' : pm.ql.pass
	};
	
	self.gamestates = {
		"PRE_GAME" : "Warmup",
		"IN_PROGRESS" : "In progress"
	};
	
	self.locations = {
		"44" : "Moscow",
		"32" : "Warsaw",
		"39" : "Bucharest", 
		"29" : "Stockholm",
		"28" : "Madrid",
		"20" : "Paris",
		"19" : "Maidenhead (UK)",
		"18" : "Frankfurt",
		"17" : "Amsterdam"
	};
	
	self.sessionKey = '';
	
	self.bot.on('message', function(from, to, message) {
		
		if( message.indexOf(" ") >= 0 ) {
			var messages = message.split(" ");
			
			for(var i in messages ) {
				if( messages[i].indexOf("quakelive.com") >= 0 && messages[i].indexOf("join/") >= 0 ) {
					//console.log("Searching for: " + messages[i]);
					self.search( messages[i], to );
				}
			}
		}
		
		else if( message.indexOf("quakelive.com") >= 0 && message.indexOf("join/") >= 0 ) {
			//console.log("Searching for: " + message);
			self.search( message, to );
		}
	});
}

Quakelink.prototype.getMatchDetails = function( info ) {
	//"http://www.quakelive.com/browser/details?_=" + System.currentTimeMillis() + "&ids=" + serverid;
	var self = this;
	var options = {
	  host: 'www.quakelive.com',
	  port: 80,
	  path: '/browser/details?_='+new Date().getTime()+'&ids='+info.serverid,
	  method: 'GET'
	};
	
	//console.log( "--> Getting matchdetails from: " + options.host + options.path );
	
	var matchRequest = http.get(options, function(res) {
		var data = [];
		res.on('data', function(chunk) {
			data.push( chunk );
		});
		
		res.on('end', function() {
			//console.log('data: ' + data);
			
			if( new String( data ).match( /503 Service Unavailable/i ) ) {
				self.bot.say( info.channel, "Quakelive overloaded :\\ " );
			}
			
			try {
				data = JSON.parse( data );
			} catch(err) {
				// do something? :DDDD
				return;
			}
			
			data = data[0];
			
			if(!data)
				return;
			
			var gameinfo = data.game_type_title + " ";
			var gamestate = (typeof self.gamestates[ data.g_gamestate ] === 'string') ? self.gamestates[ data.g_gamestate ] : data.g_gamestate;
			var location = (typeof self.locations[ data.location_id ] === 'string') ? self.locations[ data.location_id ] : data.location_id;
			var specs;
			
			if( data.num_clients > data.num_players )
				specs = data.num_clients - data.num_players;
			
			if( info.password )
				gameinfo 	+= "(" + gamestate + " - qlprism://r/join/"+ info.serverid + " - "+data.host_address+" - password: " + info.password + ")";
			else
			 	gameinfo 	+= "(" + gamestate + " - qlprism://r/join/"+ info.serverid + " - "+data.host_address+")";
			
			if( data.owner ) 
				gameinfo   	+= " - spawned by " + data.owner;
			
			gameinfo 	   	+= " on " + data.map_title + " - " + data.num_players + "/" + data.max_clients;

			if( specs )
			    gameinfo    += " (" + specs + " specs)";
			
			gameinfo		+= " in " + location;
			
			//console.log( gameinfo );
			self.bot.say( info.channel, gameinfo );
			
		});
	});
}

Quakelink.prototype.getRSVP = function( info ) {
	var self = this;
	var cookiestring = "QLALU=qldkbot; QLALP=e03b2ec5bb6803d7b142c68339802568a8be2aab; quakelive_ses="+self.sessionKey+";";
	
	var link = info.url;
	info['serverid'] = link.substring( link.indexOf('join/')+'join/'.length );
	
	// http://www.quakelive.com/request/rsvp?_="+System.currentTimeMillis()+"&inv_code="+serverid
	var options = {
	  host: 'www.quakelive.com',
	  port: 80,
	  path: '/request/rsvp?_='+new Date().getTime()+'&inv_code='+info['serverid'],
	  method: 'GET'
	};
	
	// console.log( options );
	
	var rsvpRequest = http.request(options, function(res) {
		var data = [];
		res.on('data', function(chunk) {
			data.push( chunk );
		});
		
		res.on('end', function() {
			//console.log('rsvpdata: ' + data);
			
			// noget fuckede op :|
			if( data.join('').match( /Your browser sent an invalid request/i ) )
				return;
			
			data = JSON.parse( data );
			
			// something went wrong, server prolly not up anymore
			if( data.ECODE === "-1" )
				return;
			
			info['password'] = data.password;
			// self spawned server, serverid = player_id
			info['serverid'] = data.player_id;
			
			self.getMatchDetails( info );
		});
	});
	
	rsvpRequest.setHeader('Cookie', cookiestring );
	rsvpRequest.setHeader("Content-Type", "application/x-www-form-urlencoded");
	
	rsvpRequest.end();
}

Quakelink.prototype.loginCheck = function( info ) {
	var self = this;
	var cookiestring = "quakelive_ses="+self.sessionKey+";";
	
	var options = {
	  host: 'www.quakelive.com',
	  port: 80,
	  path: '/user/login_cookie_check',
	  method: 'GET'
	};
	
	var loginCheckRequest = http.request(options, function(res) {
		
		res.on('end', function() {
			// reset sessionkey after 5 mins
			setTimeout(function( self ) {
				self.sessionKey = '';
			}, 1000*60*5);
			
			self.getRSVP( info );
		});
	});
	
	loginCheckRequest.setHeader('Cookie', cookiestring );
	loginCheckRequest.setHeader("Content-Type", "application/x-www-form-urlencoded");
	
	loginCheckRequest.end();
	
}

Quakelink.prototype.login = function( info ) {
	var self = this;
	var postdata = "submit=&email="+self.loginopt.user+"&pass="+self.loginopt.pass;
	
	var options = {
	  host: 'secure.quakelive.com',
	  port: 443,
	  path: '/user/login',
	  method: 'POST'
	};

	var loginRequest = https.request(options, function(res) {
	  res.on('end', function() {
		  //console.log("statusCode: ", res.statusCode);
		  //console.log("headers: ", res.headers);

		  var setcookie = res.headers['set-cookie'].toString();
		  var qlses 	= setcookie.match( /quakelive_ses=(.*?);/i )[1];
		
		  self.sessionKey = qlses;
		
		  //console.log('Got sessionkey: ' + self.sessionKey + ". Submitting cookiestring in loginCheck()");
		  if( self.sessionKey.length === 0 )
		  	self.loginCheck( info );
		  else
		  	self.getRSVP( info );
	  });
	});
	
	loginRequest.setHeader('Content-Length', postdata.length );
	loginRequest.setHeader("Content-Type", "application/x-www-form-urlencoded");
	
	loginRequest.end( postdata );
};

Quakelink.prototype.search = function( url, channel ) {
	var self = this;
	var serverid = url.substring( url.indexOf('join/')+'join/'.length );
	
	// dont do this on #qlpickup.eu / qlbot does it also
	// Banned from playquake cos nazi admins?
	if( channel === "#qlpickup.eu" || channel === "#playquake" )
		return;
	/*
		Short ids is ordinary PUBLIC_ID
		Longer is invitation, where we can get password too
	*/
	if( serverid.length < 10 ) {
		self.getMatchDetails({'serverid':serverid, 'channel':channel});
	} else {
		self.login({'url':url, 'channel':channel});
	}
}
