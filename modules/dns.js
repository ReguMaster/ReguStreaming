/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const DNS = {};
const superagent = require( "superagent" );
const hook = require( "../hook" );
const timer = require( "../timer" );
const Logger = require( "./logger" );
const config = require( "../const/config" );

DNS.refreshing = false;
DNS.refresh = function( callback )
{
    if ( this.refreshing )
    {
        Logger.write( Logger.LogType.Warning, `[DNS] Refresh blocked, already refreshing!` );
        return;
    }

    Logger.write( Logger.LogType.Info, `[DNS] DNS refreshing ...` );

    this.refreshing = true;
    superagent.get( config.DNS_REFRESH_URL )
        .then(
            function( res )
            {
                if ( res.status !== 200 )
                    throw new Error( "HTTP status code : " + res.status );

                var text = res.text;
                var isSuccess = text.length >= 7 && text.substring( 0, 7 ) === "success";

                if ( isSuccess )
                    Logger.write( Logger.LogType.Event, `[DNS] DNS refreshed. (API result:${ text })` );
                else
                    Logger.write( Logger.LogType.Error, `[DNS] Failed to refreshing DNS. (API result:${ text })` );

                if ( callback )
                    callback( isSuccess );

                DNS.refreshing = false;
            } )
        .catch( function( err )
        {
            Logger.write( Logger.LogType.Error, `[DNS] Failed to process DNS.refresh -> (${ err.stack })` );
            DNS.refreshing = false;
        } );
}

timer.create( "DNS.refresh", 1000 * 60 * 60, 0, function( )
{
    DNS.refresh( );
} );

// hook.register( "Initialize", function( )
// {
// DNS.refresh( );
// } );
DNS.refresh( );

module.exports = DNS;