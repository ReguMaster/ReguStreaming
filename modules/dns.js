/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const DNS = {};
const superagent = require( "superagent" );
const hook = require( "../hook" );
const config = require( "../config" );

DNS.refresh = function( )
{
    superagent.get( config.DNS_REFRESH_URL )
        .then(
            function( res )
            {
                if ( res.statusCode === 200 )
                {
                    var text = res.text;

                    if ( text.substring( 0, 7 ) === "success" )
                    {
                        Logger.write( Logger.LogType.Event, `[DNS] DNS Updated. (API Success : ${ text })` );
                    }
                    else
                        Logger.write( Logger.LogType.Error, `[DNS] Failed to process DNS.refresh -> (API Failed : ${ text })` );
                }
                else
                {
                    throw new Error( "HTTP error code : " + res.statusCode );
                }
            } )
        .catch( function( err )
        {
            Logger.write( Logger.LogType.Error, `[DNS] Failed to process DNS.refresh -> (${ err.stack })` );
        } );
}

module.exports = DNS;