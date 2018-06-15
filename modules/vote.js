/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const VoteManager = { };
const path = require( "path" );
const consoleColor = require( "colors" );
const Main = require( "../app.js" );
const Logger = require( "./logger.js" );
const horizon = require( "horizon-youtube-mp3" );

VoteManager.test = 110;

VoteManager.ioEventConnection = function( socket, client )
{
	var rand = Math.floor( Math.random()*1000); // 수정필요
	
	// data = { url }
	
	// musicDir: "sounds/21.mp3",
		// musicName: "｢Outbreak (feat. MYLK)｣",
		// musicArtist: "Feint",
		// musicCover: "images/21.png"
	socket.on( "voteCreate", function( data )
	{
		console.log( "vote created!");
		VoteManager.ConvertToMp3( data.url, rand, function( err, result)
		{
			console.log(err, result);
			
			horizon.getInfo( data.url, function(err, e){
				console.log("getinfo Success");
				
				MusicProvider.currentMusic = {
					musicDir: "sounds/youtube_" + rand + ".mp3",
					musicName: e.videoName,
					musicArtist: "unknown",
					musicCover: null,
					musicVideo: e.videoFile
				};
				MusicProvider.MusicPlay();
			} );
			
			
			
		} );
		
	} );
}

VoteManager.ConvertToMp3 = function( url, rand, successConvert )
{
	
	
	
	var response;
	horizon.downloadToLocal( url,
	downPath,
	"youtube_"+rand+".mp3",
	null,
	null,
	successConvert,
	onConvertVideoProgress );
}

// function onConvertVideoComplete(err, result)
// {
	// console.log(err, result);
// }

function onConvertVideoProgress(percent, timemark, targetSize) {
  console.log('Progress:', percent, 'Timemark:', timemark, 'Target Size:', targetSize);
  // Will return...
  // Progress: 90.45518257038955 Timemark: 00:02:20.04 Target Size: 2189
  // Progress: 93.73001672942894 Timemark: 00:02:25.11 Target Size: 2268
  // Progress: 100.0083970106642 Timemark: 00:02:34.83 Target Size: 2420
}

VoteManager.isBanned = function( )
{
	
}

module.exports = VoteManager;