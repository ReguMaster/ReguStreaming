/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const nodeUtil = require( "util" );

let util = {};
const crypto = require( "crypto" );
const xml2js = require( "xml2js" );
const os = require( "os" );
const merge = require( "merge" );
const fileStream = require( "fs" );

JSON.empty = JSON.stringify(
{} );

// *NOTE: Client 클래스에 사용하는 EXTRA_VAR 시스템 null 값 설정
global.VAR_NULL = "^NULL^";

// *TODO: 코드 시스템 쓰는 logic 에 이 메소드 사용 적용
util.getCodeID = function( codesObj, code )
{
    if ( typeof codesObj !== "object" || codesObj.length ) throw new Error( "codesObj is not Object type!" );

    var key = Object.keys( codesObj ),
        keyLength = key.length;

    for ( var i = 0; i < keyLength; i++ )
    {
        if ( codesObj[ key[ i ] ] === code )
            return key[ i ];
    }

    return "unknown code";
}

util.forEach = function( obj, inter )
{
    if ( typeof obj !== "object" ) throw new Error( "obj is not Object type!" );
    if ( typeof inter !== "function" ) throw new Error( "inter is not Function type!" );

    var key = Object.keys( obj ),
        keyLength = key.length;

    for ( var i = 0; i < keyLength; i++ )
        inter( obj[ key[ i ] ], key[ i ] );
}

util.some = function( obj, inter )
{
    if ( typeof obj !== "object" ) throw new Error( "obj is not Object type!" );
    if ( typeof inter !== "function" ) throw new Error( "inter is not Function type!" );

    var key = Object.keys( obj ),
        keyLength = key.length,
        result;

    for ( var i = 0; i < keyLength; i++ )
        if ( result = inter( obj[ key[ i ] ], key[ i ] ) ) break;

    return result;
}

// Object.prototype.forEach = function( interFunc )
// {
//     var key = Object.keys( this ),
//         keyLength = key.length;

//     for ( var i = 0; i < keyLength; i++ )
//         interFunc( this[ key[ i ] ], key[ i ] );
// }

// Object.prototype.some = function( interFunc )
// {
//     var key = Object.keys( this ),
//         keyLength = key.length,
//         result;

//     for ( var i = 0; i < keyLength; i++ )
//         if ( result = interFunc( this[ key[ i ] ], key[ i ] ) ) break;

//     return result;
// }

// https://stackoverflow.com/questions/586182/how-to-insert-an-item-into-an-array-at-a-specific-index
Array.prototype.insert = function( index, item )
{
    this.splice( index, 0, item );
};

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

Array.prototype.random = function( )
{
    return this[ Math.randomNumber( 0, this.length ) ];
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
util.getLocalNetworkInterface = function( )
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
    // *TODO: 최적화 가능
    return ipAddress.split( "." )
        .map( function( value )
        {
            return Number( value );
        } );
}

util.censorshipIP = function( ipAddress )
{
    var ipArray = ipAddress.split( "." ),
        length = ipArray.length,
        ipOutput = "";

    for ( var i = 0; i < length; i++ )
    {
        if ( ( i + 1 ) % 2 === 0 )
            ipArray[ i ] = "***";

        ipOutput += ipArray[ i ] + ".";
    }

    // *NOTE: , 로 찍히는 이유가 여기 있음.
    return ipOutput.substring( 0, ipOutput.length - 1 );
}

util.crypto = function( type, data )
{
    return crypto.createHash( type )
        .update( data )
        .digest( "hex" );
}

util.md5 = function( data )
{
    return crypto.createHash( "md5" )
        .update( data )
        .digest( "hex" );
}

util.sha1 = function( data )
{
    return crypto.createHash( "sha1" )
        .update( data )
        .digest( "hex" );
}

util.sha256 = function( data )
{
    return crypto.createHash( "sha256" )
        .update( data )
        .digest( "hex" );
}

util.sha512 = function( data )
{
    return crypto.createHash( "sha512" )
        .update( data )
        .digest( "hex" );
}

util.fileHash = function( location, callback )
{
    var hash = crypto.createHash( "sha1" );
    var stream = fileStream.createReadStream( location );

    stream.on( "data", function( v )
        {
            return hash.update( v );
        } )
        .on( "end", function( )
        {
            callback( hash.digest( "hex" ) );
        } )
        .on( "error", function( err )
        {
            callback( null );
        } );
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
    if ( this.isEmpty( data ) ) return false;
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
        return typeof data === checkExpression;

    return true;
}

util.deepCopy = function( obj )
{
    return merge( true, obj );
}
//https://stackoverflow.com/questions/40291987/javascript-deep-clone-object-with-circular-references
// util.deepCopy = function( obj, hash = new WeakMap( ) )
// {
//     if ( Object( obj ) !== obj || obj instanceof Function ) return obj;
//     if ( hash.has( obj ) ) return hash.get( obj ); // Cyclic reference
//     try
//     { // Try to run constructor (without arguments, as we don't know them)
//         var result = new obj.constructor( );
//     }
//     catch ( e )
//     { // Constructor failed, create object without running the constructor
//         result = Object.create( Object.getPrototypeOf( obj ) );
//     }
//     // Optional: support for some standard constructors (extend as desired)
//     if ( obj instanceof Map )
//         Array.from( obj, ( [ key, val ] ) => result.set( util.deepCopy( key, hash ),
//             util.deepCopy( val, hash ) ) );
//     else if ( obj instanceof Set )
//         Array.from( obj, ( key ) => result.add( util.deepCopy( key, hash ) ) );
//     // Register in hash    
//     hash.set( obj, result );
//     // Clone and assign enumerable own properties recursively
//     return Object.assign( result, ...Object.keys( obj )
//         .map(
//             key => (
//             {
//                 [ key ]: util.deepCopy( obj[ key ], hash )
//             } ) ) );
// }

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

Math.randomNumber = function( min, max )
{
    return Math.floor( ( Math.random( ) * max ) + min );
}

// https://stackoverflow.com/questions/9006988/node-js-on-windows-how-to-clear-console
console.reset = function( )
{
    var lines = process.stdout.getWindowSize( )[ 1 ];
    for ( var i = 0; i < lines; i++ )
    {
        console.log( "\r\n" );
    }
    process.stdout.write( "\x1Bc" );
}

// 기존 nodejs 자체 util 모듈 상속
util = Object.assign( util, nodeUtil );

module.exports = util;