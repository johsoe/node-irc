var util    = require('util');
var pm		= require('./passwordmanager');
var mh		= require('./modulehandler');
var irc 	= require('./lib/irc');


// Setup bot instance
var nick = 'Preben';
var bot = new irc.Client('se.quakenet.org', nick, {
    debug: false,
    channels: ["#4j", "#playquake", "#quakelive.dk", "#quakelive.NO-TARD-ZONE", "#qlpickup.eu", "#tdmpickup", "#ensammaonanister", "#wh0reunit", "#Fromage&champagne"]
    //channels: ["#4j"]
});

// Start pluginhandler
var modulehandler = new mh.ModuleHandler( bot );

// Auth in Q
bot.on('motd', function(motd) {
	bot.say( 'Q@CServe.quakenet.org', util.log('AUTH %s %s', pm.qnet.quser, pm.qnet.qpass) );
	bot.send( 'MODE',  nick, '+x');
});

// Catch exceptions
process.on('uncaughtException', function (err) {
    console.log('uncaughtException bobbled up --> ', err);
});