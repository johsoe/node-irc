
var util 	= require('util');
var http 	= require('http');
var https 	= require('https');
var pm 		= require('./passwordmanager')
//var junction = require('junction');
var User 	= require('./johsoe-xmpp/user');
var Client 	= require('./johsoe-xmpp/client');

exports.init = function( bot ) {
	return new QLChat( bot );
}

function QLChat( botref ) {
	var self = this;
	
	self.jid = "qldkbot@xmpp.quakelive.com/quakelive";
	self.qlident = '';
	self.sessionKey = '';
	self.bot = botref;
	self.xaid = "";
	
	
	self.bot.on('message#Fromage&champagne', function(from, message) {
		var cmd = message.split(' ')[0];
		var params = message.split(' ').splice(1);

		if( cmd === 'tell' ) {
			var nick = params[0];

			self.cl.sendMessage( nick, '<'+from+'> ' + params.splice(1).join('') );
		}

		if( cmd === 'track' ) {
			var nick = params[0]

			var user = self.cl.findUserByName( nick );

			if( !user.isOnline() ) {
				self.bot.say( '#Fromage&champagne', nick + ' er offline' );
				return;
			}

			if( user.status().length == 0 ) {
				self.bot.say( '#Fromage&champagne', nick + ' idler' );
				return;	
			}

			var userstatus = JSON.parse( user.status() );

			console.log('userstatus --> ', userstatus);

			self.bot.say( '#Fromage&champagne', nick + 'spiller på ' + userstatus.PUBLIC_ID );
		}
	});
	

	self.login();
}

QLChat.prototype.setupXMPP = function() {
	var self = this;
	
	self.cl = new Client({ 
		'jid' 		: self.jid,
    	'password' 	: self.xaid,
        'host' 		: "xmpp.quakelive.com",
    	'port' 		: 5222
    });

    self.cl.on('message', function( user, message ) {
    	self.onMessage( user, message );
    	console.log('QLChat received message from --> ', user, message);
    });

    self.cl.on('status', function( user ) {
    	//console.log('QLChat received statuschange from --> ', user);
    });
    
    self.cl.on('userOnline', function( user ) {
    	//console.log('QLChat received online user event --> ', user);
    });
    
}

QLChat.prototype.getELO = function( player, to ) {
	var self = this;

	var options = {
	  host: 'qlranks.com',
	  port: 80,
	  path: '/api.aspx?nick='+player,
	  method: 'GET'
	};
	
	console.log("QLChat.getELO()", options);

	var qlRanksRequest = http.get(options, function(res) {

		var data = [];
		
		res.on('data', function(chunk) {
			data.push( chunk );
		});

		res.on('end', function() {
			data = data.join('');

			data = JSON.parse( data );

			var msg = util.format('DUEL: %d\r\nTDM: %d\r\nCA: %d', data.players[0].duel.elo, data.players[0].tdm.elo, data.players[0].ca.elo);
			
			self.cl.sendMessage( to, msg );

		});
	});
}

QLChat.prototype.sendIRCMessage = function( user, message ) {
	var self = this;
	
	self.bot.say( '#Fromage&champagne', '\u0002QL ('+user.name()+')\u0002 ' + message );
}

QLChat.prototype.onMessage = function( from, msg ) {
	var self = this;
	var cmd = msg.split(' ')[0];
    
	//console.log('switch', cmd	);

    switch( cmd ) {
    	case 'elo':
    		self.getELO( msg.split(' ')[1], from );
    		break;
    	case 'irc':
    		self.sendIRCMessage( from, msg.substring(msg.indexOf(' ')+1) );
    		break;
    } 
};

QLChat.prototype.getXAID = function() {
	var self = this;
	//var cookiestring = "quakelive_ses="+self.sessionKey+";";
	var cookiestring = "QLALU=qldkbot; QLALP=e03b2ec5bb6803d7b142c68339802568a8be2aab; quakelive_ses="+self.sessionKey+";";
	
	var options = {
	  host: 'www.quakelive.com',
	  port: 80,
	  path: '/user/load?_='+new Date().getTime(),
	  method: 'GET',
	  headers: {
	  	"Accept" : "application/json, text/javascript, */*",
	  	"X-Requested-With" : "XMLHttpRequest",
	  	"x-ql-ident" : self.qlident,
	  	'Referer' : 'http://www.quakelive.com/',
	  	'Cookie' :  cookiestring,
	  	"Content-Type" : "application/x-www-form-urlencoded"
	  }
	};

	console.log("QLChat.getXAID()");
	
	var loginCheckRequest = http.get(options, function(res) {
		var data = [];
		
		res.on('data', function(chunk) {
			data.push( chunk );
		});
		
		res.on('end', function() {
			
			//console.log("xaiddata: " + data);

			self.xaid = data.join('').match( /\"XAID\":\"(.*?)\",/i )[1];
			//console.log("Parsed out xaid --> " + self.xaid);

			self.setupXMPP();
			
		});
	});
}

QLChat.prototype.loginCheck = function( ) {
	var self = this;
	var cookiestring = "quakelive_ses="+self.sessionKey+";";
	
	var options = {
	  host: 'www.quakelive.com',
	  port: 80,
	  path: '/user/login_cookie_check',
	  method: 'GET'
	};
	
	console.log("QLChat.loginCheck()");

	var loginCheckRequest = http.request(options, function(res) {
		
		res.on('end', function() {
			//console.log('CookieCheck --> ', res.headers);

			self.qlident = res.headers['x-ql-ident'].toString();

			// reset sessionkey after 5 mins
			setTimeout(function() {
				self.sessionKey = '';
			}, 1000*60*5);
			
			self.getXAID();
		});
	});
	
	loginCheckRequest.setHeader('Cookie', cookiestring );
	loginCheckRequest.setHeader("Content-Type", "application/x-www-form-urlencoded");
	
	loginCheckRequest.end();
	
}

QLChat.prototype.login = function( ) {
	var self = this;
	var postdata = "submit=&email="+pm.ql.user+"&pass="+pm.ql.pass;
	
	var options = {
	  host: 'secure.quakelive.com',
	  port: 443,
	  path: '/user/login',
	  method: 'POST'
	};

	console.log("QLChat.login()");

	var loginRequest = https.request(options, function(res) {
	  res.on('end', function() {
		  //console.log("statusCode: ", res.statusCode);
		  //console.log("headers: ", res.headers);

		  var setcookie = res.headers['set-cookie'].toString();
		  var qlses 	= setcookie.match( /quakelive_ses=(.*?);/i )[1];
		
		  self.sessionKey = qlses;
		
		  //console.log('Got sessionkey: ' + self.sessionKey + ". Submitting cookiestring in loginCheck()");
		  self.loginCheck( );
	  });
	});
	
	loginRequest.setHeader('Content-Length', postdata.length );
	loginRequest.setHeader("Content-Type", "application/x-www-form-urlencoded");
	
	loginRequest.end( postdata );
};