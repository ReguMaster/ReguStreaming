/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const path = require( "path" );
const MusicProvider = { };
const consoleColor = require( "colors" );
let Main = require( "../app.js" );

MusicProvider.test = 0;
MusicProvider.musicList = [
	{
		musicDir: "sounds/01.mp3",
		musicName: "｢내일의 밤하늘 초계반｣",
		musicArtist: "ゆある",
		musicCover: "images/01.png"
	},
	{
		musicDir: "sounds/02.mp3",
		musicName: "｢No title｣",
		musicArtist: "Fantastic Youth",
		musicCover: "images/02.png"
	},
	{
		musicDir: "sounds/03.mp3",
		musicName: "｢서머 타임 레코드｣",
		musicArtist: "Amatsuki",
		musicCover: "images/03.png"
	},
	{
		musicDir: "sounds/04.mp3",
		musicName: "｢롤 플레잉 게임｣",
		musicArtist: "소라마후우라사카",
		musicCover: "images/04.png"
	},
	{
		musicDir: "sounds/05.mp3",
		musicName: "｢마음짓기｣",
		musicArtist: "카노",
		musicCover: "images/05.png"
	},
	{
		musicDir: "sounds/06.mp3",
		musicName: "｢Pneumatic Tokyo｣",
		musicArtist: "EnV",
		musicCover: "images/06.png"
	},
	{
		musicDir: "sounds/07.mp3",
		musicName: "｢Tabi no Hidarite, Saihate no Migite｣",
		musicArtist: "メイドインアビス",
		musicCover: "images/07.png"
	},
	{
		musicDir: "sounds/08.mp3",
		musicName: "｢Feel Good｣",
		musicArtist: "Syn Cole",
		musicCover: "images/08.png"
	},
	{
		musicDir: "sounds/09.mp3",
		musicName: "｢Androgynos｣",
		musicArtist: "WAiKURO",
		musicCover: "images/09.png",
		onTimeChanged: function( io, time )
		{
			if ( time == 128 )
			{
				io.emit( 'music_changebg', "images/09_b.png" );
				
				console.log( "bg changed!" );
			}
		}
	},
	{
		musicDir: "sounds/10.mp3",
		musicName: "｢Higher｣",
		musicArtist: "Tobu",
		musicCover: "images/10.png"
	},
	{
		musicDir: "sounds/11.mp3",
		musicName: "｢Unity｣",
		musicArtist: "TheFatRat",
		musicCover: "images/11.png"
	},
	{
		musicDir: "sounds/12.mp3",
		musicName: "｢The Maze Of Mayonnaise｣",
		musicArtist: "Bossfight",
		musicCover: "images/12.png"
	},
	{
		musicDir: "sounds/13.mp3",
		musicName: "｢Nock Em｣",
		musicArtist: "Bossfight",
		musicCover: "images/13.png"
	},
	{
		musicDir: "sounds/14.mp3",
		musicName: "｢This Little Girl｣",
		musicArtist: "Cady Groves (Nightcore)",
		musicCover: "images/14.png"
	},
	{
		musicDir: "sounds/15.mp3",
		musicName: "｢Drive｣",
		musicArtist: "Carly Rae Jepsen (Nightcore)",
		musicCover: "images/15.png"
	},
	{
		musicDir: "sounds/16.mp3",
		musicName: "｢The Lonely Wolf｣",
		musicArtist: "3R2",
		musicCover: "images/16.png"
	},
	{
		musicDir: "sounds/17.mp3",
		musicName: "｢Miles Away｣",
		musicArtist: "Wontolla, Kasger & Limitless",
		musicCover: "images/17.png"
	},
	{
		musicDir: "sounds/18.mp3",
		musicName: "｢Puzzle｣",
		musicArtist: "RetroVision",
		musicCover: "images/18.png"
	},
	{
		musicDir: "sounds/19.mp3",
		musicName: "｢Entropy｣",
		musicArtist: "Distrion & Alex Skrindo",
		musicCover: "images/19.png"
	},
	{
		musicDir: "sounds/20.mp3",
		musicName: "｢チルノのパーフェクトさんすう教室｣",
		musicArtist: "IOSYS",
		musicCover: "images/20.png"
	},
	{
		musicDir: "sounds/21.mp3",
		musicName: "｢Outbreak (feat. MYLK)｣",
		musicArtist: "Feint",
		musicCover: "images/21.png"
	}
];

MusicProvider.currentMusicPos = 0;
MusicProvider.currentMusic = MusicProvider.musicList[ 20 ]; // 0

MusicProvider.TickTok = function( )
{
	if ( MusicProvider.currentMusic == null ) return;
	
	MusicProvider.currentMusicPos += 1;
	
	if ( MusicProvider.currentMusic.onTimeChanged )
	{
		MusicProvider.currentMusic.onTimeChanged( Main.io, MusicProvider.currentMusicPos );
	}
	
	console.log( ( "[Music] Current MusicPos " + MusicProvider.currentMusicPos ).yellow );
}

setInterval( MusicProvider.TickTok, 1000 );

// this 로 변경할것
MusicProvider.MusicPlay = function( )
{
	MusicProvider.currentMusicPos = 0;
	var newArr = Object.assign( { }, MusicProvider.currentMusic );
	newArr.musicPos = 0;
	
	Main.io.emit( "music_define", newArr );
	Main.io.emit( "music_play" );
	
	Main.io.emit( "chatReceive", {
		// name: client.name,
		message: MusicProvider.currentMusic.musicArtist + " - " + MusicProvider.currentMusic.musicName + " 음악을 재생합니다.",
		type: "system",
	} );
}

module.exports = MusicProvider;