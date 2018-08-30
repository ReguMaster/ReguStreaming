/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const util = {};

// https://developers.livechatinc.com/blog/setting-cookies-to-subdomains-in-javascript/
util.cookie = {
    set: function( name, value, days, domain )
    {
        var domain, domainParts, date, expires, host;

        if ( days )
        {
            date = new Date( );
            date.setTime( date.getTime( ) + ( days * 24 * 60 * 60 * 1000 ) );
            expires = "; expires=" + date.toGMTString( );
        }
        else
        {
            expires = "";
        }

        host = domain;
        if ( host.split( '.' )
            .length === 1 )
        {
            // no "." in a domain - it's localhost or something similar
            document.cookie = name + "=" + value + expires + "; path=/";
        }
        else
        {
            // Remember the cookie on all subdomains.
            //
            // Start with trying to set cookie to the top domain.
            // (example: if user is on foo.com, try to set
            //  cookie to domain ".com")
            //
            // If the cookie will not be set, it means ".com"
            // is a top level domain and we need to
            // set the cookie to ".foo.com"
            domainParts = host.split( '.' );
            domainParts.shift( );
            domain = '.' + domainParts.join( '.' );

            document.cookie = name + "=" + value + expires + "; path=/; domain=" + domain;

            // check if cookie was successfuly set to the given domain
            // (otherwise it was a Top-Level Domain)
            if ( util.cookie.get( name ) == null || util.cookie.get( name ) != value )
            {
                // append "." to current domain
                domain = '.' + host;
                document.cookie = name + "=" + value + expires + "; path=/; domain=" + domain;
            }
        }
    },

    get: function( name )
    {
        var nameEQ = name + "=";
        var ca = document.cookie.split( ';' );
        for ( var i = 0; i < ca.length; i++ )
        {
            var c = ca[ i ];
            while ( c.charAt( 0 ) == ' ' )
            {
                c = c.substring( 1, c.length );
            }

            if ( c.indexOf( nameEQ ) == 0 ) return c.substring( nameEQ.length, c.length );
        }
        return null;
    },

    erase: function( name )
    {
        util.cookie.set( name, '', -1 );
    }
};

// https://gist.github.com/Papacidero/5195681
util.startCSSAnimation = function( animationProprierties, targetElement, onEnd )
{
    if ( typeof targetElementClass == "string" )
        targetElement = $( targetElement );

    // targetElement.css( "animation", "" );
    targetElement.css( "animation", animationProprierties );

    //animationend webkitAnimationEnd oanimationend MSAnimationEnd
    targetElement.off( "animationend webkitAnimationEnd oanimationend MSAnimationEnd" )
        .on( "animationend webkitAnimationEnd oanimationend MSAnimationEnd", function( )
        {
            targetElement.css( "animation", "" );
            targetElement.off( "animationend webkitAnimationEnd oanimationend MSAnimationEnd" );

            if ( onEnd )
                onEnd( );
        } );
}

