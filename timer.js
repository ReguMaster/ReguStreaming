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
                    timer.remove( obj.id, "Loop limit reached" );
            }
        }

    obj._intervalObj = setInterval( intervalFunc, interval );

    timer._list[ id ] = obj;
}

timer.remove = function( id, reason = "Not defined." )
{
    if ( !timer._list[ id ] )
    {
        Logger.write( Logger.LogType.Warning, `[Timer] Failed to remove timer '${ id }'. (reason:Not Exists!)` )
        return;
    }

    var timerObj = timer._list[ id ];

    clearInterval( timerObj._intervalObj );
    timer._list[ id ] = null;
    delete timer._list[ id ];

    Logger.write( Logger.LogType.Info, `[Timer] Timer '${ id }' removed. (reason:${ reason })` )
}

module.exports = timer;