/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const path = require( "path" );
const route = require( "./routes/index.js" );
const express = require( "express" );
const fileStream = require( "fs" );

const consoleColor = require( "colors" );
var Main = { };
const passport = require( "passport" );
var SocketIOFileUpload = require('socketio-file-upload');
const app = express( );

app.use(SocketIOFileUpload.router);

let server = require( "http" ).createServer( app );

Main.test = Math.floor(Math.random() * 1000 - 10 );
Main.app = app;
Main.io = require( "socket.io" )( server );
Main.InitializeServer = function( )
{
	console.info( "서버 부팅 중 ...;" );
	require( "console-title" )( "ReguStreaming : Server" );
	
	app.use( express.static( path.join( __dirname, "public" ) ) );
	// app.use( express.static( path.join( __dirname, "userUploaded" ) ) );
	app.use( "/files", express.static( "userUploaded" ) );
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
	
	console.info( "서버 부팅 완료 ...;" );
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
  












server.listen( 8085, "1.224.53.166", function( )
{
	console.info( "서버 리스닝 완료 ...;" );
} );




require( "./modules/interact.js" );
const musicProvider = require( "./modules/musicprovider.js" );
require( "./modules/clientmanager.js" );