util.notificationType = {
    info: 0,
    warning: 1,
    danger: 2,
    success: 3
}
util.notification = function( notificationType, title, message, time, allow_dismiss )
{
    if ( typeof allow_dismiss === "undefined" )
        allow_dismiss = true;

    if ( notificationType === util.notificationType.info )
    {
        return $.notify(
        {
            icon: "glyphicon glyphicon-info-sign",
            title: title,
            message: message
        },
        {
            allow_dismiss: allow_dismiss,
            type: "info",
            placement:
            {
                from: "bottom",
                align: "center"
            },
            newest_on_top: true,
            animate:
            {
                enter: "animated zoomInUp",
                exit: "animated zoomOutDown"
            },
            delay: time,
            timer: 1000,
            template: `<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-pastel-{0}" role="alert">
            <button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>
            <span data-notify="icon"></span>
            <span data-notify="title">{1}</span>
            <span data-notify="message">{2}</span>
        </div>`
        } );
    }
    else if ( notificationType === util.notificationType.warning )
    {
        return $.notify(
        {
            icon: "glyphicon glyphicon-warning-sign",
            title: title,
            message: message
        },
        {
            allow_dismiss: allow_dismiss,
            type: "warning",
            placement:
            {
                from: "bottom",
                align: "center"
            },
            newest_on_top: true,
            animate:
            {
                enter: "animated zoomInUp",
                exit: "animated zoomOutDown"
            },
            delay: time,
            timer: 1000,
            template: `<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-pastel-{0}" role="alert">
            <button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>
            <span data-notify="icon"></span>
            <span data-notify="title">{1}</span>
            <span data-notify="message">{2}</span>
        </div>`
        } );
    }
    else if ( notificationType === util.notificationType.danger )
    {
        return $.notify(
        {
            icon: "glyphicon glyphicon-warning-sign",
            title: title,
            message: message
        },
        {
            allow_dismiss: allow_dismiss,
            type: "danger",
            placement:
            {
                from: "bottom",
                align: "center"
            },
            newest_on_top: true,
            animate:
            {
                enter: "animated zoomInUp",
                exit: "animated zoomOutDown"
            },
            delay: time,
            timer: 1000,
            template: `<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-pastel-{0}" role="alert">
            <button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>
            <span data-notify="icon"></span>
            <span data-notify="title">{1}</span>
            <span data-notify="message">{2}</span>
        </div>`
        } );
    }
    else if ( notificationType === util.notificationType.success )
    {
        return $.notify(
        {
            icon: "glyphicon glyphicon-warning-sign",
            title: title,
            message: message
        },
        {
            allow_dismiss: allow_dismiss,
            type: "success",
            placement:
            {
                from: "bottom",
                align: "center"
            },
            newest_on_top: true,
            animate:
            {
                enter: "animated zoomInUp",
                exit: "animated zoomOutDown"
            },
            delay: time,
            timer: 1000,
            template: `<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-pastel-{0}" role="alert">
            <button type="button" aria-hidden="true" class="close" data-notify="dismiss">×</button>
            <span data-notify="icon"></span>
            <span data-notify="title">{1}</span>
            <span data-notify="message">{2}</span>
        </div>`
        } );
    }
}

// https://stackoverflow.com/questions/5142337/read-a-javascript-cookie-by-name
util.getCookieByName = function( cookiename )
{
    // Get name followed by anything except a semicolon
    var cookiestring = RegExp( "" + cookiename + "[^;]+" )
        .exec( document.cookie );
    // Return everything after the equal sign, or an empty string if the cookie name not found
    return decodeURIComponent( !!cookiestring ? cookiestring.toString( )
        .replace( /^[^=]+./, "" ) : "" );
}

util.htmlNotification = function( body, autoClose, autoCloseTime )
{
    if ( Notification.permission !== "granted" ) return;

    var notification = new Notification( "레그 스트리밍",
    {
        icon: "/images/test.png",
        body: body
    } );

    notification.onclick = function( )
    {
        this.close( );
    }

    if ( autoClose )
    {
        setTimeout( function( )
        {
            notification.close( );
        }, autoCloseTime || 3000 );
    }
}

util.getAMPM = function( hour )
{
    return hour < 12 ? "AM" : "PM";
}

// https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
util.isIE = function( )
{
    return false || !!document.documentMode;
}

util.isEdge = function( )
{
    return !util.isIE( ) && !!window.StyleMedia;
}

//https://gist.github.com/demonixis/4202528/5f0ce3c2622fba580e78189cfe3ff0f9dd8aefcc
Math.clamp = function( value, min, max )
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

// Obtient une interpolation linéaire entre 2 valeurs
Math.lerp = function( a, b, amount )
{
    amount = amount < 0 ? 0 : amount;
    amount = amount > 1 ? 1 : amount;
    return a + ( b - a ) * amount;
}

