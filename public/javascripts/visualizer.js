/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/
// defined variables //
// canvas

let canvas;
let canvas2D;

let src;
let analyser;
let context;

let canvasWidth;
let canvasHeight;

let visualizerBufferLength;
let visualizerDataArray;

function initializeCanvas( )
{
	canvas = document.getElementById( "canvas" );
	canvas2D = canvas.getContext( "2d" );
	
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	setInterval( resizeCanvas, 100 );
}

function resizeCanvas( )
{
	if ( typeof canvas === "undefined" ) return;
	
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

function visualizerInitialize( )
{
	context = new AudioContext( );
	src = context.createMediaElementSource( audio );
	analyser = context.createAnalyser( );
	
	src.connect( analyser );
	analyser.connect( context.destination );
	analyser.fftSize = 1024;
	
	visualizerBufferLength = analyser.frequencyBinCount;
	visualizerDataArray = new Uint8Array( visualizerBufferLength );
	
	visualizerX = 0;
	visualizerBarWidth = ( canvas.width / visualizerBufferLength ) * 0.7;
	
	visualizerRender( );
}

function groundInitialize( )
{
	
	groundRender( );
}

var backgroundBeatPer = 0;
	
var visualizerX = 0;
var visualizerBarWidth = 0;
var visualizerBarHeight = 0;

function groundRender( )
{
	
}

var thumbImg = document.createElement('img');

thumbImg.src = 'favicon/icon_64.png';

function visualizerRender( )
{
	requestAnimationFrame( visualizerRender );
	
	if ( !onLoaded ) return;
	
	groundRender();
	
	visualizerX = 0;
	
	analyser.getByteFrequencyData( visualizerDataArray );
	
	// canvas2D.fillStyle = "rgb( 0, 0, 0 )"
	canvas2D.clearRect( 0, 0, canvas.width, canvas.height );
	
	//ground;
	canvas2D.fillStyle = "rgba( 50, 50, 50, 0.5 )"
	canvas2D.fillRect( canvas.width * 0.2, canvas.height * 0.7, canvas.width * 0.6, 15 );

	for ( var i = 0; i < anotherClientData.length; i++ )
	{
		var data = anotherClientData[ i ];
		
		// canvas2D.fillStyle = "rgba( 255, 255, 255, 0.75 )"
		// canvas2D.fillRect( data.x, data.y, 150, 30 );
		
		
		canvas2D.beginPath( );
		canvas2D.arc( data.x, data.y, 32, 0, 2 * Math.PI, false );
		canvas2D.fillStyle = "rgba( 255, 255, 255, 0.75 )"
		canvas2D.fill( );
		canvas2D.lineWidth = 1.5;
		canvas2D.strokeStyle = "black";
		canvas2D.stroke( );
		canvas2D.closePath( );
		canvas2D.clip( );
		
		canvas2D.drawImage( thumbImg, 0, 0, 64, 64, data.x - (64/2), data.y - (64/2), 64, 64 );
		
		canvas2D.font = "20px Jeju Gothic";
		canvas2D.fillText( data.name, data.x + ( 32 / 2 ) - ( canvas2D.measureText( data.name ).width / 2 ), data.y - 92 / 2 );
	}
// var average = 0;
// var count = 0;

// for ( var i = 0; i < 8; i++ )
// {
// var average = 0;
// var sampleCount = Math.pow( 2, i ) * 2;

// if ( i == 7 ) sampleCount += 2;

// for ( var j = 0; j < sampleCount; j++ )
// {
// average += dataArray[ count ] * ( count + 1 );
// count++;
// }

// average /= count;
// dataArrayEight[ i ] = average*5;
// }

	var average = 0;

	for ( var i = 0; i < visualizerBufferLength; i++ )
	{
		visualizerBarHeight = visualizerDataArray[ i ] * 0.5;
		
		var r = 150;
		var g = 150;
		var b = 150;
		var a =	150;//( visualizerBarHeight / ( canvas.height / 4 ) );
		
		canvas2D.fillStyle = "rgba(" + r + "," + g + "," + b + ", " + a + ")";
		canvas2D.fillRect( visualizerX, canvas.height - visualizerBarHeight, visualizerBarWidth, visualizerBarHeight );

		visualizerX += visualizerBarWidth + 7;
		
		average += visualizerBarHeight;
	}
	
	backgroundBeatPer = Math.lerp( backgroundBeatPer, Math.clamp( 70 + ( average / visualizerBufferLength ), 100, 130 ), 0.45 );
	elements.bg.css( "backgroundSize", backgroundBeatPer + "% " + backgroundBeatPer + "%");
}