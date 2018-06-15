/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const BanManager = { };
const path = require( "path" );
const consoleColor = require( "colors" );
const Main = require( "../app.js" );
const Logger = require( "./logger.js" );

BanManager.test = 110;

BanManager._list = [
// {
	// duration: 0,
	// why: "doshigati!"
// }
	// "1.224.53.166"
];
BanManager.register = function( ipAddress, reason )
{
	BanManager._list.push( {
		identification: ipAddress,
		duration: 0,
		why: reason
	} );
}

BanManager.getCount = function( )
{
	return this._list.length;
}

BanManager.remove = function( )
{
	
}

BanManager.isBanned = function( ipAddress )
{
	var banData = { banned: false };
	
	this._list.some( function( ban )
	{
		if ( ban.identification == ipAddress )
		{
			banData.banned = true;
			banData = ban;
			return true;
		}
	} );
	
	return banData;
}

module.exports = BanManager;