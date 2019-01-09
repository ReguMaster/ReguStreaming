/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const logMaxCount = 1500;

let totalAcceptableClients = 10;
let logCount = 0;
let commandInputHistory = [ ];
let currentCommandInputHistoryIndex = 0;
let controls = {
    logConsole: $( ".RS-logConsole" ),
    statusIcon: $( ".RS-status-icon" ),
    statusStat: $( ".RS-status-stats" ),
    statusCPU: $( ".RS-status-CPU" ),
    statusCPUInner: $( ".RS-status-CPUInner" ),
    statusCPUText: $( ".RS-status-CPUText" ),
    clientCount: $( ".RS-status-clientCount" ),
    clientCountInner: $( ".RS-status-clientCountInner" ),
    clientCountText: $( ".RS-status-clientCountText" ),
    statusRAM: $( ".RS-status-RAM" ),
    statusRAMInner: $( ".RS-status-RAMInner" ),
    statusRAMText: $( ".RS-status-RAMText" )
};

window.onbeforeunload = function( e )
{
    return false;
}

window.onload = function( )
{
    $( ".RS-commandField" )
        .on( "keydown", function( e )
        {
            if ( e.which === 13 ) // Enter 키
            {
                var self = $( this );
                var cmd = self.val( );

                if ( cmd.length <= 0 ) return;

                electron.ipcRenderer.send( "commandExecute",
                {
                    type: "command",
                    command: cmd
                } );

                if ( commandInputHistory.length > 5 )
                    commandInputHistory.slice( 0, 1 );

                commandInputHistory.push( cmd );

                currentCommandInputHistoryIndex = commandInputHistory.length - 1;

                self.val( "" );
            }
            else if ( e.which == 38 ) // 위 방향
            {
                if ( commandInputHistory.length > 0 && commandInputHistory[ currentCommandInputHistoryIndex ] )
                {
                    var messageHistory = commandInputHistory[ currentCommandInputHistoryIndex ]

                    $( this )
                        .val( messageHistory )
                        .putCursorAtEnd( );

                    currentCommandInputHistoryIndex = Math.clamp( currentCommandInputHistoryIndex - 1, 0, commandInputHistory.length - 1 );
                }
            }
            else if ( e.which == 40 ) // 아래 방향
            {
                if ( commandInputHistory[ currentCommandInputHistoryIndex ] )
                {
                    var messageHistory = commandInputHistory[ currentCommandInputHistoryIndex ]

                    $( this )
                        .val( messageHistory )
                        .putCursorAtEnd( );

                    currentCommandInputHistoryIndex = Math.clamp( currentCommandInputHistoryIndex + 1, 0, commandInputHistory.length - 1 );
                }
            }
        } );
}

electron.ipcRenderer.on( "serverStats", function( e, stats )
{
    var cpuString = stats.cpu.toFixed( 2 ) + "%";

    controls.statusCPUText.attr( "data-cpu", cpuString );
    controls.statusCPUInner.css( "width", cpuString );

    controls.statusRAMText.attr( "data-ram", Math.formatSize( stats.memory ) );
    controls.statusRAMInner.css( "width", ( ( stats.memory / performance.memory.jsHeapSizeLimit ) * 100 ) + "%" );
} );

electron.ipcRenderer.on( "getAcceptableClients", function( e, count )
{
    totalAcceptableClients = count;
} );

electron.ipcRenderer.on( "updateClientCount", function( e, count )
{
    var percent = ( count / totalAcceptableClients ) * 100;

    controls.clientCountText.attr( "data-count", count );
    controls.clientCountInner.css( "width", percent + "%" )
} );

electron.ipcRenderer.on( "serverStatus", function( e, code )
{
    controls.statusIcon.removeClass( "online offline" );
    switch ( code )
    {
        case 0:
            controls.statusIcon.addClass( "offline" );
            break;
        case 1:
            controls.statusIcon.addClass( "online" );
            break;
    }
} );

const logFormatBase = '<div class="RS-logItem logLevel-{0}" id="logItem">{1}</div>';

electron.ipcRenderer.on( "log", function( e, level, message )
{
    if ( ++logCount > logMaxCount )
    {
        logCount--;
        $( "#logItem:first" )
            .remove( );
    }

    var isScrollOnBottom = controls.logConsole.scrollTop( ) + controls.logConsole.innerHeight( ) >= controls.logConsole.prop( "scrollHeight" );

    controls.logConsole.append( String.format( logFormatBase, level, message ) );

    if ( isScrollOnBottom )
        controls.logConsole.scrollTop( controls.logConsole.prop( "scrollHeight" ) );
} );

electron.ipcRenderer.on( "clearLog", function( e )
{
    controls.logConsole.empty( );
    logCount = 0;
} );

( function( $, $2 )
{
    $.formatSize = function( a, b )
    {
        if ( 0 == a ) return "0 Bytes";
        var c = 1024,
            d = b || 2,
            e = [ "Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB" ],
            f = Math.floor( Math.log( a ) / Math.log( c ) );

        return parseFloat( ( a / Math.pow( c, f ) )
            .toFixed( d ) ) + " " + e[ f ]
    }
    //https://gist.github.com/demonixis/4202528/5f0ce3c2622fba580e78189cfe3ff0f9dd8aefcc
    $.clamp = function( value, min, max )
    {
        if ( value < min )
        {
            return min;
        }
        else if ( value > max )
        {
            return max;
        }

        return value;
    }

    if ( !$2.format )
    {
        // https://code.i-harness.com/ko/q/95066
        $2.format = function( format )
        {
            var args = Array.prototype.slice.call( arguments, 1 );

            return format.replace( /{(\d+)}/g, function( match, number )
            {
                return typeof args[ number ] != "undefined" ? args[ number ] : match;
            } );
        }
    }
}( Math, String ) );

// https://gist.github.com/davefearon/2115905
( function( $ )
{
    // https://css-tricks.com/snippets/jquery/move-cursor-to-end-of-textarea-or-input/
    $.fn.putCursorAtEnd = function( )
    {
        return this.each( function( )
        {

            // Cache references
            var $el = $( this ),
                el = this;

            // Only focus if input isn't already
            if ( !$el.is( ":focus" ) )
            {
                $el.focus( );
            }

            // If this function exists... (IE 9+)
            if ( el.setSelectionRange )
            {

                // Double the length because Opera is inconsistent about whether a carriage return is one character or two.
                var len = $el.val( )
                    .length * 2;

                // Timeout seems to be required for Blink
                setTimeout( function( )
                {
                    el.setSelectionRange( len, len );
                }, 1 );

            }
            else
            {

                // As a fallback, replace the contents with itself
                // Doesn't work in Chrome, but Chrome supports setSelectionRange
                $el.val( $el.val( ) );

            }

            // Scroll to the bottom, in case we're in a tall textarea
            // (Necessary for Firefox and Chrome)
            this.scrollTop = 999999;

        } );
    };
}( jQuery ) );