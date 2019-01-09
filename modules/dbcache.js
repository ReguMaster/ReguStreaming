/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const DatabaseCache = {
    _cacheData:
    {}
};
const Server = require( "../server" );
const Logger = require( "./logger" );
const util = require( "../util" );
const QueueManager = require( "./queue" );
const ChatManager = require( "./chat" );
const hook = require( "../hook" );

DatabaseCache.register = function( id, expire, data )
{
    this._cacheData[ id ] = {
        data: data,
        _expireTimer: null
    };

    Logger.info( `[DBCache] Database result stored to [${ id }] Cache. (expire: ${ expire })` );

    if ( expire !== 0 )
    {
        this._cacheData[ id ]._expireTimer = setTimeout( function( )
        {
            DatabaseCache.remove( id );
        }, expire );
    }
}

DatabaseCache.remove = function( id )
{
    if ( this._cacheData[ id ]._expireTimer )
        clearTimeout( this._cacheData[ id ]._expireTimer );

    this._cacheData[ id ] = null;
    delete this._cacheData[ id ];

    Logger.info( `[DBCache] Database result removed from [${ id }] Cache.` );
}

DatabaseCache.removeAll = function( )
{
    var keys = Object.keys( this._cacheData );
    var length = keys.length;

    for ( var i = 0; i < length; i++ )
    {
        if ( this._cacheData[ keys[ i ] ]._expireTimer )
            clearTimeout( this._cacheData[ keys[ i ] ]._expireTimer );
    }

    this._cacheData = {};
}

DatabaseCache.fetch = function( id )
{
    if ( !DatabaseCache.exists( id ) ) return null;

    Logger.info( `[DBCache] Database result feteched from Cache. (id: ${ id })` );

    return this._cacheData[ id ].data;
}

DatabaseCache.exists = function( id )
{
    return this._cacheData.hasOwnProperty( id );
}

module.exports = DatabaseCache;