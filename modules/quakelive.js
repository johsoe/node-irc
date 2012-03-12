var util = require( 'util' ),
	http = require( 'http' );


exports.Quakelive = Quakelive;

exports.init = function( bot ) {
	return new Quakelive( bot );
}

function Quakelive( botref ) {

	var self = this;
	self.bot = botref;
	
	self.cache = {};
	
	self.urls = {
		host: 'www.quakelive.com',
		stats: '/profile/summary/',
		matchstats: '/stats/matchdetails/'
	};
	
	//self.bot.on
	self.bot.on('message', function (from, to, message) {
		var nick = "";
		
		if( to === "#qlpickup.eu" || to === "#playquake" || to === "#tdmpickup")
			return;
		
		//console.log( message.substring(0,8) );
		
		if( message === "!lastgame" ) {
			nick = self.translateNick( from );
			self.getLastGame( nick, to, 1 );
		}
		
		if( message === "!lastegame" && (from === "hizapp" || from === "zappa" || from === "zappa_") ) 
			self.getLastGame( "hizapp", to, 1 );
		
		else if( message.substring(0,9) === "!lastgame" && message.indexOf(" ") > 0) {
			
			/* Third parameter selects game 
			   !lastgame rahzei 3
			*/
			if (message.split(" ").length == 3 ) {
				var msgs = message.split(" ")
				var gamenum = msgs[2];
				nick = self.translateNick( msgs[1] );

				self.getLastGame( nick, to, gamenum );
			}
			/* !lastgame rahzei */
			else {
				nick = self.translateNick( message.substring( message.indexOf(" ")+1 ) );
				
				self.getLastGame( nick, to, 1 );
			}
				
		}
	});
	
};

Quakelive.prototype.translateNick = function( from ) {

	var nicks = {
		"jesper" 			: "exooo",
		"battery\\exooo" 	: "exooo",
		"henrik" 			: "pb",
		"johnny"			: "rahzei",
		"rhz"				: "rahzei",
		"zera_"				: "zera",
		"søren"				: "zera",
		"clone`KillaloT"	: "killalot",
		"asger"				: "killalot",
		"zappa"				: "hizapp",
		"hizappa"			: "hizapp",
		"fredrik"			: "hizapp",
		"BATTERY\\EXOOO" 	: "exooo",
		"stefan"			: "beffy",
		"daxie"				: "beffy",
		"bjørn"				: "amOkchen"
	};
	
	if( nicks[from] !== undefined )
		from = nicks[from];
		
	return from;	
}

Quakelive.prototype.makeRequest = function( options, callback ) {
	var self = this;
	
	/*
		connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
	    connection.setRequestProperty("Referer", "http://www.quakelive.com/");
	    connection.setRequestProperty("X-Requested-With", "	XMLHttpRequest");
	*/
	options.headers = {
		'Referer' : 'http://www.quakelive.com',
		'X-Requested-With' : 'XMLHttpRequest'
	};
	
	//console.log( options );
	
	http.get(options, function(res) {
		//console.log("Got response: " + res.statusCode);
		
		var data = [];
		var selfoptions = options;
		
		res.on('data', function(chunk) {
	    	data.push(chunk);
	    });
	
		res.on('end', function() {
	        data = data.join('');
			
			if (callback && typeof(callback) === "function") {
				callback.call(self, data, options);
			}
	    });
	});
};

Quakelive.prototype.getLastGame = function( nick, channel, gamenum ) {
	var self = this;
	var options = {
		host: self.urls.host,
		port: 80,
		//path: self.urls.matchstats+gameid+"/"+mode,
		path: self.urls.stats + nick + "?_="+new Date().getTime(),
		'nick': nick,
		'channel': channel,
		'gamenum': gamenum,
		'headers' : {}
	};

	self.makeRequest( 
		options, 
		self.getLastGameID
	);	
};

Quakelive.prototype.getLastGameID = function( data, options ) {
	var self = this;
	//var games = [];
	var gameid;
	var mode;
	var match = data.match( /<div style="width: 33%; text-align: center; float: left" class="prf_map recent_match interactive" id="(.*?)_(.*?)_(.*?)">/g );
	
	if( !match ) {
		return;
	}
	

	if( options.gamenum > 3 ) 
		options.gamenum = 3;
	if( options.gamenum <= 1 )
		options.gamenum = 1;

	var info = match[ --options.gamenum ].match( /id="(.*?)_(.*?)_(.*?)">/ );

	mode   = info[1];
	gameid = info[2];

	var newoptions = {
		host: self.urls.host,
		port: 80,
		path: self.urls.matchstats + gameid + "/" + mode,
		'channel': options.channel,
		'mode': mode,
		'nick': options.nick,
		'gameid' : gameid
	};
	
	/* Cache exists, use that */
	if( typeof self.cache[ gameid ] !== 'undefined' )
		self.parseLastGame( self.cache[ gameid ], newoptions );
	
	/* No cache, do the request */
	else
		self.makeRequest( newoptions, self.parseLastGame);
		
	
};

