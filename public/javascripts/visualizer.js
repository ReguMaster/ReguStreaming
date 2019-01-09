/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/
// defined variables //
// canvas

'use strict';

reguStreaming.canvas = null;
reguStreaming.canvas2D = null;

reguStreaming.audioContext = null;

/*
let canvas;
let canvas2D;

let src;
let analyser;
let context;

let canvasWidth;
let canvasHeight;

let visualizerBufferLength;
let visualizerDataArray;

function visualizerInitialize( )
{
    context = new AudioContext( );
    src = context.createMediaElementSource( controls.videoContainer.get( 0 ) );
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
*/

reguStreaming.canvasInitialize = function( )
{
    this.visualizerInitialized = true;

    /*
    if ( this.visualizerInitialized ) return;
    if ( !reguStreaming.audioObj )
    {
        console.log( "audioObj not genereated" )
        return;
    }

    var context = new AudioContext( );
    var source = context.createMediaElementSource( reguStreaming.audioObj );
    var analyser = context.createAnalyser( );

    source.connect( analyser );
    analyser.connect( context.destination );
    analyser.fftSize = 1024;

    var visualizerBufferLength = analyser.frequencyBinCount;
    reguStreaming.visualizerBuffer = new Uint8Array( visualizerBufferLength );

    this.audioContext = context;
    this.audioSource = source;
    this.audioAnalyser = analyser;

    bg_r = Math.floor( Math.random( ) * 255 ) + 1;
    bg_g = Math.floor( Math.random( ) * 255 ) + 1;
    bg_b = Math.floor( Math.random( ) * 255 ) + 1;

    this.visualizerInitialized = true;*/
}

reguStreaming.canvasResize = function( )
{
    if ( !this.canvas ) return;

    if ( this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight - 112 )
    {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 112;
    }
}

reguStreaming._currentCaption = {};

reguStreaming.showCaption = function( data )
{
    if ( data === null )
    {
        reguStreaming._currentCaption = {};
        return;
    }

    reguStreaming._currentCaption = {
        val: data.val
    }
}

reguStreaming.captionInitialize = function( )
{
    this.captionClear( );

    var roomID = reguStreaming.getConfig( "roomID", null );

    if ( !roomID ) return;

    jQuery.ajax(
    {
        url: "/extra/" + roomID,
        type: "get",
        dataType: "json",
        success: function( caption )
        {
            if ( !caption || !Array.isArray( caption ) || caption.length === 0 ) return;
            var self = reguStreaming;

            self.captionTick = setInterval( function( )
            {
                var currentTime = Math.round( controls.videoContainer.get( 0 )
                    .currentTime );
                var length = caption.length;

                for ( var i = 0; i < length; i++ )
                {
                    var captionData = caption[ i ];

                    if ( currentTime >= captionData.attr.start && currentTime <= captionData.attr.start + captionData.attr.dur )
                    {
                        self.showCaption( captionData );
                        // caption.splice( i, 1 );
                        return;
                    }
                }

                self.showCaption( null );
            }, 100 );
        }
    } );
}

reguStreaming.captionClear = function( )
{
    if ( this.captionTick )
    {
        clearInterval( this.captionTick );
        this.captionTick = null;
    }

    this.showCaption( null );
}

reguStreaming._showingCloudList = [ ];

reguStreaming.tvpleCloudInitialize = function( cloudList ) // 여기 바꾸기
{
    this.tvpleCloudClear( );
    this.tvpleCloudTick = setInterval( function( self )
    {
        var timeData = cloudList[ Math.floor( controls.videoContainer.get( 0 )
            .currentTime ) ];

        if ( timeData )
        {
            var length = timeData.length;

            for ( var i = 0; i < length; i++ )
            {
                var data = timeData[ i ];

                self._showingCloudList.push(
                {
                    startTime: Date.now( ),
                    text: data.text,
                    x: data.x,
                    y: data.y,
                    alpha: 1
                } );
            }
        }
    }, 1000, this );
}

reguStreaming.tvpleCloudClear = function( )
{
    if ( this.tvpleCloudTick )
    {
        clearInterval( this.tvpleCloudTick );
        this.tvpleCloudTick = null;
    }

    this._showingCloudList = [ ];
}

