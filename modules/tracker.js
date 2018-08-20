/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const Tracker = {};
const hook = require( "../hook" );
const Database = require( "./db" );
const superagent = require( "superagent" );
const config = require( "../const/config" );

Tracker._whoisAPIKey = config.WHOIS_API_KEY;

Tracker.register = function( ipAddress, callback )
{
    Tracker.requestWHOIS( ipAddress, function( success, json )
    {
        if ( success )
        {
            json = json.whois;

            var addr = "";
            var orgName = "";

            if ( json.korean && json.korean.user && json.korean.user.netinfo )
            {
                addr = json.korean.user.netinfo.addr;
                orgName = json.korean.user.netinfo.orgName;
            }

            Database.query( `INSERT IGNORE INTO tracker ( _ipAddress, _protocolType, _registry, _countryCode, _addr, _orgName, _json ) VALUES ( '${ json.query }', '${ json.queryType }', '${ json.registry }', '${ json.countryCode }', '${ addr }', '${ orgName }', '${ JSON.stringify( json ) }' )`, function( status, result, fields )
            {
                if ( callback )
                    callback( status );
            } );
        }
    } );
}

Tracker.requestWHOIS = function( ipAddress, callback )
{
    superagent.get( `http://whois.kisa.or.kr/openapi/whois.jsp?query=${ ipAddress }&key=${ Tracker._whoisAPIKey }&answer=json` )
        .then( function( res )
        {
            if ( res.statusCode === 200 )
            {
                var json = JSON.parse( res.text );

                // console.log( util.inspect( json,
                // {
                //     depth: 100,
                //     showHidden: true
                // } ) );

                callback( true, json );
            }
            else
            {
                callback( false, null );
                throw new Error( "HTTP error code : " + res.statusCode );
            }
        } )
        .catch( function( err )
        {
            callback( false, null );
            Logger.write( Logger.LogType.Error, `[Queue] Failed to process Tracker.requestWHOIS (error:${ err.stack })` );
        } );
}

Tracker.get = function( ipAddress, callback, onError )
{
    Database.query( `SELECT _ipAddress, _registry, _countryCode FROM tracker WHERE _ipAddress = '${ ipAddress }'`, function( status, data )
    {
        if ( status === "success" && data.length > 0 )
            callback( data[ 0 ] );
        else
            callback( null );
    }, onError );
}

//countryCode
Tracker.getCountryCode = function( ipAddress, callback )
{
    Tracker.get( ipAddress, function( result )
    {
        if ( result )
        {
            callback( result._countryCode );
        }
        else
        {
            // 없으면 등록한 후 다시 검색 ...

            Tracker.register( ipAddress, function( status )
            {
                if ( status === "success" )
                {
                    Tracker.get( ipAddress, function( result2 )
                    {
                        if ( result2 )
                            callback( result2._countryCode );
                        else
                            callback( "ERROR" );
                    } );
                }
                else
                    callback( "ERROR" );
            } );
        }
    }, function( err )
    {
        callback( "ERROR" );
    } );
}

module.exports = Tracker;