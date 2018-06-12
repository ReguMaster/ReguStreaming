

const path = require( "path" );
const route = require('./routes/index.js');
var express = require('express');
var fs = require( "fs" );
var app = express();
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


var server = require('http').createServer(app);
var io = require('socket.io')(server);
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
  
var stdin = process.openStdin();



var musicList = [
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
	}
];
var currentMusic = musicList[ 0 ];

var mcMode = false; // mc mode?
var currentMusicPos = 0;

function musicPlayThread( )
{
	if ( currentMusic == null ) return;
	
	currentMusicPos += 1;
	
	console.log( "Current MusicPos " + currentMusicPos );
}

setInterval( musicPlayThread, 1000 );

function musicPlay( )
{
	currentMusicPos = 0;
	var newArr = Object.assign( { }, currentMusic );
	newArr.musicPos = currentMusicPos;
		
	io.emit( "music_define", newArr );
	io.emit( "music_play" );
}



//https://stackoverflow.com/questions/8128578/reading-value-from-console-interactively
stdin.addListener("data", function( data ) {
	if ( mcMode )
	{
		currentMusic = musicList[ Number( data.toString( ).trim( ) ) ];
		console.log( `"현재 뮤직 설정 완료. ${ currentMusic.musicName }"` );
		mcMode = false;
		
		musicPlay( );
		
		return;
	}
		
	switch( data.toString( ).trim( ) )
	{
		case "mc":
			console.log( "이제 새로운 음악 인덱스를 입력하세요.");
			mcMode = true;
			break;
		case "mfp":
			musicPlay( );
			break;
		case "mrp":
			musicPlay( );
			
			break;
	}
});


app.use( express.static( path.join( __dirname, "public" ) ) );
app.use(express.urlencoded());

app.use('/', route);
app.use((req, res, next) => { // 404 처리 부분
  res.status(404).send('404 Not Found!');
});
app.use((err, req, res, next) => { // 에러 처리 부분
  console.error(err.stack); // 에러 메시지 표시
  res.status(500).send('서버 처리중 오류가 발생했습니다, 관리자에게 문의하세요.'); // 500 상태 표시 후 에러 메시지 전송
});

server.listen(8085, "1.224.53.166", function() {
	console.log( "Socket IO 서버가 리스닝 중입니다. (8085)" );
});

var clientsCount = 0;

io.on('connection', function(socket) {
	clientsCount++;
	
	socket.on('join', function(data) {
		console.log(`클라이언트 로그인\n name: '${ data.name }'\n userid: '${ data.userid }'`);

		socket.name = data.name;
		socket.userid = data.userid;
		
		var newArr = Object.assign( { }, currentMusic );
		newArr.musicPos = currentMusicPos;
		
		io.emit( 'join', clientsCount );
		socket.emit( "music_define", newArr );
		socket.emit( "music_play" );
	});
	
	socket.on('force_disconnect', function() {
		socket.disconnect( );
	})

	socket.on('disconnect', function() {
		clientsCount--;
		console.log( "유저 연결 끊김 " + socket.name );
		io.emit( 'join', clientsCount );
	});
});