reguStreaming.captionRender = function( )
{
    if ( !this._currentCaption || !this._currentCaption.val ) return;

    var alpha = Number( controls.videoContainer.css( "opacity" ) );
    var currentCaption = this._currentCaption;

    this.canvas2D.font = "20px Nanum Gothic";

    var currentCaptionSplit = currentCaption.val.split( '\n' );
    var y = 0;

    for ( var i = currentCaptionSplit.length - 1; i >= 0; i-- )
    {
        var text = currentCaptionSplit[ i ];
        var textSize = this.canvas2D.measureText( text );

        // 26 = align baseline;

        this.canvas2D.fillStyle = "rgba( 35, 35, 35, " + ( alpha ) + " )";
        this.canvas2D.fillRect( this.canvas.width / 2 - textSize.width / 2 - 6, this.canvas.height - ( 32 + 26 + y ), textSize.width + 12, 26 );

        this.canvas2D.fillStyle = "rgba( 255, 255, 255, " + alpha + " )"
        this.canvas2D.shadowColor = "rgba( 30, 30, 30, 1 )";
        this.canvas2D.shadowBlur = 6;
        this.canvas2D.textAlign = "center";

        this.canvas2D.fillText( text, this.canvas.width / 2, this.canvas.height - ( 26 / 2 ) - 26 - y );

        y += 32;
    }
}

reguStreaming.cloudRender = function( )
{
    if ( !this._showingCloudList || this._showingCloudList.length <= 0 ) return;

    var length = this._showingCloudList.length;
    var now = Date.now( );

    // for ( var i = 0; i < length; i++ )
    // {
    //     var data = reguStreaming._showingCloudList[ i ];

    //     console.log( data );

    //     if ( data.alpha <= 0 )
    //     {
    //         reguStreaming._showingCloudList.splice( i, 1 );
    //         console.log( "removed - " + i );
    //         break;
    //     }

    //     if ( now - data.startTime >= 2000 )
    //     {
    //         data.alpha -= 0.05;
    //     }
    // }

    // console.log( "length : " + length )

    for ( var i = 0; i < length; i++ )
    {
        var data = this._showingCloudList[ i ];

        if ( !data ) continue;

        // console.log( data );

        if ( data.alpha <= 0 )
        {
            this._showingCloudList.splice( i, 1 );
            // console.log( "cloud Removed - " + i );
            continue;
        }

        if ( now - data.startTime >= 1500 )
        {
            data.alpha -= 0.05;
        }

        this.canvas2D.font = "17px Jeju Gothic";
        this.canvas2D.fillStyle = "rgba( 255, 255, 255, " + data.alpha + " )"
        this.canvas2D.shadowColor = "rgba( 50, 50, 50, " + ( data.alpha ) + " )";
        this.canvas2D.shadowBlur = 3;

        this.canvas2D.fillText( data.text, this.canvas.width * data.x, this.canvas.height * data.y );
    }
}

//controls.videoContainer.get( 0 ).currentTime

// var backgroundBeatPer = 0;

// var visualizerX = 0;
// var visualizerBarWidth = 0;
// var visualizerBarHeight = 0;

// function groundRender( )
// {

// }

// // var thumbImg = document.createElement('img');

// // thumbImg.src = 'favicon/icon_64.png';

// function avatarGoTo( data, x, y )
// {

// }

var rot = 0;
var react_x = 0;
var react_y = 0;
var intensity = 0;
var center_x = 0,
    center_y = 0;

var deltarad = 0;

var bar_x = 0,
    bar_y = 0;

var bar_width = 0,
    bar_height = 0;

var radius = 0;
var radius_old = 0;

var bar_x_term = 0,
    bar_y_term = 0;

var bg_r = 0,
    bg_g = 0,
    bg_b = 0;

var bg_r_ani = 0,
    bg_g_ani = 0,
    bg_b_ani = 0;

setInterval( function( )
{
    bg_r = Math.floor( Math.random( ) * 255 ) + 1;
    bg_g = Math.floor( Math.random( ) * 255 ) + 1;
    bg_b = Math.floor( Math.random( ) * 255 ) + 1;


}, 5000 );

function lerp( A, B, t )
{
    return ( A + t * ( B - A ) )
}


