/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/
// defined variables //
// canvas

'use strict';

reguStreaming.canvas = null;
reguStreaming.canvas2D = null;

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
    reguStreaming.captionReset( );

    var roomID = reguStreaming.getConfig( "roomID", null );

    if ( roomID )
    {
        $.ajax(
        {
            url: "/extra/" + roomID,
            type: "get",
            dataType: "json",
            success: function( caption )
            {
                if ( !caption || caption.length === 0 ) return;
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
}

reguStreaming.captionReset = function( )
{
    if ( this.captionTick )
        clearInterval( this.captionTick );

    this.showCaption( null );
}

reguStreaming._showingCloudList = [ ];
reguStreaming._showCloud = function( data )
{
    this._showingCloudList.push(
    {
        startTime: Date.now( ),
        text: data.text,
        x: data.x,
        y: data.y,
        alpha: 1
    } );

    // console.log( reguStreaming._showingCloudList );
}

reguStreaming.cloudInitialize = function( cloud ) // 여기 바꾸기
{
    this.cloudReset( );

    this.cloudTickTok = setInterval( function( self )
    {
        var timeData = cloud[ Math.floor( controls.videoContainer.get( 0 )
            .currentTime ) ];

        if ( timeData )
        {
            var length = timeData.length;

            for ( var i = 0; i < length; i++ )
            {
                self._showCloud( timeData[ i ] );
            }
        }
    }, 1000, this );
}

reguStreaming.cloudReset = function( )
{
    if ( this.cloudTickTok )
        clearInterval( this.cloudTickTok );

    this._showingCloudList = [ ];
}

reguStreaming.captionRender = function( )
{
    if ( !this._currentCaption || !this._currentCaption.val ) return;

    var alpha = Number( controls.videoContainer.css( "opacity" ) );
    var currentCaption = this._currentCaption;

    this.canvas2D.font = "23px Jeju Gothic";

    var textSize = this.canvas2D.measureText( currentCaption.val );

    this.canvas2D.fillStyle = "rgba( 35, 35, 35, " + ( alpha / 2 ) + " )";
    this.canvas2D.fillRect( this.canvas.width / 2 - ( textSize.width + 12 ) / 2, this.canvas.height - 42 - 24, textSize.width + 12, 32 );

    this.canvas2D.fillStyle = "rgba( 255, 255, 255, " + alpha + " )"
    this.canvas2D.shadowColor = "rgba( 30, 30, 30, 1 )";
    this.canvas2D.shadowBlur = 3;
    this.canvas2D.textAlign = "center";

    this.canvas2D.fillText( currentCaption.val, this.canvas.width / 2, this.canvas.height - 42 );
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
            reguStreaming.captionRender( );
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

    // for ( var i = 0; i < visualizerBufferLength; i++ )
    // {
    //     visualizerBarHeight = visualizerDataArray[ i ] * 0.5;

    //     var r = 0;
    //     var g = 0;
    //     var b = 0;
    //     var a = ( visualizerBarHeight / ( canvas.height / 3 ) );

    //     canvas2D.fillStyle = "rgba(" + r + "," + g + "," + b + ", " + a + ")";
    //     canvas2D.fillRect( visualizerX, canvas.height - visualizerBarHeight, visualizerBarWidth, visualizerBarHeight );

    //     visualizerX += visualizerBarWidth + 5;

    //     average += visualizerDataArray[ i ] / 2;
    // }

    // backgroundBeatPer = Math.lerp( backgroundBeatPer, Math.clamp( 80 + ( average / visualizerBufferLength ), 100, 115 ), 0.3 );
    // controls.bg.css( "backgroundSize", backgroundBeatPer + "% " + backgroundBeatPer + "%");

    window.requestAnimationFrame( reguStreaming.canvasRender );
}