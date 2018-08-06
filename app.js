/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use struct'

const Main = {};

const uniqid = require( "uniqid" );
const path = require( "path" );
const fileStream = require( "fs" );
const passport = require( "passport" );
const reguUtil = require( "./util" );
const Logger = require( "./modules/logger" );
const express = require( "express" );
const session = require( "express-session" );
const redisClient = require( "redis" )
    .createClient( );
const RedisStore = require( "connect-redis" )( session );
const app = express( );

const expressWebServer = require( "http" )
    .createServer( app );

const expressWebServerSSL = require( "https" )
    .createServer(
    {
        ca: fileStream.readFileSync( "./ssl/ca_bundle.crt" ),
        cert: fileStream.readFileSync( "./ssl/certificate.crt" ),
        key: fileStream.readFileSync( "./ssl/private.key" )
    }, app );

const sessionMiddleware = session(
{
    name: "sessionID",
    cookie:
    {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: true,
        httpOnly: true
    },
    store: new RedisStore(
    {
        client: redisClient
    } ),
    genid: function( req )
    {
        return uniqid( "session-" );
    },
    secret: "*",
    resave: false,
    saveUninitialized: true
} );

Main.config = {};
Main.config.host = reguUtil.getLocalIP( )
    .ipAddress;
Main.config.devMode = process.argv[ 2 ] === "-dev";
Main.config.enableAutoQueue = false;

Main.app = app;
Main.socketIO = require( "socket.io" )( expressWebServerSSL );

process.title = "ReguStreaming : Server";

redisClient.on( "connect", function( )
{
    Logger.write( Logger.LogType.Info, `[Redis] Redis database connected.` );
} );

redisClient.on( "reconnecting", function( )
{
    Logger.write( Logger.LogType.Warning, `[Redis] Reconnecting ...` );
} );

redisClient.on( "error", function( err )
{
    Logger.write( Logger.LogType.Error, `[Redis] ERROR! : ${ err.message }` );
} );

process.on( "exit", function( code )
{
    Logger.write( Logger.LogType.Info, `ReguStreaming is shutting down ... ${ code }` );
} );

process.on( "uncaughtException", function( err )
{
    Logger.write( Logger.LogType.Error, `[SERVER] Unhandled exception!\n${ err.stack }` );
} );

Main.InitializeServer = function( )
{
    Logger.write( Logger.LogType.Info, "Booting server ..." );
    require( "console-title" )( "ReguStreaming : Server" );

    app.use( express.static( path.join( __dirname, "public" ) ) );
    // app.use( express.static( path.join( __dirname, "b" ) ) );

    app.use( require( "body-parser" )
        .urlencoded(
        {
            extended: false
        } ) );
    app.use( require( "compression" )( ) );
    app.use( require( "cookie-parser" )( ) );
    app.use( require( "socketio-file-upload" )
        .router );

    app.use( function( req, res, next )
    {
        // https://www.npmjs.com/package/cache-headers
        // res.setHeader( "Cache-Control", "no-cache, no-store" );
        res.setHeader( "X-Powered-By", "Doshigatai" );
        next( );
    } );

    app.use( sessionMiddleware );
    app.use( passport.initialize( ) );
    app.use( passport.session( ) );

    Main.socketIO.use( require( "express-socket.io-session" )( sessionMiddleware ) );

    // app.use( require( "express-status-monitor" )(
    // {
    //     websocket: Main.ioSSL,
    //     port: 443
    // } ) );

    app.set( "trust proxy", true );
    app.set( "views", path.join( __dirname, "views" ) );
    app.set( "view engine", "ejs" );
    app.engine( "html", require( "ejs" )
        .renderFile );

    expressWebServer.listen( 80, "regustreaming.oa.to", function( )
    {
        Logger.write( Logger.LogType.Info, `[HTTP] Listening at ${ Main.config.host }:80` );
    } );

    expressWebServerSSL.listen( 443, "regustreaming.oa.to", function( )
    {
        Logger.write( Logger.LogType.Info, `[HTTPS] Listening at ${ Main.config.host }:443` );
    } );
}

Main.InitializeServer( );

module.exports = Main;

const hook = require( "./hook" );

setInterval( function( )
{
    hook.run( "TickTok" );
}, 1000 );

hook.register( "Initialize", function( )
{
    app.use( "/", function( req, res, next )
    {
        // request was via https, so do no special handling
        if ( req.secure )
            next( );
        else
            res.redirect( "https://" + req.headers.host + req.url );
    } );
    app.use( "/", require( "./routes/index" ) );
    app.use( function( req, res, next )
    {
        res.status( 404 )
            .render( "error",
            {
                code: 404
            } );

        Logger.write( Logger.LogType.Warning, `[SERVER] ${ req.ip || "Unknown" } requested non-exists file. -> ${ req.originalUrl }` );
    } );

    app.use( function( err, req, res, next )
    {
        res.status( 500 )
            .render( "error",
            {
                code: 500
            } );

        Logger.write( Logger.LogType.Error, `[SERVER] ${ req.ip || "Unknown" } failed to processing. -> ${ req.originalUrl }\n${ err.stack }` );
    } );
} );

require( "./server" );