reguStreaming.visualizerRender = function( w, h )
{
    if ( !this.visualizerInitialized ) return;

    var x = 0;
    var barWidth;
    var barHeight;

    this.audioAnalyser.getByteFrequencyData( this.visualizerBuffer );

    // console.log( this.visualizerBuffer );
    // var length = this.visualizerBuffer.length;

    // for ( var i = 0; i < length; i++ )
    // {
    //     barWidth = w / length;
    //     barHeight = this.visualizerBuffer[ i ];

    //     var r = 255 - ( i / 3 );
    //     var g = 255 - ( i / 3 );
    //     var b = 255;
    //     var a = ( barHeight / ( h / 2 ) );

    //     this.canvas2D.fillStyle = "rgba(" + r + "," + g + "," + b + ", " + a + ")";
    //     this.canvas2D.fillRect( x, h - barHeight, barWidth, barHeight );

    //     x += barWidth + 3;
    // }

    rot = rot + intensity * 0.0000001;

    react_x = 0;
    react_y = 0;

    intensity = 0;

    var bars = 300;

    var rads = 0;

    for ( var i = 0; i < bars; i++ )
    {
        rads = Math.PI * 2 / bars;

        bar_x = center_x;
        bar_y = center_y;

        bar_height = Math.min( 99999, Math.max( ( this.visualizerBuffer[ i ] * 2 - 100 ), 0 ) );
        bar_width = bar_height * 0.01;


        bar_x_term = center_x + Math.cos( rads * i + rot ) * ( radius + bar_height );
        bar_y_term = center_y + Math.sin( rads * i + rot ) * ( radius + bar_height );

        // this.canvas2D.save();

        var lineColor = "rgb(255, 255, 255)";

        this.canvas2D.strokeStyle = lineColor;
        this.canvas2D.lineWidth = bar_width;
        this.canvas2D.beginPath( );
        this.canvas2D.moveTo( bar_x, bar_y );
        this.canvas2D.lineTo( bar_x_term, bar_y_term );
        this.canvas2D.stroke( );

        react_x += Math.cos( rads * i + rot ) * ( radius + bar_height );
        react_y += Math.sin( rads * i + rot ) * ( radius + bar_height );

        intensity += bar_height;
    }

    center_x = canvas.width / 2 - ( react_x * 0.007 );
    center_y = canvas.height / 2 - ( react_y * 0.007 );

    radius_old = radius;
    radius = 20 + ( intensity * 0.0015 );
    deltarad = radius - radius_old;

    bg_r_ani = lerp( bg_r_ani, bg_r, 0.007 );
    bg_g_ani = lerp( bg_g_ani, bg_g, 0.007 );
    bg_b_ani = lerp( bg_b_ani, bg_b, 0.007 );

    this.canvas2D.shadowBlur = 6;
    this.canvas2D.shadowColor = "rgba(" + bg_r_ani + "," + bg_g_ani + "," + bg_b_ani + ", 1)";

    this.canvas2D.fillStyle = "rgba(" + bg_r_ani + "," + bg_g_ani + "," + bg_b_ani + ", 1)";
    this.canvas2D.beginPath( );
    this.canvas2D.arc( center_x, center_y, radius + 2, 0, Math.PI * 2, false );
    this.canvas2D.fill( );

    this.canvas2D.shadowBlur = null;
    this.canvas2D.shadowColor = null;
}

reguStreaming.canvasRender = function( )
{
    // window.requestAnimationFrame( reguStreaming.canvasRender );

    if ( reguStreaming.documentLoaded )
    {
        // groundRender( );

        // visualizerX = 0;

        // 최적화하기.. videoProvider 다르면 실행 안함
        // analyser.getByteFrequencyData( visualizerDataArray );

        // canvas2D.fillStyle = "rgb( 0, 0, 0 )"
        reguStreaming.canvas2D.clearRect( 0, 0, reguStreaming.canvas.width, reguStreaming.canvas.height );

        if ( reguStreaming.mediaProvider === reguStreaming.providerType.Tvple )
            reguStreaming.cloudRender( );
        else if ( reguStreaming.mediaProvider === reguStreaming.providerType.Youtube )
        {
            reguStreaming.captionRender( );
            // reguStreaming.visualizerRender( reguStreaming.canvas.width, reguStreaming.canvas.height );
        }
    }

    //ground;
    /*
    canvas2D.fillStyle = "rgba( 50, 50, 50, 0.5 )"
    canvas2D.fillRect( canvas.width * 0.2, canvas.height * 0.7, canvas.width * 0.6, 15 );

    for ( var i = 0; i < anotherClientData.length; i++ )
    {
    	var data = anotherClientData[ i ];
    	
    	// canvas2D.fillStyle = "rgba( 255, 255, 255, 0.75 )"
    	// canvas2D.fillRect( data.x, data.y, 150, 30 );
    	
    	
    	canvas2D.save( );
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
    	canvas2D.restore( );
    	
    	
    	canvas2D.font = "20px Jeju Gothic";
    	
    	canvas2D.fillStyle = "rgba( 255, 255, 255, 0.75 )"
    	canvas2D.fillText( data.name, data.x + ( 32 / 2 ) - ( canvas2D.measureText( data.name ).width / 2 ), data.y - 92 / 2 );
    }*/
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

    // var average = 0;



    // backgroundBeatPer = Math.lerp( backgroundBeatPer, Math.clamp( 80 + ( average / visualizerBufferLength ), 100, 115 ), 0.3 );
    // controls.bg.css( "backgroundSize", backgroundBeatPer + "% " + backgroundBeatPer + "%");

    window.requestAnimationFrame( reguStreaming.canvasRender );
}