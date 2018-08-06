/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const dataStream = {};
const ClientManager = require( "./client" );

dataStream.sendMessageToAll = function( roomID, messageID, data, filterArray )
{
    ClientManager.sendMessageToAll( roomID, messageID, data, filterArray );
}

module.exports = dataStream;