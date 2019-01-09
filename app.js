/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use struct'

const Main = {};

const util = require( "./util" ); // 기존 util 모듈 override
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
const ipFilter = require( "ip-filter" );
const config = require( "./const/config.json" );
const FileStorage = require( "./filestorage" );

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
Main.config.ipFilter = [ ];
Main.config.domain = config.Server.DOMAIN; //"regustreaming.oa.to";
Main.config.host = util.getLocalNetworkInterface( )
    .ipAddress;

Main.app = app;
Main.redisClient = require( "redis" )
    .createClient( );
Main.socketIO = require( "socket.io" )( expressWebServerSSL,
{
    pingInterval: 1000 * 10 // 10 seconds;
} );

FileStorage.loadAsync( "ipfilter", "json", [ ], ( data ) =>
{
    Main.config.ipFilter = data;
} );

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
    Logger.write( Logger.type.Info, `[Redis] Redis database connected.` );
} );

Main.redisClient.on( "reconnecting", function( )
{
    Logger.write( Logger.type.Warning, `[Redis] Reconnecting ...` );
} );

Main.redisClient.on( "error", function( err )
{
    Logger.write( Logger.type.Error, `[Redis] ERROR! : ${ err.message }` );
} );

process.on( "exit", function( code )
{
    Logger.write( Logger.type.Info, `ReguStreaming is shutting down ... ${ code }` );
} );

process.on( "uncaughtException", function( err )
{
    Logger.write( Logger.type.Error, `[SERVER] Unhandled Exception: \n${ err.stack }` );
} );

// *NOTE:
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
        Logger.write( Logger.type.Warning, `[SERVER] WARNING: DNS host mismatch. requesting refresh ... (code:${ err.code })` );
        DNS.refresh( );
        // *TODO: dns 리프레쉬 이후 다시 listen 함수 호출하는 코드 작성
    }
    else
        Logger.write( Logger.type.Error, `[SERVER] Unhandled WebServer error: \n${ err.stack }` );
}

expressWebServer.on( "error", onErrorAtWebServer );
expressWebServerSSL.on( "error", onErrorAtWebServer );

Main.Listen = function( )
{
    expressWebServer.listen( 80, Main.config.domain, function( )
    {
        Logger.write( Logger.type.Info, `[HTTP] Listening at ${ Main.config.host }:80` );
    } );

    expressWebServerSSL.listen( 443, Main.config.domain, function( )
    {
        Logger.write( Logger.type.Info, `[HTTPS] Listening at ${ Main.config.host }:443` );
    } );
}


Main.InitializeServer = function( )
{
    Logger.write( Logger.type.Info, "Booting server ..." );

    process.title = "ReguStreaming : Server";

    app.use( express.static( path.join( __dirname, "public" ) ) );
    // app.use( express.static( path.join( __dirname, "b" ) ) );

    app.use( require( "body-parser" )
        .urlencoded(
        {
            extended: false
        } ) );
    app.use( require( "compression" )( ) ); // gzip 압축 미들웨어 사용
    app.use( require( "cookie-parser" )( ) ); // cookie 지원 미들웨어 사용
    // app.use( require( "socketio-file-upload" )
    //     .router );

    // Global 헤더 설정
    app.use( function( req, res, next )
    {
        // https://www.npmjs.com/package/cache-headers

        res.setHeader( "X-UA-Compatible", "IE=edge" );
        // res.setHeader( "X-Frame-Options", "ALLOW-FROM https://www.youtube.com/" );
        res.setHeader( "X-Powered-By", "Doshigatai" );

        // res.setHeader( "Access-Control-Allow-Origin", "*" );

        // res.setHeader( "Cache-Control", "no-cache, no-store" );
        // res.header( "Access-Control-Allow-Headers", "*" );
        // res.header( "Access-Control-Allow-Credentials", true );
        // res.header( "Access-Control-Allow-Methods", "GET,PUT,POST,DELETE" );
        next( );
    } );

    app.use( sessionMiddleware );
    app.use( passport.initialize( ) );
    app.use( passport.session( ) );

    Main.socketIO.use( require( "express-socket.io-session" )( sessionMiddleware ) );

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
    app.use( function( req, res, next )
    {
        let ip = req.ip;
        var length = Main.config.ipFilter.length;

        for ( var i = 0; i < length; i++ )
        {
            if ( ipFilter( ip, Main.config.ipFilter[ i ],
                {
                    strict: true
                } ) !== null )
            {
                Logger.impor( `[Server] WARNING: [${ ip || "Unknown" }] blocked by IP Filter! (req: ${ req.originalUrl })` );

                res.status( 403 )
                    .send( "403 Error, Blocked by IP Filter." )

                return;
            }
        }

        next( );
    } );
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

        Logger.warn( `[Server] [${ req.ip || "Unknown" }] requested non-exists file. -> ${ req.originalUrl }` );
    } );

    app.use( function( err, req, res, next )
    {
        res.status( 500 )
            .render( "error",
            {
                code: 500
            } );

        Logger.error( `[Server] [${ req.ip || "Unknown" }] failed to processing. -> ${ req.originalUrl }\n${ err.stack }` );
    } );
} );

require( "./server" );