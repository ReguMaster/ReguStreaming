/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const socket = io( "/administrator",
{
    reconnectionDelay: 0,
    secure: true
} );

const reguStreaming = {};
reguStreaming.config = {};

let controls = {
    logConsole: null
};

reguStreaming.setConfig = function( name, value )
{
    this.config[ name ] = value;
}

reguStreaming.getConfig = function( name, defaultValue )
{
    if ( typeof this.config[ name ] === "undefined" || this.config[ name ] === null )
        return defaultValue || null;

    return this.config[ name ];
}

reguStreaming.defineControls = function( )
{
    var keys = Object.keys( controls );

    for ( var i = 0; i < keys.length; i++ )
    {
        controls[ keys[ i ] ] = $( "#" + keys[ i ] );
    }

    reguStreaming.controlInitialized = true;
}

// 브라우저 간 호환성 해결. https://blog.outsider.ne.kr/856
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.oGetUserMedia || navigator.msGetUserMedia;
URL = window.URL || window.webkitURL || window.mozURL || window.oURL || window.msURL;

reguStreaming.commandHistory = [ ];
reguStreaming.currentCommandHistoryIndex = 0;

window.onload = function( )
{
    reguStreaming.defineControls( );

    // https://stackoverflow.com/questions/4127118/can-you-detect-dragging-in-jquery
    $( ".executeCommandField" )
        .on( "keydown", function( e )
        {
            if ( e.keyCode === 13 )
            {
                var val = $( this )
                    .val( );
                socket.emit( "RS.administrator.executeCommand",
                {
                    command: val
                } );

                reguStreaming.commandHistory.push( val );
                reguStreaming.currentCommandHistoryIndex = reguStreaming.commandHistory.length - 1;

                $( this )
                    .val( "" );
            }
            else if ( event.keyCode == 38 ) // 위 방향
            {
                if ( reguStreaming.commandHistory.length > 0 && reguStreaming.commandHistory[ reguStreaming.currentCommandHistoryIndex ] )
                {
                    var history = reguStreaming.commandHistory[ reguStreaming.currentCommandHistoryIndex ]

                    $( this )
                        .val( history )
                        .putCursorAtEnd( );

                    reguStreaming.currentCommandHistoryIndex = Math.clamp( reguStreaming.currentCommandHistoryIndex - 1, 0, reguStreaming.commandHistory.length - 1 );
                }
            }
            else if ( event.keyCode == 40 ) // 아래 방향
            {
                if ( reguStreaming.commandHistory[ reguStreaming.currentCommandHistoryIndex ] )
                {
                    var history = reguStreaming.commandHistory[ reguStreaming.currentCommandHistoryIndex ]

                    $( this )
                        .val( history )
                        .putCursorAtEnd( );

                    reguStreaming.currentCommandHistoryIndex = Math.clamp( reguStreaming.currentCommandHistoryIndex + 1, 0, reguStreaming.commandHistory.length - 1 );
                }
            }
        } );
    controls.logConsole.on( "mousedown", function( e )
        {
            $( this )
                .data( 'p0',
                {
                    x: e.pageX,
                    y: e.pageY
                } );
            reguStreaming.isLogInteract = true;
        } )
        .on( "mouseup", function( e )
        {
            var p0 = $( this )
                .data( 'p0' ),
                p1 = {
                    x: e.pageX,
                    y: e.pageY
                },
                d = Math.sqrt( Math.pow( p1.x - p0.x, 2 ) + Math.pow( p1.y - p0.y, 2 ) );

            if ( d < 4 )
            {
                // alert( 'clicked' );
            }

            reguStreaming.isLogInteract = false;
        } )
};

const LogType = {
    Info: 0,
    Warning: 1,
    Error: 2,
    Event: 3,
    Important: 99
}
socket.on( "RS.administrator.logEmit", function( data )
{
    var newObj = $(
            `<div class="logItem">${ data.log }</div>`
        )
        .appendTo( controls.logConsole );

    switch ( data.level )
    {
        case LogType.Info:
            newObj.css( "color", "white" );
            break;
        case LogType.Warning:
            newObj.css( "color", "yellow" );
            break;
        case LogType.Error:
            newObj.css( "color", "red" );
            break;
        case LogType.Event:
            newObj.css( "color", "cyan" );
            break;
        case LogType.Important:
            newObj.css( "color", "blue" );
    }

    if ( !reguStreaming.isLogInteract )
        controls.logConsole.scrollTop( controls.logConsole[ 0 ].scrollHeight );
} );