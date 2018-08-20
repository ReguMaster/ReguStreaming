/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const hook = {};

hook._list = {};
hook.register = function( id, method )
{
    if ( !this._list[ id ] )
        this._list[ id ] = [ ];

    this._list[ id ].push( method );
}

hook.run = function( id, ...args )
{
    if ( !this._list[ id ] ) return;

    var length = this._list[ id ].length;
    var result;

    for ( var i = 0; i < length; i++ )
    {
        if ( typeof result === "undefined" )
            result = this._list[ id ][ i ]( ...args );
        else this._list[ id ][ i ]( ...args );
    }

    return result;
}

hook.remove = function( id )
{
    if ( this._list[ id ] )
        delete this._list[ id ];
}

module.exports = hook;