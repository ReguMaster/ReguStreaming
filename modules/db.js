/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const Database = {};
const MySQL = require( "mysql" );
const hook = require( "../hook" );
const Logger = require( "./logger" );
const config = require( "../const/config" )
    .MySQL;

Database._connection = null
Database._connected = false;
Database._storedProcedure = {};

Database.onConnect = function( err )
{
    if ( err )
    {
        Database._connected = false;

        setTimeout( function( )
        {
            Logger.write( Logger.LogType.Warning, `[MySQL] Reconnecting to MySQL database ...` );
            Database.connect( );
        }, config.reconnectDelay );

        Logger.write( Logger.LogType.Error, `[MySQL] Failed to connect to MySQL database! (error:${ err.message })` );
        hook.run( "MySQLConnected", !!!err, err );
        return;
    }

    Database._connected = true;
    Logger.write( Logger.LogType.Info, `[MySQL] MySQL database connected to ${ config.user }@${ config.host }:${ config.port }.` );
    hook.run( "MySQLConnected", !!!err );
}

Database.connect = function( )
{
    Database._connection = MySQL.createConnection(
    {
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database
    } );
    Database._connection.connect( Database.onConnect );
    Database._connection.on( "error", function( err )
    {
        Logger.write( Logger.LogType.Error, `[MySQL] MySQL database error: ${ err.message }` );

        setTimeout( function( )
        {
            Logger.write( Logger.LogType.Warning, `[MySQL] Reconnecting to MySQL database ...` );
            Database.connect( );
        }, config.reconnectDelay );
    } );
}

Database.query = function( sql, onResult, onError )
{
    this._connection.query( sql, function( err, result, fields )
    {
        if ( err )
        {
            if ( onError )
                onError( err );

            Logger.write( Logger.LogType.Error, `[MySQL] Failed to process query!\n${ sql }\n-> ${ err }` );
            return;
        }

        if ( !!result.length )
            result.status = !!result[ 0 ] ? "success" : "failed";
        else
            result.status = ( result.affectedRows > 0 || result.changedRows > 0 ) ? "success" : "failed";

        // result.status = !!result[ 0 ];
        // console.log( typeof result );
        // console.log( result.length, !!result.length );
        // // console.log( result[ 0 ].constructor.name );
        // console.log( result );

        if ( onResult )
            onResult( result.status, result, fields );

        Logger.write( Logger.LogType.Info, `[MySQL] Query executed. '${ sql }' -> ${ result.status }` );
    } );
}

Database.queryWithEscape = function( sql, escape, onResult, onError )
{
    this._connection.query( sql, escape, function( err, result, fields )
    {
        if ( err )
        {
            if ( onError )
                onError( err );

            Logger.write( Logger.LogType.Error, `[MySQL] Failed to process query!\n${ sql }\n-> ${ err }` );
            return;
        }

        if ( !!result.length )
            result.status = !!result[ 0 ] ? "success" : "failed";
        else
            result.status = ( result.affectedRows > 0 || result.changedRows > 0 ) ? "success" : "failed";

        if ( onResult )
            onResult( result.status, result, fields );

        Logger.write( Logger.LogType.Info, `[MySQL] Query executed. '${ sql }' with ${ escape } ->` );
    } );
}

Database.registerProcedure = function( id, sql )
{
    this._storedProcedure[ id ] = {
        sql: sql
    };
}

Database.executeProcedure = function( id, args, onResult, onError )
{
    if ( !this._storedProcedure[ id ] )
    {
        Logger.write( Logger.LogType.Warning, `[MySQL] Failed to execute procedure '${ id }'. (reason:Not Exists!)` )
        return;
    }

    if ( args )
        Database.queryWithEscape( this._storedProcedure[ id ].sql, args, onResult, onError );
    else
        Database.query( this._storedProcedure[ id ].sql, onResult, onError );
}

Database.registerProcedure( "FIND_USER_BY_IPADDRESS", `SELECT * FROM user WHERE _ipAddress = ?` );
Database.registerProcedure( "REGISTER_GUEST", `INSERT IGNORE INTO user ( _provider, _name, _tag, _ipAddress ) VALUES ( ?, ?, ?, ? )` );
Database.registerProcedure( "REGISTER_USERFILE", `INSERT IGNORE INTO userfile ( _id, _file, _originalFileName, _type, _adult ) VALUES ( ?, ?, ?, ?, ? )` );
Database.registerProcedure( "FIND_USERFILE", `SELECT _id, _adult from userfile WHERE _file = ?` );

hook.register( "MySQLConnected", ( connected ) =>
{
    // Database.query( "DELETE FROM user WHERE _name = 'asd'" );
    if ( connected )
        Database.query( "SELECT * FROM user LIMIT 2" );
} );


// Database.build = function( )
// {
//     return new Database.QueryBuilder( );
// }

// Database.QueryBuilder = function( )
// {
//     this.select = "";
//     this.from = "";
//     this.where = "";
// }

// Database.QueryBuilder.prototype = {
//     constructor: Database.QueryBuilder,
//     select: function( selectTarget )
//     {
//         this.mode = "select";

//         return this;
//     },
//     from: function( fromTable )
//     {
//         this.from = fromTable;
//         return this;
//     },
//     insert: function( )
//     {
//         this.mode = "insert";

//         return this;
//     },
//     where: function( where )
//     {
//         this.where = where;
//         return this;
//     },
//     onError: function( err )
//     {
//         this.onError
//     },
//     execute: function( )
//     {
//         var sql =
//             console.log( "executed.", this.mode );
//     }
// }

Database.connect( );

module.exports = Database;