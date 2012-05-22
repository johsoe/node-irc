var http = require('http');
var fs = require('fs');

var stock = {
	'value' : '0',
	'updated' : '',
	'opening_price' : '',
	'date' : ''
};

exports.init = function( bot ) {
	return new Stock( bot );
}

var Stock = function( bot ) {
	var self = this;
	
	self.bot = bot;
	
	self.filepath = 'modules/stock.json';

	self.bot.on('pm', function(nick, message) {
		if( message == 'fisk' ) {
			self.getCommodity( nick );
		}
	});
	
	setTimeout( function() {
		self.getCommodity( '' );
	}, 1000*60*60*24 );
}

Stock.prototype.getCommodity = function( nick ) {
	var self = this;
	// <span class="current-value">
    //            24.55
    //        </span>
    
    var options = { //view-source:http://mobile.bloomberg.com/apps/quote?ticker=NOSMFSVL:IND
	  host: 'mobile.bloomberg.com',
	  path: '/apps/quote?ticker=NOSMFSVL:IND'
	};
	
	var req = http.get(options, function( res ) {
		var data = [];
		
		res.on('data', function( chunk ) {
			data.push( chunk );
		});
		
		res.on('end', function() {
			data = data.join('');
			var startPos = data.indexOf('<span class="stock-up">') + '<span class="stock-up">'.length;
			var endPos = data.indexOf('\n', startPos);
			
			//console.log( 'startPos ' + startPos + ' endPos ' + endPos );
			
			var value = data.substring( startPos, endPos );
			
			//console.log('Data: ' + value);
			
			var startPos = data.indexOf('<div class="update">') + '<div class="update">'.length;
			var endPos = data.indexOf('</div>', startPos);
			//console.log( 'startPos ' + startPos + ' endPos ' + endPos );
			var update = data.substring( startPos, endPos );
			
			//console.log( 'Update: ' + update );
			
			stock.value = value;
			stock.updated = update;
			
			self.getOpen( stock, nick );
		});
	});
    
	
}

Stock.prototype.getOpen = function( stock, nick ) {
	var self = this;
	
    var options = { //http://investing.businessweek.com/research/stocks/snapshot/snapshot.asp?ticker=GSF:NO
	  host: 'investing.businessweek.com',
	  path: '/research/stocks/snapshot/snapshot.asp?ticker=GSF:NO'
	};
	
	var req = http.get(options, function( res ) {
		var data = [];
		
		res.on('data', function( chunk ) {
			data.push( chunk );
		});
		
		/*
		<div class="quoteHeading floatL">OPEN</div>
				<div class="quoteData">3.95 <span class="xSmGreyTxt">NOK</span></div>
		*/
		
		res.on('end', function() {
			data = data.join('');
			data = data.replace('\t', '');
			data = data.replace('\n', '');
			var startPos = data.indexOf('<div class="quoteData">') + '<div class="quoteData">'.length;
			var endPos = data.indexOf(' ', startPos);
			
			//console.log( 'startPos ' + startPos + ' endPos ' + endPos );
			
			var open = data.substring( startPos, endPos );
			
			//console.log('Data: ' + open);
			
			stock.opening_price = open;
			stock.date = new Date().getTime();
			
			self.saveFile( stock, nick );
		});
	});
    
	
}

Stock.prototype.saveFile = function( stock, nick ) {
	var self = this;
	
	fs.readFile( self.filepath , function (err, data) {
		if (err) throw err;
		
		var stocks = JSON.parse( data );
		
		var exists = false;
		
		for( var i in stocks ) {
			if( stocks[ i ].updated == stock.updated )
			 exists = true;
		}
		
		//console.log( "exists: " + exists );
		
		if(!exists) {
			stocks.push( stock );
			var jsondata = JSON.stringify( stocks );
			
			fs.writeFile( self.filepath , jsondata, function (err) {
				if (err) throw err;
				
				//console.log('It\'s saved!');
			});
		}
		
		if(nick == '') {
			return;
		}
		
		stocks.sort(function(a,b) {
			return b.date - a.date;
		});
		
		var len = (stocks.length >= 3) ? 3 : stocks.length;
		
		self.bot.say( nick, 'Seneste opdateringer:' );
		for( var i = 0; i < len; i++ ) {
			self.bot.say( nick, 'Commodity: ' + stocks[i].value + ' Opdateret: ' + stocks[i].updated + ' Opening price: ' + stocks[i].opening_price);
		}
				

	});
	
	
}

