var util    = require('util');
var pm		= require('./passwordmanager');
var mh		= require('./modulehandler');
var irc 	= require('./lib/irc');


// Setup bot instance
var nick = 'Preben';
var bot = new irc.Client('se.quakenet.org', nick, {
    debug: false,
    channels: pm.channels
    //channels: ["#4j"]
});

// Start pluginhandler
var modulehandler = new mh.ModuleHandler( bot );

// Auth in Q
bot.on('motd', function(motd) {
	bot.say( 'Q@CServe.quakenet.org', util.format('AUTH %s %s', pm.qnet.quser, pm.qnet.qpass) );
	bot.send( 'MODE',  nick, '+x');
});

// Catch exceptions
process.on('uncaughtException', function ( err ) {
	util.log( util.format('uncaughtException bobbled up --> %s', err) );
	util.log( err.stack );
});