Quakelive.prototype.parseLastGame = function( data, options ) {
	var self = this;
	
	/* Save data to cache */
	self.cache[ options.gameid ] = data;
	
	/* Parse JSON */
	try {
		data = JSON.parse( data );
	} catch(err) {
		LOG.writeError('ParseLastGame error -> data received couldnt be parsed: ' + err);
		if(err.stack)
			LOG.writeError('Stack: ' + err.stack);
			
		return;
	}

	/* Clear cache data after some time */
	setTimeout(function() {
		if( typeof self.cache[ options.gameid ] !== 'undefined' )
			delete self.cache[ options.gameid ];
	}, 5*60*1000);
	
	/* Pretty print JSON data */
	switch(options.mode) {
		
		// %s siden på %s med %s%% accuracy | Red %s - %s Blue | Damage: (%s given/%s taken) | RL: %s%%(%s) LG: %s%%(%s) RG: %s%%(%s) "
		case "ca":
			var msg = "";
			var playerdata;
			
			// check if dude was on red team
			for(var i in data.RED_SCOREBOARD) if( data.RED_SCOREBOARD[i].PLAYER_NICK.toLowerCase() === options.nick.toLowerCase() ) {
				playerdata = data.RED_SCOREBOARD[i];
			};
			// check if dude was on blue team
			for(var i in data.BLUE_SCOREBOARD) if( data.BLUE_SCOREBOARD[i].PLAYER_NICK.toLowerCase() === options.nick.toLowerCase() ) {
				playerdata = data.BLUE_SCOREBOARD[i];
			};
			
			// TODO: player was SPEC
			if( !playerdata )
				return;
			/*
			msg = data.GAME_TIMESTAMP_NICE + " ago on " + data.MAP_NAME + " with " + playerdata.ACCURACY + "% accuracy on team " + playerdata.TEAM + " | ";
			msg += "Red " + data.TSCORE0 + ":" + data.TSCORE1 + " Blue | ";
			msg += "Damage done: " + playerdata.DAMAGE_DEALT + " | ";
			msg += "RL: " + playerdata.RL_A + "%("+playerdata.RL+" kills) LG: " + playerdata.LG_A + "%("+playerdata.LG+" kills) RG: " + playerdata.RG_A + "%("+playerdata.RG+" kills)";
			*/
			msg = util.format(
				'%s ago on \u0002%s\u0002 with %s%% accuracy on %s team | Red \u0002%d\u0002:\u0002%d\u0002 Blue | Damage done: %d | RL: \u0002%d%%\u0002(%d kills) LG: \u0002%d%%\u0002(%d kills) RG: \u0002%d%%\u0002(%d kills)',
				data.GAME_TIMESTAMP_NICE, data.MAP_NAME, playerdata.ACCURACY, playerdata.TEAM, data.TSCORE0, data.TSCORE1, playerdata.DAMAGE_DEALT, 
				playerdata.RL_A, playerdata.RL, playerdata.LG_A, playerdata.LG, playerdata.RG_A, playerdata.RG
			);

			self.bot.say( options.channel, msg );
			
			break;
			
		case "ctf":
			var firstmsg = "";
			var secondmsg = "";
			var playerdata;
			
			// check if dude was on red team
			for(var i in data.RED_SCOREBOARD) if( data.RED_SCOREBOARD[i].PLAYER_NICK.toLowerCase() === options.nick.toLowerCase() ) {
				playerdata = data.RED_SCOREBOARD[i];
			};
			// check if dude was on blue team
			for(var i in data.BLUE_SCOREBOARD) if( data.BLUE_SCOREBOARD[i].PLAYER_NICK.toLowerCase() === options.nick.toLowerCase() ) {
				playerdata = data.BLUE_SCOREBOARD[i];
			};
			
			// TODO: player was SPEC
			if( !playerdata )
				return;
			/*
			firstmsg  = data.GAME_TIMESTAMP_NICE + " ago on " + data.MAP_NAME + " on team " + playerdata.TEAM + " | ";
			firstmsg += "RED " + data.TSCORE0 + " : " + data.TSCORE1 + " BLUE | ";
			firstmsg += "Most caps: " + data.MOST_CAPTURES.PLAYER_NICK + " with " + data.MOST_CAPTURES.NUM + " caps";
			*/
			firstmsg = util.format(
				'%s ago on \u0002%s\u0002 on team %s | RED \u0002%d\u0002:\u0002%d\u0002 BLUE | Most caps: %s with %d caps',
				data.GAME_TIMESTAMP_NICE, data.MAP_NAME, playerdata.TEAM, data.TSCORE0, data.TSCORE1, data.MOST_CAPTURES.PLAYER_NICK, data.MOST_CAPTURES.NUM
			);

			/*
			secondmsg  = "Score: " + playerdata.SCORE + " | Damage done: " + playerdata.DAMAGE_DEALT + " | ";
			secondmsg += "Kills/Deaths: " + playerdata.KILLS + "/" + playerdata.DEATHS + " | ";
			secondmsg += "Caps: " + playerdata.CAPTURES + " Defs: " + playerdata.DEFENDS + " Assists: " + playerdata.ASSISTS + " | ";
			secondmsg += "MG: " + playerdata.MG_A + "% ("+playerdata.MG+" kills) LG: " + playerdata.LG_A + "% ("+playerdata.LG+" kills) ";
			secondmsg += "RL: " + playerdata.RL_A + "% ("+playerdata.RL+" kills) RG: " + playerdata.RG_A + "% ("+playerdata.RG+" kills)";
			*/
			secondmsg = util.format(
				'Score: \u0002%d\u0002 | Damage: \u0002%d\u0002 | \u0002%d\u0002 kills / \u0002%d\u0002 deaths | Caps: \u0002%d\u0002 Defs: \u0002%d\u0002 Assists: \u0002%d\u0002 | MG: \u0002%d%%\u0002(%d kills) LG: \u0002%d%%\u0002(%d kills) RL: \u0002%d%%\u0002(%d kills) RG: \u0002%d%%\u0002(%d kills)',
				playerdata.SCORE, playerdata.DAMAGE_DEALT, playerdata.KILLS, playerdata.DEATHS, playerdata.CAPTURES, playerdata.DEFENDS, playerdata.ASSISTS,
				playerdata.MG_A, playerdata.MG, playerdata.LG_A, playerdata.LG, playerdata.RL_A, playerdata.RL, playerdata.RG_A, playerdata.RG
			);

			self.bot.say( options.channel, firstmsg );
			self.bot.say( options.channel, secondmsg );
			//console.log( firstmsg );
			//console.log( secondmsg );
			//LOG.write( firstmsg );
			//LOG.write( secondmsg );

			break;
		
		// msg1 = time + " siden på " + map + " : " + player1nick + "("+player1acc+"%) " + player1score+":" + player2score + " ("+player2acc+"%)" + player2nick + " | RL: "+rla+"% ("+rlk+" kills) LG: "+lga+"% ("+lgk+" kills) RG: "+rga+"% ("+rgk+" kills)";	
		case "duel":
			var firstmsg  = "",
				secondmsg = "";
			//console.log( data );
			
			var playerdata = "";
			
			for(var i in data.SCOREBOARD) if(data.SCOREBOARD[i].PLAYER_NICK.toLowerCase() === options.nick.toLowerCase()) {
				playerdata = data.SCOREBOARD[i];
			}
			
			firstmsg   = data.GAME_TIMESTAMP_NICE + " ago on " + data.MAP_NAME + ": " + data.SCOREBOARD[0].PLAYER_NICK + " (" + data.SCOREBOARD[0].ACCURACY + "%) " + data.SCOREBOARD[0].SCORE + " : " + data.SCOREBOARD[1].SCORE + " ( " + data.SCOREBOARD[1].ACCURACY + "%) " + data.SCOREBOARD[1].PLAYER_NICK;
			firstmsg  += " | First kill: " + data.FIRST_SCORER + " | End game message: " + data.EXIT_MSG + " ";
			secondmsg  = "MG: " + playerdata.MG_A + "% ("+playerdata.MG+" kills) LG: " + playerdata.LG_A + "% ("+playerdata.LG+" kills) ";
			secondmsg += "RL: " + playerdata.RL_A + "% ("+playerdata.RL+" kills) RG: " + playerdata.RG_A + "% ("+playerdata.RG+" kills)";

			self.bot.say( options.channel, firstmsg );
			self.bot.say( options.channel, secondmsg );

			break;
		
		// "%s siden på %s | Frags: (%s/%s) | Damage (%s dealt/%s taken) | MG: %s%%(%s) SG: %s%%(%s) RL: %s%%(%s) LG: %s%%(%s) RG: %s%%(%s)",
		case "ffa":
			var msg;
			var playerdata;
			
			// check if dude was on red team
			for(var i in data.SCOREBOARD) if( data.SCOREBOARD[i].PLAYER_NICK.toLowerCase() === options.nick.toLowerCase() ) {
				playerdata = data.SCOREBOARD[i];
			};
			
			msg = data.GAME_TIMESTAMP_NICE + " ago on " + data.MAP_NAME + " with score: "+playerdata.SCORE+" and accuracy: "+playerdata.ACCURACY+"% | Winner: "+data.LAST_SCORER+" | Damage: " + playerdata.DAMAGE_DEALT + "/" + playerdata.DAMAGE_TAKEN + "| MG: " + playerdata.MG_A + "% ("+playerdata.MG+" kills) LG: " + playerdata.LG_A + "% ("+playerdata.LG+" kills) RL: " + playerdata.RL_A + "% ("+playerdata.RL+" kills) RG: " + playerdata.RG_A + "% ("+playerdata.RG+" kills)";

			self.bot.say( options.channel, msg );
			//console.log( data );

			break;
		
		// %s siden på %s med NET: %s (Frags: %s, Deaths: %s) - Damage: %s (Given: %s, Taken %s) | RL: %s%%(%s) LG: %s%%(%s) RG: %s%%(%s) ",
		case "tdm":
			var msg = "";
			var playerdata;
			
			// check if dude was on red team
			for(var i in data.RED_SCOREBOARD) if( data.RED_SCOREBOARD[i].PLAYER_NICK.toLowerCase() === options.nick.toLowerCase() ) {
				playerdata = data.RED_SCOREBOARD[i];
			};
			// check if dude was on blue team
			for(var i in data.BLUE_SCOREBOARD) if( data.BLUE_SCOREBOARD[i].PLAYER_NICK.toLowerCase() === options.nick.toLowerCase() ) {
				playerdata = data.BLUE_SCOREBOARD[i];
			};
			
			// TODO: player was SPEC
			if( !playerdata )
				return;
			
			/*
			msg = data.GAME_TIMESTAMP_NICE + " ago on " + data.MAP_NAME + " on team " + playerdata.TEAM + " | RED " + data.TSCORE0 + " : " + data.TSCORE1 + " BLUE | Frags: " + playerdata.KILLS + " Deaths: " + playerdata.DEATHS + " | Damage: " + playerdata.DAMAGE_DEALT + "/" + playerdata.DAMAGE_TAKEN + "| MG: " + playerdata.MG_A + "% ("+playerdata.MG+" kills) LG: " + playerdata.LG_A + "% ("+playerdata.LG+" kills) RL: " + playerdata.RL_A + "% ("+playerdata.RL+" kills) RG: " + playerdata.RG_A + "% ("+playerdata.RG+" kills)";
			*/

			msg = util.format(
				'%s ago on \u0002%s\u0002 on %s | \u00034RED\u0003 \u0002%d\u0002:\u0002%d\u0002 \u000302BLUE\u0003 | Frags: \u0002%d\u0002 Deaths: \u0002%d\u0002 | Damage: \u0002%d\u0002/\u0002%d\u0002 | MG: \u0002%d%%\u0002(%d kills) LG: \u0002%d%%\u0002(%d kills) RL: \u0002%d%%\u0002(%d kills) RG: \u0002%d%%\u0002(%d kills)',
				data.GAME_TIMESTAMP_NICE, data.MAP_NAME, playerdata.TEAM, data.TSCORE0, data.TSCORE1, playerdata.KILLS, playerdata.DEATHS, playerdata.DAMAGE_DEALT, playerdata.DAMAGE_TAKEN, 
				playerdata.MG_A, playerdata.MG, playerdata.LG_A, playerdata.LG, playerdata.RL_A, playerdata.RL, playerdata.RG_A, playerdata.RG
			);

			self.bot.say( options.channel, msg );
			//console.log( data );

			break;
	}
};