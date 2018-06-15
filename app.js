/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

var Main = { };

const path = require( "path" );
const route = require( "./routes/index.js" );
const express = require( "express" );
const fileStream = require( "fs" );
const passport = require( "passport" );
const app = express( );
const Logger = require( "./modules/logger.js" );

app.use( require( "socketio-file-upload" ).router );

let server = require( "http" ).createServer( app );

Main.config = { };
Main.config.host = "1.224.53.166";
Main.config.port = 8085;

Main.app = app;
Main.io = require( "socket.io" )( server );
Main.InitializeServer = function( )
{
	Logger.write( Logger.LogType.Info, "Booting server ..." );
	require( "console-title" )( "ReguStreaming : Server" );
	
	app.use( express.static( path.join( __dirname, "public" ) ) );
	// app.use( express.static( path.join( __dirname, "userUploaded" ) ) );
	app.use( "/files", express.static( "public/userfiles" ) );
	app.use( express.urlencoded( ) );
	
	app.use(require('cookie-parser')());
	app.use(require('express-session')({
	  secret: 'keyboard cat',
	  resave: true,
	  saveUninitialized: true
	}));
	app.use(require('body-parser').urlencoded({ extended: true }));
	app.use(passport.initialize());
	app.use(passport.session());

	app.use( "/", route );
	
	app.use( function( req, res, next )
	{
		res.status( 404 ).send( "404 Not Found!" );
	} );
	
	app.use( function( err, req, res, next )
	{
		console.error( err.stack );
		res.status( 500 ).send( "서버에서 오류가 발생했습니다." );
	} );
	
	Logger.write( Logger.LogType.Info, "Booting server finished." );
}

Main.InitializeServer( );

module.exports = Main;

/*
var server = require('greenlock-express').create({

  // Let's Encrypt v2 is ACME draft 11
  version: 'draft-11'

, server: 'https://acme-v02.api.letsencrypt.org/directory'
  // Note: If at first you don't succeed, switch to staging to debug
  // https://acme-staging-v02.api.letsencrypt.org/directory

  // You MUST change this to a valid email address
, email: 'smhjyh2009@gmail.com'

  // You MUST NOT build clients that accept the ToS without asking the user
, agreeTos: true

  // You MUST change these to valid domains
  // NOTE: all domains will validated and listed on the certificate
, approveDomains: [ ]

  // You MUST have access to write to directory where certs are saved
  // ex: /home/foouser/acme/etc
, configDir: require('path').join(require('os').homedir(), 'acme', 'etc')

, app: app

  // Join the community to get notified of important updates and help me make greenlock better
, communityMember: true

  // Contribute telemetry data to the project
, telemetry: true

, debug: true

}).listen(80, 443);*/



// var encoder = new lame.Encoder({
    // input
    // channels: 2,        // 2 channels (left and right)
    // bitDepth: 16,       // 16-bit samples
    // sampleRate: 44100,  // 44,100 Hz sample rate

    // output
    // bitRate: options.bitrate,
    // outSampleRate: options.samplerate,
    // mode: (options.mono ? lame.MONO : lame.STEREO) // STEREO (default), JOINTSTEREO, DUALCHANNEL or MONO
  // });

server.listen( Main.config.port, Main.config.host, function( )
{
	Logger.write( Logger.LogType.Event, "Listening at " + Main.config.host + ":" + Main.config.port );
} );

require( "./util.js" );
require( "./client.js" );

require( "./modules/interact.js" );
require( "./modules/queue.js" );
require( "./modules/chat.js" );
require( "./modules/fileupload.js" );