String.prototype.toMMSS = function( )
{
    var sec_num = parseInt( this, 10 ); // don't forget the second param
    var hours = Math.floor( sec_num / 3600 );
    var minutes = Math.floor( ( sec_num - ( hours * 3600 ) ) / 60 );
    var seconds = sec_num - ( hours * 3600 ) - ( minutes * 60 );

    if ( hours < 10 )
    {
        hours = "0" + hours;
    }
    if ( minutes < 10 )
    {
        minutes = "0" + minutes;
    }
    if ( seconds < 10 )
    {
        seconds = "0" + seconds;
    }
    return minutes + ':' + seconds;
}

// function formatTime( numberofseconds )
// {
//     var zero = '0',
//         hours, minutes, seconds, time;

//     time = new Date( 0, 0, 0, 0, 0, numberofseconds, 0 );

//     mm = time.getMinutes( );
//     ss = time.getSeconds( );

//     // Pad zero values to 00
//     mm = ( zero + mm )
//         .slice( -2 );
//     ss = ( zero + ss )
//         .slice( -2 );

//     time = mm + ':' + ss
//     return time;
// }

util.getQueryByName = function( name, url )
{
    if ( !url )
        url = window.location.href;

    name = name.replace( /[\[\]]/g, "\\$&" );
    var regex = new RegExp( "[?&]" + name + "(=([^&#]*)|&|#|$)" ),
        results = regex.exec( url );

    if ( !results )
        return null;
    if ( !results[ 2 ] )
        return '';

    return decodeURIComponent( results[ 2 ].replace( /\+/g, " " ) );
}

util.getQueryObject = function( )
{
    var queryStr = window.location.search,
        queryArr = queryStr.replace( "?", "" )
        .split( "&" ),
        queryParams = [ ];

    var length = queryArr.length;

    for ( var i = 0; i < length; i++ )
    {
        var qArr = queryArr[ i ].split( "=" );
        queryParams[ qArr[ 0 ] ] = qArr[ 1 ];
    }

    return queryParams;
}

/*
<div class="modal modal-center fade" id="dialogModal" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-center" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title"></h4>
                    <!-- <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button> -->
                </div>

                <div class="modal-body">

                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-default" id="dialogModalClose" data-dismiss="modal">닫기</button>
                    <button type="button" class="btn btn-primary" id="dialogModalConfirm">확인</button>
                </div>
            </div>
        </div>
    </div>
*/

util.removeAllQueryParameters = function( )
{
    window.history.replaceState(
    {}, document.title, "/" );
}

util.showModal = function( title, body, closeText, confirmText, onClose, onConfirm, isSingleButton, bodyStyle )
{
    var self = $( "#dialogModal" );

    self.find( ".modal-title" )
        .text( title );

    var bodyObj = self.find( ".modal-body" );

    bodyObj.html( body );

    if ( bodyStyle )
        bodyObj.css( bodyStyle );
    else
        bodyObj.removeAttr( "style" );

    var closeObj = self.find( "#dialogModalClose" );

    closeObj.text( closeText || "닫기" );

    if ( onClose )
        closeObj.one( "click", onClose );


    if ( isSingleButton )
    {
        self.find( "#dialogModalConfirm" )
            .hide( );
    }
    else
    {
        var confirmObj = self.find( "#dialogModalConfirm" );

        if ( !confirmObj.is( ":visible" ) )
            confirmObj.show( );

        confirmObj.text( confirmText || "확인" );

        if ( onConfirm )
            confirmObj.one( "click", onConfirm );
    }

    self.modal( );
}

if ( !String.format )
{
    // https://code.i-harness.com/ko/q/95066
    String.format = function( format )
    {
        var args = Array.prototype.slice.call( arguments, 1 );

        return format.replace( /{(\d+)}/g, function( match, number )
        {
            return typeof args[ number ] != "undefined" ? args[ number ] : match;
        } );
    }
}

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