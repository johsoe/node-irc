exports.Pickup = Pickup;
exports.init = function( bot ) {
	return new Pickup( bot );
}

function Pickup( botref ) {
	var self = this;
	
	self.bot = botref;
	
	self.privchannel = "#quakelive.NO-TARD-ZONE";
	//self.privchannel = "#4j";
	
	self.tdm = {
		"tdm" : 0
	};
	
	self.playquake = {
		"ctf" : 0
	};
	
	self.bot.on('message', function(from, to, message) {
		self.msgListener( from, to, message );	
	});
	
	// channel, topic, nick
	self.bot.on('topic', function(channel, topic, nick) {
		self.topicListener( channel, topic, nick );	
	});
};

Pickup.prototype.topicListener = function( channel, topic, nick ) {
	var self = this;
	
	if( channel === "#tdmpickup" )
		self.updateTDMPickupTopic( channel, topic, nick );
	else if( channel === "#playquake" )
		self.updatePlayQuakeTopic( channel, topic, nick );
};

Pickup.prototype.msgListener = function( from, to, message ) {
	var self = this;
	
	if( to === "#tdmpickup" )
		self.addTDMPickup( from, message );
	if( to === "#playquake" )
		self.addPlayQuake( from, message );
	
	//console.log( "priv: " + self.privchannel + " to: " + to );
		
	if( to === self.privchannel && message === "pickup?") {
		self.bot.say( self.privchannel, "ctf ["+self.playquake.ctf+"/8] på #playquake" );
		self.bot.say( self.privchannel, "tdm ["+self.tdm.tdm+"/8] på #tdmpickup" );
	}
	
	if( to === "#Fromage&champagne" && message === "pickup?") {
		self.bot.say( "#Fromage&champagne", "ctf ["+self.playquake.ctf+"/8] på #playquake" );
		self.bot.say( "#Fromage&champagne", "tdm ["+self.tdm.tdm+"/8] på #tdmpickup" );
	}
}

Pickup.prototype.isWhore = function( nick ) {
	var self = this;
	
	if( !self.bot.chans[ self.privchannel ] )
		return;
	
    //var channel = self.bot.chans[ self.privchannel ];
    if ( 'string' == typeof self.bot.chans[ self.privchannel ].users[ nick ] ) {
        return true;
    }

    return false;
	
};

Pickup.prototype.isCreme = function( nick ) {
	var self = this;
	


	if( !self.bot.chans[ "#Fromage&champagne" ] )
		return;
	


    //var channel = self.bot.chans[ self.privchannel ];
    if ( 'string' == typeof self.bot.chans[ "#Fromage&champagne" ].users[ nick ] ) {
        return true;
    }

    return false;
	
};

Pickup.prototype.stripIllegalChars = function( topic ) {
	topic = topic.replace(/\u0001/g,'');
	topic = topic.replace(/\u0002/g,'');
	topic = topic.replace(/\u0003/g,'');
	topic = topic.replace(/\u0015/g,'');
	
	return topic;
}

Pickup.prototype.updatePlayQuakeTopic = function( channel, topic, nick ) {
	var self = this;
	
	//self.bot.say('rhz', "channel: " + channel + " | " + topic);

	topic = self.stripIllegalChars( topic );

	//self.bot.say('rhz', topic);

	// CTF7 [ 0 / 87 ] 
	var ctf = topic.match( /CTF7 \[ (.*?) \/ 87 \]/ );

	if( ctf ) {
		ctf = ctf[1];
	}
	
	self.playquake.ctf = ctf || 0;
};

Pickup.prototype.updateTDMPickupTopic = function( channel, topic, nick ) {
	var self = this;
	
	topic = self.stripIllegalChars( topic );
	
	var tdm = topic.match( /tdm \[(.*?)\/8\]/ );
	
	//console.log( topic );
	//console.log( tdm );
	
	if( tdm ) 
		tdm = tdm[1];
	
	self.tdm.tdm = tdm || 0;
};

Pickup.prototype.addPlayQuake = function( nick, message ) {
	var self = this;
	
	if( message.indexOf("!a") != 0 )
		return;
		
	self.playquake.ctf++;
	
	if( self.isWhore( nick ) ) {
		self.bot.say( self.privchannel, nick + " addede til ctf med [" + self.playquake.ctf + "/8] på #playquake" );		
	} 
	
	if(self.isCreme( nick ) ) {
		self.bot.say( "#Fromage&champagne", nick + " addede til ctf med [" + self.playquake.ctf + "/8] på #playquake" );
	}
};

Pickup.prototype.addTDMPickup = function( nick, message ) {
	var self = this;
	
	if(message.toLowerCase().indexOf("!add") != 0)
		return;
	
	self.tdm.tdm++;
		
	if( self.isWhore(nick) ) {
		self.bot.say( self.privchannel, nick + " addede til tdm med [" + self.tdm.tdm + "/8] på #tdmpickup" );
	}
	
	if( self.isCreme(nick) ) {
		self.bot.say( "#Fromage&champagne", nick + " addede til tdm med [" + self.tdm.tdm + "/8] på #tdmpickup" );
	}
};

