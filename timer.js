/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const timer = {};
const Logger = require( "./modules/logger" );

timer._list = {};

timer.create = function( id, interval, loopCount, callback )
{
    var obj = {
        status: "running",
        id: id,
        interval: interval,
        loopCount: loopCount,
        callback: callback,
        _unlimitedLoop: loopCount === 0,
        _intervalObj: null
    }

    var intervalFunc;

    if ( obj._unlimitedLoop )
        intervalFunc = function( )
        {
            obj.callback( );
        }
    else
        intervalFunc = function( )
        {
            if ( --obj.loopCount >= 0 )
            {
                obj.callback( );

                if ( obj.loopCount === 0 )
                    this.remove( obj.id, "Loop limit reached" );
            }
        }

    obj._intervalObj = setInterval( intervalFunc, interval );

    this._list[ id ] = obj;
}

timer.exists = function( id )
{
    console.log( this );
    return !!this._list[ id ];
}

timer.remove = function( id, reason = "undefined" )
{
    if ( !this._list[ id ] )
    {
        Logger.warn( `[Timer] Failed to remove timer '${ id }'. (reason:Not Exists!)` )
        return;
    }

    var timerObj = this._list[ id ];

    clearInterval( timerObj._intervalObj );
    this._list[ id ] = null;
    delete this._list[ id ];

    Logger.info( `[Timer] Timer '${ id }' removed. (reason:${ reason })` )
}

module.exports = timer;