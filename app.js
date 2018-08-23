/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use struct'

const Main = {};

require( "./util" ); // 기존 util 모듈 override
const util = require( "util" );
const uniqid = require( "uniqid" );
const path = require( "path" );
const fileStream = require( "fs" );
const passport = require( "passport" );
const Logger = require( "./modules/logger" );
const DNS = require( "./modules/dns" );
const express = require( "express" );
const session = require( "express-session" );
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

Main.config = {};
Main.config.host = util.getLocalIP( )
    .ipAddress;
Main.config.devMode = process.argv[ 2 ] === "-dev";
Main.config.enableAutoQueue = false;

Main.app = app;
Main.redisClient = require( "redis" )
    .createClient( );
Main.socketIO = require( "socket.io" )( expressWebServerSSL );

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
        client: Main.redisClient
    } ),
    genid: function( req )
    {
        return uniqid( "session-" );
    },
    secret: "*",
    resave: false,
    saveUninitialized: true
} );

Main.redisClient.on( "connect", function( )
{
    Logger.write( Logger.LogType.Info, `[Redis] Redis database connected.` );
} );

Main.redisClient.on( "reconnecting", function( )
{
    Logger.write( Logger.LogType.Warning, `[Redis] Reconnecting ...` );
} );

Main.redisClient.on( "error", function( err )
{
    Logger.write( Logger.LogType.Error, `[Redis] ERROR! : ${ err.message }` );
} );

process.on( "exit", function( code )
{
    Logger.write( Logger.LogType.Info, `ReguStreaming is shutting down ... ${ code }` );
} );

process.on( "uncaughtException", function( err )
{
    Logger.write( Logger.LogType.Error, `[SERVER] Unhandled Exception: \n${ err.stack }` );
} );

// 2018-08-22 11:40:23 (!    ERROR    !) : [SERVER] Unhandled WebServer error:
// Error: listen EADDRINUSE 1.236.112.166:443
//     at Object._errnoException (util.js:992:11)
//     at _exceptionWithHostPort (util.js:1014:20)
//     at Server.setupListenHandle [as _listen2] (net.js:1355:14)
//     at listenInCluster (net.js:1396:12)
//     at GetAddrInfoReqWrap.doListen [as callback] (net.js:1505:7)
//     at GetAddrInfoReqWrap.onlookup [as oncomplete] (dns.js:97:10)
const onErrorAtWebServer = function( err )
{
    if ( err.code === "EADDRNOTAVAIL" )
    {
        Logger.write( Logger.LogType.Warning, `[SERVER] WARNING: DNS host mismatch. requesting refresh ... (code:${ err.code })` );
        DNS.refresh( );
        // *TODO: dns 리프레쉬 이후 다시 listen 함수 호출하는 코드 작성
    }
    else
        Logger.write( Logger.LogType.Error, `[SERVER] Unhandled WebServer error: \n${ err.stack }` );
}

expressWebServer.on( "error", onErrorAtWebServer );
expressWebServerSSL.on( "error", onErrorAtWebServer );

Main.Listen = function( )
{
    expressWebServer.listen( 80, "regustreaming.oa.to", function( )
    {
        Logger.write( Logger.LogType.Info, `[HTTP] Listening at ${ Main.config.host }:80` );
    } );

    expressWebServerSSL.listen( 443, "regustreaming.oa.to", function( )
    {
        Logger.write( Logger.LogType.Info, `[HTTPS] Listening at ${ Main.config.host }:443` );
    } );
}

Main.InitializeServer = function( )
{
    Logger.write( Logger.LogType.Info, "Booting server ..." );

    process.title = "ReguStreaming : Server";

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

    this.Listen( );
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
        if ( req.secure )
            next( );
        else
            res.redirect( `https://${ req.headers.host }${ req.url }` ); // HTTP 연결 HTTPS 로 변경
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