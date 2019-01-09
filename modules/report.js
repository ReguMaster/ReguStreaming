/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const ReportManager = {};
const Server = require( "../server" );
const Logger = require( "./logger" );
const util = require( "../util" );
const hook = require( "../hook" );
const Database = require( "./db" );

ReportManager.type = {
    userReport: 0,
    mediaReport: 1
};
ReportManager.write = function( client, type, extraData ) {

}

hook.register( "PostClientConnected", function( client, socket )
{
    socket.on( "RS.report", function( data )
    {
        if ( !util.isValidSocketData( data,
            {
                flag: "number"
            } ) )
        {
            Logger.write( Logger.type.Important, `[Vote] Vote flag request rejected! -> (#DataIsNotValid) ${ client.information( ) }` );
            return;
        }
    } );
} );

module.exports = ReportManager;