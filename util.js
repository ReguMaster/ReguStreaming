/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const util = { };

// same as http://wiki.garrysmod.com/page/table/concat
Array.prototype.chain = function( concatenator, startIndex, endIndex )
{
	var newVal = "";
	
	if ( typeof endIndex == "undefined" )
		endIndex = this.length;
	
	for ( var i = startIndex; i < endIndex; i++ )
	{
		if ( i != endIndex - 1 )
			newVal = newVal + this[ i ] + concatenator;
		else
			newVal = newVal + this[ i ];
	}
	
	return newVal;
}

module.exports = util;