/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const BanManager = { };
const path = require( "path" );
const consoleColor = require( "colors" );
const Main = require( "../app.js" );
const LogManager = require( "./logmanager.js" );

BanManager.test = 110;

BanManager._list = [
	// "1.224.53.166"
];
BanManager.register = function( )
{
	
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
	if ( this._list.indexOf( ipAddress ) > -1 )
	{
		return {
			banned: true,
			duration: 0,
			why: "doshigatai!" // DOSHIGATAI
		}
	}
	else
	{
		return { banned: false };
	}
	// return false;
}

module.exports = BanManager;