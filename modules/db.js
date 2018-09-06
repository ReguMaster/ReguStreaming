/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const Database = {};
const MySQL = require( "mysql" );
const hook = require( "../hook" );
const Logger = require( "./logger" );
const timer = require( "../timer" );
const config = require( "../const/config" )
    .MySQL;

Database._connection = null
Database._connected = false;
Database._storedProcedure = {};

Database.onConnect = function( err )
{
    Database._connected = !!!err;

    if ( err )
    {
        timer.create( "Database.reconnectTimer", config.reconnectDelay, 0, function( )
        {
            Logger.warn( `[MySQL] Reconnecting to MySQL database ...` );
            Database.connect( );
        } );

        Logger.error( `[MySQL] Failed to connect to MySQL database! (error:${ err.message })` );
        hook.run( "OnConnectMySQL", !!!err, err );
        return;
    }
    else
    {
        if ( timer.exists( "Database.reconnectTimer" ) )
            timer.remove( "Database.reconnectTimer" );
    }

    Logger.info( `[MySQL] MySQL database connected to ${ config.user }@${ config.host }:${ config.port }.` );
    hook.run( "OnConnectMySQL", !!!err );
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
        Logger.error( `[MySQL] MySQL database error: ${ err.message }` );

        timer.create( "Database.reconnectTimer", config.reconnectDelay, 0, function( )
        {
            Logger.warn( `[MySQL] Reconnecting to MySQL database ...` );
            Database.connect( );
        } );
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

            Logger.error( `[MySQL] Failed to process query!\n${ sql }\n-> ${ err }` );
            return;
        }

        if ( !!result.length )
            result.status = !!result[ 0 ] ? "success" : "failed";
        else
            result.status = ( result.affectedRows > 0 || result.changedRows > 0 ) ? "success" : "failed";

        if ( onResult )
            onResult( result.status, result, fields );

        Logger.info( `[MySQL] Query executed. '${ sql }' -> ${ result.status }` );
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

            Logger.error( `[MySQL] Failed to process query!\n${ sql }\n-> ${ err }` );
            return;
        }

        if ( !!result.length )
            result.status = !!result[ 0 ] ? "success" : "failed";
        else
            result.status = ( result.affectedRows > 0 || result.changedRows > 0 ) ? "success" : "failed";

        if ( onResult )
            onResult( result.status, result, fields );

        Logger.info( `[MySQL] Query executed. '${ sql }' with ${ escape } ->` );
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
        Logger.warn( `[MySQL] Failed to execute procedure '${ id }'. (reason:Not Exists!)` )
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