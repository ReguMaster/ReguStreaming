/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const util = {};
const crypto = require( "crypto" );
const xml2js = require( "xml2js" );
const os = require( "os" );

Object.prototype.forEach = function( interFunc )
{
    var key = Object.keys( this ),
        keyLength = key.length;

    for ( var i = 0; i < keyLength; i++ )
        interFunc( this[ key[ i ] ], key[ i ] );
}

Object.prototype.some = function( interFunc )
{
    var key = Object.keys( this ),
        keyLength = key.length,
        result;

    for ( var i = 0; i < keyLength; i++ )
        if ( result = interFunc( this[ key[ i ] ], key[ i ] ) ) break;

    return result;
}

// same as http://wiki.garrysmod.com/page/table/concat
Array.prototype.chain = function( startIndex, endIndex, concatenator = " " )
{
    var newVal = "";

    if ( typeof endIndex != "number" )
        endIndex = this.length;

    if ( endIndex <= startIndex )
        return null;

    for ( var i = startIndex; i < endIndex; i++ )
    {
        if ( i != endIndex - 1 )
            newVal = newVal + this[ i ] + concatenator;
        else
            newVal = newVal + this[ i ];
    }

    return newVal;
}

var parser = new xml2js.Parser(
{
    attrkey: "attr",
    charkey: "val"
} );
util.parseXML = function( xml, callback )
{
    parser.parseString( xml, function( err, result )
    {
        callback( err, result );
    } );
}

util.calcTime = function( time )
{
    var hour = Math.floor( time / 3600 );
    var min = Math.floor( time / 60 );
    var sec = time - min * 60;

    return {
        hour: hour,
        min: min,
        sec: sec
    };
}

// https://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
util.getLocalIP = function( )
{
    var result = null;
    var ifaces = os.networkInterfaces( );

    Object.keys( ifaces )
        .forEach( function( ifname )
        {
            ifaces[ ifname ].forEach( function( iface )
            {
                if ( iface.family !== "IPv4" || iface.internal !== false ) // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                    return;

                result = {
                    name: ifname,
                    ipAddress: iface.address
                };
            } );
        } );

    return result;
}

util.splitIP = function( ipAddress )
{
    ipAddress = ipAddress.split( "." )
        .map( function( value )
        {
            return Number( value );
        } );

    return ipAddress;
}

util.censorshipIP = function( ipAddress )
{
    var ipArray = ipAddress.split( "." );

    // 반복문 사용으로 바꾸기..

    ipArray[ ipArray.length - 2 ] = "***";
    ipArray[ ipArray.length - 1 ] = "***";

    return ipArray.toString( );
}

util.crypto = function( type, data )
{
    return crypto.createHash( type )
        .update( data )
        .digest( "hex" );
}

util.md5 = function( data )
{
    var generator = crypto.createHash( "md5" );
    generator.update( data );

    return generator.digest( "hex" );
}

util.sha1 = function( data )
{
    var generator = crypto.createHash( "sha1" );
    generator.update( data );

    return generator.digest( "hex" );
}

util.sha256 = function( data )
{
    var generator = crypto.createHash( "sha256" );
    generator.update( data );

    return generator.digest( "hex" );
}

util.sha512 = function( data )
{
    return crypto.createHash( "sha512" )
        .update( data )
        .digest( "hex" );
}

// http://sanghaklee.tistory.com/3
util.isEmpty = function( value )
{
    if ( value == "" || value == null || value == undefined || ( value != null && typeof value == "object" && !Object.keys( value )
            .length ) )
        return true

    return false;
}

util.isValidSocketData = function( data, checkExpression )
{
    if ( util.isEmpty( data ) ) return false;
    if ( !checkExpression ) return false;

    if ( typeof checkExpression === "object" )
    {
        var keys = Object.keys( checkExpression );
        var length = keys.length;

        for ( var i = 0; i < length; i++ )
        {
            if ( data[ keys[ i ] ] === null || typeof data[ keys[ i ] ] !== checkExpression[ keys[ i ] ] )
                return false;
        }
    }
    else if ( typeof checkExpression === "string" )
    {
        return typeof data === checkExpression;
    }

    return true;
}

//https://stackoverflow.com/questions/40291987/javascript-deep-clone-object-with-circular-references
util.deepCopy = function( obj, hash = new WeakMap( ) )
{
    if ( Object( obj ) !== obj || obj instanceof Function ) return obj;
    if ( hash.has( obj ) ) return hash.get( obj ); // Cyclic reference
    try
    { // Try to run constructor (without arguments, as we don't know them)
        var result = new obj.constructor( );
    }
    catch ( e )
    { // Constructor failed, create object without running the constructor
        result = Object.create( Object.getPrototypeOf( obj ) );
    }
    // Optional: support for some standard constructors (extend as desired)
    if ( obj instanceof Map )
        Array.from( obj, ( [ key, val ] ) => result.set( util.deepCopy( key, hash ),
            util.deepCopy( val, hash ) ) );
    else if ( obj instanceof Set )
        Array.from( obj, ( key ) => result.add( util.deepCopy( key, hash ) ) );
    // Register in hash    
    hash.set( obj, result );
    // Clone and assign enumerable own properties recursively
    return Object.assign( result, ...Object.keys( obj )
        .map(
            key => (
            {
                [ key ]: util.deepCopy( obj[ key ], hash )
            } ) ) );
}

// util.deepCopy = function( obj )
// {
//     if ( obj === null || typeof obj !== "object" )
//         return obj;

//     var copy = obj.constructor( );

//     for ( var attr in obj )
//     {
//         if ( obj.hasOwnProperty( attr ) )
//             copy[ attr ] = this.deepCopy( obj[ attr ] );
//     }

//     return copy;
// }

//https://gist.github.com/demonixis/4202528/5f0ce3c2622fba580e78189cfe3ff0f9dd8aefcc
Math.clamp = function( value, min, max )
{
    if ( value < min )
        return min;
    else if ( value > max )
        return max;

    return value;
}

// https://stackoverflow.com/questions/9006988/node-js-on-windows-how-to-clear-console
console.reset = function( )
{
    var lines = process.stdout.getWindowSize( )[ 1 ];
    for ( var i = 0; i < lines; i++ )
    {
        console.log( '\r\n' );
    }
    process.stdout.write( '\x1Bc' );
}

module.exports = util;