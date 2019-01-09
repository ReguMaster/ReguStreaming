/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const socket = io(
{
    reconnectionDelay: 5000,
    secure: true,
    query:
    {
        "platform": "web",
        "language": navigator.language
    }
} );

var AudioContext = window.AudioContext || window.webkitAudioContext;

// socket.on( 'ping', ( ) =>
// {
//     console.log( "ping" )
// } );

// socket.on( 'pong', ( ) =>
// {
//     console.log( "pong" )
// } );


// socket.on( 'ping', ( ) =>
// {
//     console.log( "ping!" );
// } );

// socket.on( "pong", function( latency )
// {

//     console.log( latency );
// } );

// const siofu = new SocketIOFileUpload( socket );

// 채팅 딜레이 넣기

reguStreaming.debugMode = true;

reguStreaming.controlInitialized = false;
reguStreaming.chatCommands = [
    {
        command: "/clear",
        func: function( )
        {
            controls.chatBoxInner.empty( );

            reguStreaming.currentChatMessageCount = 0;
            reguStreaming.currentChatMessageInputHistoryIndex = 0;
            reguStreaming.chatMessageInputHistory = [ ];

            util.notification( util.notificationType.info, "정리 완료 :", "모든 채팅 메세지가 삭제되었습니다.", 1500 );
        }
    }
];

reguStreaming.registerChatCommand = function( command, callback )
{
    this.chatCommands.push(
    {
        command: command,
        callback: callback
    } );
}

reguStreaming.checkXSS = function( chatMessage, callback )
{
    callback( filterXSS( chatMessage ) !== chatMessage );
}

reguStreaming.allowUploadType = [
    "image/png",
    "image/gif",
    "image/jpg",
    "image/jpeg"
];

reguStreaming.canUpload = function( fileData, callback )
{
    if ( fileData )
    {
        if ( reguStreaming.allowUploadType.indexOf( fileData.type.toLowerCase( ) ) > -1 )
        {
            var img = new Image( );
            img.src = URL.createObjectURL( fileData );
            img.onload = function( )
            {
                var width = this.naturalWidth,
                    height = this.naturalHeight;

                //  reguStreaming.uploadedImageSizeCache

                URL.revokeObjectURL( this.src );

                if ( width <= 2048 && height <= 2048 )
                    callback( true );
                else
                    callback( false, "파일을 업로드할 수 없습니다, 2048x2048 크기를 초과하는 이미지는 업로드할 수 없습니다." );
            }
        }
        else
            callback( false, "파일을 업로드할 수 없습니다, gif, png, jpg 형식의 이미지만 업로드할 수 있습니다." );
    }
    else
        callback( false, "파일을 업로드할 수 없습니다, 파일 데이터가 올바르지 않습니다." );
}

reguStreaming.stickerUploadButtonClicked = function( ) {

}

reguStreaming.imageUploadButtonClicked = function( )
{
    // if ( reguStreaming.getConfig( "isFileUploading", false ) ) return;

    controls.fileInput.trigger( "click" );
}

reguStreaming.fileUploadData = null;

reguStreaming.chatMessageInputHistory = [ ];
reguStreaming.currentChatMessageInputHistoryIndex = 0;

// id element only!
let controls = {
    fileUploadForm: null,
    fileInput: null,
    background: null,

    innerHeader: null,
    innerHeaderRoomPlayersContainer: null,
    innerHeaderRoomPlayersCount: null,
    innerHeaderRoomTitle: null,
    innerHeaderServiceNotification: null,
    innerHeaderServiceStatus: null,

    chatContainer: null,
    chatInputContainer: null,
    chatTextField: null,

    userRightMenu: null,

    videoTitle: null,
    videoProvider: null,
    videoBuffering: null,
    videoPositionBar: null,
    videoPositionBarFull: null,
    innerHeaderVideoPositionHelp: null,

    videoURL: null,
    videoVolumeController: null,
    videoRequesterInformation: null,
    videoRequesterProfileImage: null,
    videoRequesterProfileName: null,

    voteContainerCounterText: null,
    voteRequesterProfileInformation: null,
    voteRequesterProfileImage: null,
    voteRequesterProfileName: null,
    voteContainerTitle: null,
    voteContainerVoteStatusPercent: null,

    voteContainerVoteStatusTrue: null,
    voteContainerVoteStatusFalse: null,

    chatInputContainerDragHint: null,
    chatBoxImageUploadButton: null,
    chatBoxStickerUploadButton: null,

    chatContainerQueueRegisterButton: null,
    chatContainerQueueRegisterButtonDelayRemain: null,

    chatContainerQueueContinueVoteButton: null,
    chatContainerQueueContinueVoteButtonDelayRemain: null,
    queueRegisterContainer: null,
    queueRegisterURLTextField: null,
    queueRegisterStartTimeTextFieldMin: null,
    queueRegisterStartTimeTextFieldSec: null,

    queueVideoInformation: null,
    queueVideoInformationBG: null,
    queueVideoInformationThumbnail: null,
    queueVideoInformationName: null,
    // queueVideoInformationTimeleft: null,
    queueVideoInformationProfileName: null,
    queueVideoInformationProfileImage: null,
    queueVideoInformationRemoveHint: null,
    queueVideoInformationDuration: null,

    voteContainer: null,
    userInfoContainer: null,
    settingContainer: null,

    welcomeClientCount: null,
    chatBoxInner: null,

    queueVideoListContainer: null,

    loginWithContainer: null,
    loginWithSteamButton: null,
    loginWithNaverButton: null,

    headerLoginInformationContainer: null,
    headerLoginInformationContainerProfileImage: null,
    headerLoginInformationContainerProfileName: null,
    headerLoginInformationContainerProfileProvider: null,
    logoutButton: null,

    footer: null,

    canvas: null,
    videoContainer: null,
    videoAutoPlayAgree: null,
    processBackground: null,

    dialogBackground: null
};

function C( id )
{

}

$( window )
    .on( "load", function( )
    {
        // var audioContext = new AudioContext( );

        console.log( "%c[ReguStreaming] Debug mode enabled %c^ㅡ^!", "color: blue; font-size: 15px;", "color: purple; font-size: 20px; text-shadow: 0 0 16px red;" );

        if ( !reguStreaming.getActiveProcessBackground( ) )
            reguStreaming.setActiveProcessBackground( true, null, "서버와 연결하고 정보를 가져오고 있습니다.", true );

        $( window )
            .one( "mouseover", function( )
            {
                if ( !reguStreaming.userInteracted )
                    reguStreaming.userInteracted = true;
            } );

        $( window )
            .one( "scroll", function( )
            {
                if ( !reguStreaming.userInteracted )
                    reguStreaming.userInteracted = true;
            } );


        $( window )
            .one( "keydown", function( )
            {
                if ( !reguStreaming.userInteracted )
                    reguStreaming.userInteracted = true;
            } );

        reguStreaming.defineControls( );
        reguStreaming.ajaxServiceStatus( );

        controls.videoVolumeController.val( reguStreaming.getLocalStorageVolume( ) * 100 );
        controls.videoContainer.prop( "volume", reguStreaming.getLocalStorageVolume( ) );

        if ( localStorage.getItem( "RS.chatInputHistory" ) )
            controls.chatTextField.val( localStorage.getItem( "RS.chatInputHistory" ) );

        if ( localStorage.getItem( "RS.queueRegisterDelay" ) )
        {
            reguStreaming.registerQueueDelay( Number( localStorage.getItem( "RS.queueRegisterDelay" ) ) );
            localStorage.removeItem( "RS.queueRegisterDelay" );
        }

        controls.videoPositionBar.on( "click", function( e )
        {
            if ( reguStreaming.getConfig( "localUserInfo",
                {
                    rank: "user"
                } )
                .rank !== "admin" ) return;

            var xPos = e.clientX;
            var width = window.innerWidth;


            var newPos = Math.round( Number( ( xPos / width ) * controls.videoContainer.get( 0 )
                .duration ) );

            // console.log( xPos );
            // console.log( width );
            // console.log( newPos );
            // console.log( Number.isInteger( newPos ) );

            if ( Number.isInteger( newPos ) )
                socket.emit( "RS.setMediaPos", newPos );
        } );

        controls.videoPositionBar.on( "mouseenter", function( e )
        {
            controls.videoPositionBar.css( "height", "12px" )
                .css( "cursor", "pointer" );

            controls.innerHeaderVideoPositionHelp.stop( )
                .show( )
                .removeClass( "noTransition" )
                .css( "opacity", "1" );

            var handler = controls.videoPositionBar.data( "videoPositionBarMouseOutHandler" );

            if ( handler )
            {
                clearTimeout( handler );
                handler = null;
            }
        } );

        controls.videoPositionBar.on( "mouseleave", function( e )
        {
            var handler = controls.videoPositionBar.data( "videoPositionBarMouseOutHandler" );

            if ( !handler )
            {
                controls.videoPositionBar.data( "videoPositionBarMouseOutHandler", setTimeout( function( )
                {
                    controls.videoPositionBar.css( "height", controls.videoPositionBar.attr( "data-height" ) )
                        .css( "cursor", "default" );

                    controls.innerHeaderVideoPositionHelp.stop( )
                        .addClass( "noTransition" )
                        .opacityTo( "0", 500, function( self )
                        {
                            self.hide( );
                        } );
                }, 1000 ) );
            }
            else
            {
                clearTimeout( handler );

                controls.videoPositionBar.data( "videoPositionBarMouseOutHandler", setTimeout( function( )
                {
                    controls.videoPositionBar.css( "height", controls.videoPositionBar.attr( "data-height" ) )
                        .css( "cursor", "default" );

                    controls.innerHeaderVideoPositionHelp.stop( )
                        .addClass( "noTransition" )
                        .opacityTo( "0", 500, function( self )
                        {
                            self.hide( );
                        } );
                }, 1000 ) );
            }
        } );

        controls.queueVideoInformation.on( "mouseenter", function( e )
        {
            if ( reguStreaming.queueInformationUITimeout )
            {
                clearTimeout( reguStreaming.queueInformationUITimeout );
                reguStreaming.queueInformationUITimeout = null;
            }

            e.stopPropagation( );
        } );

        controls.queueVideoInformation.on( "mouseleave", function( e )
        {
            if ( !reguStreaming.queueInformationUITimeout )
            {
                if ( controls.queueVideoInformation.is( ":visible" ) )
                {
                    util.stopCSSAnimation( controls.queueVideoInformation );

                    util.startCSSAnimation( "fadeOutDown 0.1s", controls.queueVideoInformation, function( )
                    {
                        controls.queueVideoInformation.hide( );
                    } );
                }

                reguStreaming.queueInformationUITimeout = null;
                // e.stopPropagation( );
            }
        } );

        // $( document )
        //     .keydown( function( event )
        //     {
        //         if ( !reguStreaming.getConfig( "lastLoginSuccess", false ) ) return;

        //         if ( event.keyCode == 13 )
        //         {
        //             if ( controls.chatInputContainer.is( ":visible" ) )
        //             {
        //                 util.startCSSAnimation( "slideOutRight 0.1s", controls.chatInputContainer );
        //                 setTimeout( function( )
        //                 {
        //                     controls.chatInputContainer.hide( );
        //                 }, 100 );
        //             }
        //             else
        //             {
        //                 controls.chatInputContainer.show( );
        //                 controls.chatTextField.focus( );

        //                 util.startCSSAnimation( "slideInRight 0.1s", controls.chatInputContainer );
        //             }

        //             return false;
        //         }
        //     } );

        // $( document )
        //     .on( "visibilitychange", function( e )
        //     {
        //         if ( document.visibilityState == "visible" )
        //         {

        //         }
        //         else if ( document.visibilityState == "hidden" )
        //         {

        //         }
        //     } );

        controls.innerHeaderServiceStatus.on( "click", function( e )
        {
            e.stopPropagation( );
        } );

        controls.innerHeaderServiceNotification.on( "click", function( e )
        {
            e.stopPropagation( );
        } );

        controls.videoContainer.on( "loadedmetadata", function( )
        {
            if ( reguStreaming.debugMode )
                console.log( "[ReguStreaming] Video media loaded metadata ..." );
        } );

        controls.videoContainer.on( "loadstart", function( )
        {
            if ( controls.videoContainer.get( 0 )
                .networkState !== 1 ) // NETWORK_IDLE
            {
                if ( !controls.videoBuffering.is( ":visible" ) )
                    controls.videoBuffering.stop( )
                    .show( )
                    .css( "opacity", "0" )
                    .opacityTo( "1", 300 );

                if ( reguStreaming.debugMode )
                    console.log( "[ReguStreaming] Video media load start ..." );
            }
        } );

        controls.videoContainer.on( "canplay", function( )
        {
            if ( controls.videoBuffering.is( ":visible" ) )
                controls.videoBuffering.hide( )

            if ( reguStreaming.audioObj )
            {
                // Chrome Policy
                if ( Math.abs( reguStreaming.audioObj.currentTime - controls.videoContainer.get( 0 )
                        .currentTime ) > 0.1 )
                {
                    reguStreaming.audioObj.currentTime = controls.videoContainer.get( 0 )
                        .currentTime;

                    if ( reguStreaming.debugMode )
                        console.log( "[ReguStreaming] Video media and AudioObject resynchronized." );
                }
            }

            if ( reguStreaming.debugMode )
                console.log( "[ReguStreaming] Video media now available to play ..." );
        } );

        controls.videoContainer.on( "waiting", function( )
        {
            if ( !controls.videoBuffering.is( ":visible" ) )
                controls.videoBuffering.show( );

            if ( reguStreaming.debugMode )
                console.log( "[ReguStreaming] Video media waiting for data ..." );
        } );

        controls.videoContainer.on( "pause", function( )
        {
            if ( document.visibilityState == "hidden" )
            {
                reguStreaming.isHidden = true;
            }

            if ( document.visibilityState !== "hidden" && reguStreaming.audioObj )
                reguStreaming.audioObj.pause( );

            if ( reguStreaming.debugMode )
                console.log( "[ReguStreaming] Video media paused." );
        } );

        // https://stackoverflow.com/questions/5573461/html5-video-error-handling
        controls.videoContainer.on( "error", function( e )
        {
            e = e.originalEvent;

            var error;

            // Chrome v60
            if ( e.path && e.path[ 0 ] )
                error = e.path[ 0 ].error;

            // Firefox v55
            if ( e.originalTarget )
                error = error.originalTarget.error;
            // if ( state === 3 ) // NETWORK_NO_SOURCE
            // {
            //     if ( controls.videoBuffering.is( ":visible" ) )
            //         controls.videoBuffering.stop( )
            //         .opacityTo( "0", 300, function( )
            //         {
            //             controls.videoBuffering.hide( );
            //         } );
            // }

            if ( error.message )
            {
                util.notification( util.notificationType.danger, "미디어 재생 오류", "죄송합니다, 미디어 재생 중 오류가 발생했습니다.<br />" + error.message, 0, true );

                if ( reguStreaming.debugMode )
                    console.log( "%c[ReguStreaming] Video media failed to play because " + error.message, "color: red;" );
            }
            else
            {
                util.notification( util.notificationType.danger, "미디어 재생 오류", "죄송합니다, 미디어 재생 중 알 수 없는 오류가 발생했습니다.", 0, true );

                if ( reguStreaming.debugMode )
                    console.log( "%c[ReguStreaming] Video media failed to play because Unknown error", "color: red;" );
            }


        } );

        controls.videoContainer.on( "play", function( )
        {
            if ( reguStreaming.audioObj )
            {
                if ( reguStreaming.isHidden )
                {
                    controls.videoContainer.get( 0 )
                        .currentTime = reguStreaming.audioObj.currentTime;

                    reguStreaming.isHidden = false;
                }

                if ( reguStreaming.playerMode === reguStreaming.playerType.both )
                {
                    controls.videoContainer.prop( "muted", true );

                    if ( reguStreaming.audioObj.paused )
                    {
                        var playPromise = reguStreaming.audioObj.play( );

                        // Autoplay Policy
                        playPromise.then( function( )
                            {
                                if ( reguStreaming.debugMode )
                                    console.log( "[ReguStreaming] AudioObject played." );

                                reguStreaming.audioObj.muted = false;
                            } )
                            .catch( function( err )
                            {
                                if ( reguStreaming.debugMode )
                                    console.log( "%c[ReguStreaming] Failed to play AudioObject [%cㅡ,.ㅡ %cAutoplay Policy].", "color: orange;", "color: red; font-size: 15px; font-weight: bold;", "color: orange;" );

                                if ( !controls.videoAutoPlayAgree.is( ":visible" ) )
                                    controls.videoAutoPlayAgree.show( )
                                    .css( "opacity", "0" )
                                    .opacityTo( "1", 500 );
                            } );
                    }
                }
                else if ( reguStreaming.playerMode === reguStreaming.playerType.videoOnly )
                {
                    if ( reguStreaming.userInteracted )
                        controls.videoContainer.prop( "muted", false );
                    else
                    {
                        if ( !controls.videoAutoPlayAgree.is( ":visible" ) )
                            controls.videoAutoPlayAgree.show( );
                    }
                }
            }

            if ( reguStreaming.debugMode )
                console.log( "[ReguStreaming] Video media played." );
        } );

        controls.videoAutoPlayAgree.one( "click", function( )
        {
            var self = controls.videoAutoPlayAgree;

            self.opacityTo( "0", 300, function( )
            {
                self.hide( )
            } );

            if ( !reguStreaming.userInteracted )
                reguStreaming.userInteracted = true;

            // var audioContext = new AudioContext( );
            if ( reguStreaming.audioObj && reguStreaming.audioObj.paused )
            {
                reguStreaming.audioObj.play( );
                reguStreaming.audioObj.muted = false;
                reguStreaming.audioObj.currentTime = controls.videoContainer.get( 0 )
                    .currentTime;

                if ( reguStreaming.debugMode )
                    console.log( "[ReguStreaming] AudioObject played." );
            }

            // audioContext.resume( )
            //     .then( function( )
            //     {

            //         console.log( "playback resumed!" )
            //     } );

            controls.videoContainer.prop( "muted", false );
        } );


        controls.videoContainer.on( "timeupdate", function( )
        {
            var video = controls.videoContainer.get( 0 );

            if ( video.paused ) return;

            controls.videoPositionBarFull.css( "width", ( ( video.currentTime / video.duration ) * 100 ) + "%" );

            if ( controls.innerHeaderVideoPositionHelp.is( ":visible" ) )
            {
                var width = $( window )
                    .width( );

                controls.innerHeaderVideoPositionHelp.css( "left", ( ( video.currentTime / video.duration ) * width ) + "px" )
                    .text( Math.floor( video.currentTime )
                        .toSimpleSexyMMSS( ) );
            }
            /*
            if ( controls.queueVideoInformation.is( ":visible" ) )
            {
                var thisIndex = reguStreaming.queueInformationCurrentShowingIndex;
                var timeleft = 0;

                // 0 >= 1
                if ( thisIndex === 0 )
                    timeleft = video.duration - video.currentTime;
                else
                {
                    for ( var i = 0; i <= thisIndex; i++ )
                    {
                        var self = queueListClient[ i ];

                        timeleft += self.data( "queueData" )
                            .mediaDuration;
                    }

                    timeleft -= video.currentTime;
                }

                controls.queueVideoInformationTimeleft.text( "이 영상 재생까지 " + Math.floor( timeleft )
                    .toSexyMMSS( ) + " 남았습니다." );
            }*/
        } );

        $( document )
            .bind( "contextmenu", function( e )
            {
                if ( e.target )
                {
                    var left = e.clientX;
                    var top = e.clientY;

                    switch ( e.target.tagName.toLowerCase( ) )
                    {
                        case "img":
                            e.preventDefault( );

                            break;
                        case "input":
                            return;
                    }

                    // console.log( e.target );

                    switch ( e.target.className )
                    {
                        case "canvas":
                            e.preventDefault( );
                            break;
                        case "queueItem":
                        case "queueItemThumbnail":
                            var obj = null;

                            if ( e.target.className === "queueItemThumbnail" )
                                obj = $( e.target )
                                .parent( ".queueItem" );
                            else
                                obj = $( e.target );

                            var localData = obj.data( "queueData" );

                            if ( localData.user && localData.user.userID === reguStreaming.getConfig( "localUserInfo",
                                {
                                    userID: "NULL"
                                } )
                                .userID )
                            {
                                util.showModal( "경고", "'" + localData.mediaName + "' 영상을 대기열에서 제거하시겠습니까?", "취소", "확인", null, function( )
                                {
                                    socket.emit( "RS.queueRemoveRequest",
                                    {
                                        id: localData.id
                                    } );
                                } );
                            }

                            e.preventDefault( );
                            break;
                        case "chatProfileName":
                        case "chatProfileAvatar":
                            reguStreaming.setConfig( "lastClickedChatMessage", e.target );

                            if ( !controls.userRightMenu.is( ":visible" ) )
                                controls.userRightMenu.show( );

                            var menuWidth = parseInt( controls.userRightMenu.css( "width" ), 10 );
                            var menuHeight = parseInt( controls.userRightMenu.css( "height" ), 10 );

                            if ( left + menuWidth >= window.innerWidth )
                                controls.userRightMenu.css( "left", ( window.innerWidth - menuWidth ) + "px" );
                            else
                                controls.userRightMenu.css( "left", left + "px" );

                            if ( top + menuHeight >= window.innerHeight )
                                controls.userRightMenu.css( "top", ( window.innerHeight - menuHeight ) + "px" );
                            else
                                controls.userRightMenu.css( "top", top + "px" );

                            e.preventDefault( );

                            break;
                    }

                    e.preventDefault( );
                }
            } )
            .bind( "click", function( e )
            {
                if ( controls.userRightMenu.is( ":visible" ) )
                {
                    controls.userRightMenu.hide( );

                    if ( e.target )
                    {
                        switch ( $( e.target )
                            .attr( "id" ) )
                        {
                            case "userRightMenu-userInfo":
                                if ( reguStreaming.getConfig( "lastClickedChatMessage" ) )
                                    reguStreaming.userInfoContainerStatus( true, reguStreaming.getConfig( "lastClickedChatMessage" )
                                        .parentElement );
                                break;
                            case "userRightMenu-kick":
                                if ( !reguStreaming.getConfig( "lastClickedChatMessage" ) ) break;

                                socket.emit( "RS.admin.kickRequest",
                                {
                                    userID: $( reguStreaming.getConfig( "lastClickedChatMessage" )
                                            .parentElement )
                                        .data( "userID" )
                                } );
                                break;
                            case "userRightMenu-ban":
                                if ( !reguStreaming.getConfig( "lastClickedChatMessage" ) ) break;

                                socket.emit( "RS.admin.banRequest",
                                {
                                    userID: $( reguStreaming.getConfig( "lastClickedChatMessage" )
                                            .parentElement )
                                        .data( "userID" )
                                } );
                                break;
                        }

                        reguStreaming.setConfig( "lastClickedChatMessage", null );
                    }
                }
            } );

        controls.fileUploadForm.on( "submit", function( e )
        {
            var self = $( this );
            var formData = new FormData( this );

            e.preventDefault( );

            $.ajax(
            {
                url: self.attr( "action" ),
                type: self.attr( "method" ),
                processData: false,
                contentType: false,
                cache: false,
                data: formData,
                success: function( data )
                {
                    if ( reguStreaming.debugMode )
                        console.log( "%c[ReguStreaming] File upload successful. (result: " + data + ")", "color: green;" );
                },
                error: function( err )
                {
                    if ( reguStreaming.debugMode )
                        console.log( "%c[ReguStreaming] File upload failed to upload because (" + err.statusText + ": " + err.responseText + ")", "color: red;" );

                    util.notification( util.notificationType.danger, "파일 업로드 오류", "죄송합니다, 파일 업로드 처리 중 서버에서 오류를 반환했습니다.<br />(" + err.statusText + ": " + err.responseText + ")", 0, true );
                }
            } );
        } );

        controls.fileInput.on( "change", function( )
        {
            var fileList = $( this )
                .prop( "files" );

            if ( !fileList.length || fileList[ 0 ] == null ) return;

            // reguStreaming.setConfig( "isFileUploading", true );
            // controls.chatBoxImageUploadButton.attr( "src", "/images/spinner.gif" );

            reguStreaming.canUpload( fileList[ 0 ], function( isAllow, reason )
            {
                var reader = new FileReader( );
                reader.onload = function( e )
                {
                    var hash = sha1( e.target.result );

                    socket.emit( "RS.fileExistCheck", hash, function( result )
                    {
                        switch ( result.code )
                        {
                            case 0:
                                if ( !result.exists )
                                    controls.fileUploadForm.submit( );

                                controls.fileInput.val( "" );
                                break;
                            case 1:
                                util.notification( util.notificationType.danger, "파일 업로드 오류", "파일 업로드에 실패했습니다, 데이터베이스 오류가 발생했습니다." );
                                controls.fileInput.val( "" );
                                break;
                            case 2:
                                util.notification( util.notificationType.warning, "파일 업로드 오류", "파일 업로드에 실패했습니다, 현재 서버 설정에 의해 업로드가 불가능합니다." );
                                controls.fileInput.val( "" );
                        }
                    } );
                };
                reader.onerror = function( e )
                {
                    controls.fileInput.val( "" );
                }
                reader.onabort = function( e )
                {
                    controls.fileInput.val( "" );
                }

                reader.readAsArrayBuffer( fileList[ 0 ] );
            } );
        } );

        $( "#queueRegisterURLTextField" )
            .on( "keydown", function( event )
            {
                if ( event.keyCode == 13 ) // Enter
                {
                    $( "#queueRegisterRunButton" )
                        .trigger( "click" );

                    return false;
                }
            } );

        $( "#chatTextField" )
            .on( "keydown", function( event )
            {
                if ( event.keyCode == 13 ) // Enter
                {
                    var chatMessage = $( this )
                        .val( )
                        .trim( );

                    if ( chatMessage.length == 0 ) return;

                    $( this )
                        .val( "" );

                    if ( chatMessage.length <= 0 || chatMessage.length > 200 )
                        return util.notification( util.notificationType.warning, "채팅 불가", "채팅 메세지는 1자 이상 200자 이하 되어야 합니다.", 2000 );

                    reguStreaming.checkXSS( chatMessage, function( xssDetected )
                    {
                        if ( xssDetected )
                            return util.notification( util.notificationType.warning, "채팅 불가", "채팅 메세지에 입력할 수 없는 문장입니다.", 2000 );

                        if ( reguStreaming.executeChatCommand( chatMessage ) )
                            return false;

                        if ( reguStreaming.chatMessageInputHistory.length > 5 )
                            reguStreaming.chatMessageInputHistory.slice( 0, 1 );

                        reguStreaming.chatMessageInputHistory.push( chatMessage );

                        reguStreaming.currentChatMessageInputHistoryIndex = reguStreaming.chatMessageInputHistory.length - 1;

                        socket.emit( "RS.chat", chatMessage, reguStreaming.onPostChatHandler );

                        return false;
                    } );
                }
                else if ( event.keyCode == 38 ) // 위 방향
                {
                    if ( reguStreaming.chatMessageInputHistory.length > 0 && reguStreaming.chatMessageInputHistory[ reguStreaming.currentChatMessageInputHistoryIndex ] )
                    {
                        var messageHistory = reguStreaming.chatMessageInputHistory[ reguStreaming.currentChatMessageInputHistoryIndex ]

                        $( this )
                            .val( messageHistory )
                            .putCursorAtEnd( );

                        reguStreaming.currentChatMessageInputHistoryIndex = Math.clamp( reguStreaming.currentChatMessageInputHistoryIndex - 1, 0, reguStreaming.chatMessageInputHistory.length - 1 );
                    }
                }
                else if ( event.keyCode == 40 ) // 아래 방향
                {
                    if ( reguStreaming.chatMessageInputHistory[ reguStreaming.currentChatMessageInputHistoryIndex ] )
                    {
                        var messageHistory = reguStreaming.chatMessageInputHistory[ reguStreaming.currentChatMessageInputHistoryIndex ]

                        $( this )
                            .val( messageHistory )
                            .putCursorAtEnd( );

                        reguStreaming.currentChatMessageInputHistoryIndex = Math.clamp( reguStreaming.currentChatMessageInputHistoryIndex + 1, 0, reguStreaming.chatMessageInputHistory.length - 1 );
                    }
                }
            } );

        /*
            .on( "dragenter", function( e ) {

            } )
            .on( "dragover", function( e )
            {
                if ( !controls.chatInputContainerDragHint.is( ":visible" ) )
                {
                    controls.chatInputContainerDragHint.show( )
                        .stop( )
                        .css( "opacity", "0" )
                        .animate(
                        {
                            opacity: "1"
                        }, 500 );
                }

                e.stopPropagation( );
                e.preventDefault( );
                e.originalEvent.dataTransfer.dropEffect = "copy";
            } )
            .on( "dragleave", function( e )
            {
                if ( controls.chatInputContainerDragHint.is( ":visible" ) )
                {
                    controls.chatInputContainerDragHint.stop( )
                        .css( "opacity", "1" )
                        .animate(
                        {
                            opacity: "0"
                        }, 500, function( )
                        {
                            controls.chatInputContainerDragHint.hide( );
                        } );
                }

                e.stopPropagation( );
                e.preventDefault( );
            } )
            .on( "drop", function( e )
            {
                if ( controls.chatInputContainerDragHint.is( ":visible" ) )
                {
                    controls.chatInputContainerDragHint.stop( )
                        .css( "opacity", "1" )
                        .animate(
                        {
                            opacity: "0"
                        }, 500, function( )
                        {
                            controls.chatInputContainerDragHint.hide( );
                        } );
                }

                var dataTransfer = e.originalEvent.dataTransfer;
                var fileList = dataTransfer.files;

                if ( fileList.length > 0 )
                {
                    // reguStreaming.setConfig( "isFileUploading", true );
                    // controls.chatBoxImageUploadButton.attr( "src", "/images/spinner.gif" );
                    controls.fileInput.val( fileList );

                    reguStreaming.canUpload( fileList[ 0 ], function( isAllow, reason )
                    {
                        var reader = new FileReader( );
                        reader.onload = function( e )
                        {
                            var hash = sha1( e.target.result );

                            socket.emit( "RS.fileExistCheck",
                            {
                                hash: hash
                            }, function( result )
                            {
                                switch ( result.code )
                                {
                                    case 0:
                                        if ( !result.exists )
                                            controls.fileUploadForm.submit( );

                                        controls.fileInput.val( "" );
                                        break;
                                    case 1:
                                        util.notification( util.notificationType.danger, "파일 업로드 오류", "파일 업로드에 실패했습니다, 데이터베이스 오류가 발생했습니다." );
                                        break;
                                    case 2:
                                        util.notification( util.notificationType.danger, "파일 업로드 오류", "파일 업로드에 실패했습니다, 요청이 거부되었습니다." );
                                }
                            } );
                        };
                        reader.onerror = function( e )
                        {
                            controls.fileInput.val( "" );
                        }
                        reader.onabort = function( e )
                        {
                            controls.fileInput.val( "" );
                        }

                        reader.readAsArrayBuffer( fileList[ 0 ] );
                    } );
                }

                e.stopPropagation( );
                e.preventDefault( );
            } );
*/

        // window.addEventListener( "focus", function( e )
        // {
        //     console.log( "called" );
        //     console.log( reguStreaming.audio.paused, reguStreaming.audio.currentTime )
        //     if ( !reguStreaming.audio || reguStreaming.audio.paused || reguStreaming.playerMode !== reguStreaming.playerModeType.both )
        //     {
        //         console.log( "ret" );
        //         return;
        //     }


        //     // reguStreaming.audio.play( );

        //     console.log( "test" );

        //     console.log( e );


        //     controls.videoContainer.get( 0 )
        //         .currentTime = reguStreaming.audio.currentTime;

        //     e.preventDefault( );
        //     // controls.videoContainer.get( 0 )
        //     //     .currentTime = reguStreaming.audio.currentTime;
        // } );

        if ( util.isBrowser( util.browserType.ie ) || util.isBrowser( util.browserType.edge ) )
            util.notification( util.notificationType.warning, "호환성 알림 :", "이 사이트는 해당 브라우저에서 테스트되지 않았습니다<br />버그 발견 시 즉시 신고해주세요.", 0 );

        reguStreaming.canvas = document.getElementById( "canvas" );
        reguStreaming.canvas2D = reguStreaming.canvas.getContext( "2d" );

        reguStreaming.canvas.width = window.innerWidth;
        reguStreaming.canvas.height = window.innerHeight - 112;

        reguStreaming.canvasInitialize( );

        $( window )
            .resize( function( )
            {
                reguStreaming.canvasResize( );
            } );

        reguStreaming.documentLoaded = true;

        reguStreaming.registerTimer( );

        socket.emit( "RS.join" );
    } );

// socket.on( "RS.fileExistCheckReceive", function( data )
// {
//     if ( !data.exists && reguStreaming.fileUploadData != null )
//         siofu.submitFiles( reguStreaming.fileUploadData );
//     else
//         reguStreaming.fileUploadData = null;
// } );

socket.on( "RS.fileUploadReceive", function( data )
{
    // console.log( "success fileUpload" )
    // reguStreaming.setConfig( "isFileUploading", false );
    // controls.chatBoxImageUploadButton.attr( "src", "/images/icon/camera.png" );
} );

socket.on( "RS.fileUploadError", function( data )
{
    var reason;

    switch ( data )
    {
        case 0:
            reason = "파일을 업로드할 수 없습니다, gif, png, jpg 파일 확장자의 이미지만 업로드할 수 있습니다.";
            break;
        case 1:
            reason = "파일 처리 중 서버 오류가 발생했습니다, 나중에 다시 시도해주세요.";
            break;
        case 2:
            reason = "파일 처리 중 서버 오류가 발생했습니다, 나중에 다시 시도해주세요.";
            break;
        case 3:
            reason = "파일을 업로드할 수 없습니다, 2048x2048 크기를 초과하는 이미지는 업로드할 수 없습니다.";
            break;
        default:
            reason = "정의되지 않은 오류가 발생했습니다.";
    }

    util.notification( util.notificationType.warning, "파일 업로드 오류", reason, 4000 );
} );

reguStreaming.refreshBackground = function( )
{
    // controls.background.insertBefore( $( '<div class="backgroundBuffer"></div>' ) )
}

reguStreaming.executeChatCommand = function( message )
{
    message = message.toLowerCase( );

    return this.chatCommands.some( function( val )
    {
        if ( val.command.toLowerCase( ) === message )
        {
            val.func( );
            return true;
        }
    } );
}

reguStreaming.queueUserVote = function( type )
{
    socket.emit( "RS.mediaUserVote", type, function( data )
    {
        if ( !data || data.code !== 0 )
            util.notification( util.notificationType.warning, "투표 불가", "정의되지 않은 오류가 발생했습니다.", 2500 );
    } );
}

socket.on( "RS.joinResult", function( data )
{
    reguStreaming.setConfig( "lastLoginSuccess", true );
    reguStreaming.setConfig( "localUserInfo",
    {
        name: data.name,
        userID: data.userID,
        rank: data.rank,
        avatar: data.avatar
    } );
    reguStreaming.setConfig( "localUserID", data.userID );
    reguStreaming.setConfig( "roomTitle", data.roomTitle );

    if ( data.rank !== "admin" )
    {
        $( "#userRightMenu-kick" )
            .hide( );
        $( "#userRightMenu-ban" )
            .hide( );
    }
    else
    {
        $( "#userRightMenu-kick" )
            .on( "click", function( ) {

            } );

        $( "#userRightMenu-ban" )
            .on( "click", function( ) {

            } );
    }
    // reguStreaming.onLoginSuccess( true );

    var roomID = reguStreaming.getConfig( "roomID", null );

    if ( roomID )
    {
        controls.videoContainer.attr( "src", "/media/" + roomID );
    }

    controls.innerHeaderRoomTitle.text( data.roomTitle + " 채널" || "알 수 없음 채널" );

    socket.emit( "RS.mediaRequest" );

    if ( !controls.chatContainer.is( ":visible" ) )
        controls.chatContainer.css( "opacity", "0" )
        .show( )
        .stop( )
        .animate(
        {
            opacity: "1"
        }, 1000 );

    if ( !controls.queueVideoListContainer.is( ":visible" ) )
        controls.queueVideoListContainer.css( "opacity", "0" )
        .show( )
        .stop( )
        .animate(
        {
            opacity: "1"
        }, 1000 );

    if ( Notification.permission !== Notification.permission.granted )
        Notification.requestPermission( );

    $( window )
        .on( "beforeunload", function( e )
        {
            localStorage.setItem( "RS.chatInputHistory", controls.chatTextField.val( ) );

            if ( reguStreaming.queueRegisterDelay )
                this.localStorage.setItem( "RS.queueRegisterDelay", reguStreaming.queueRegisterDelay.toString( ) );


            socket.disconnect( );

            // e = e || window.event;

            // if ( e )
            //     e.returnValue = "레그 스트리밍에서 접속을 종료하시겠습니까?";

            // return "레그 스트리밍에서 접속을 종료하시겠습니까?";
        } );

    setTimeout( function( )
    {
        if ( reguStreaming.getActiveProcessBackground( ) )
            reguStreaming.setActiveProcessBackground( false );
    }, 0 ); // 1000
} );

socket.on( "RS.queueRegisterReceive", function( data )
{
    if ( data.code === 0 ) // 영상 추가 성공
    {
        util.notification( util.notificationType.success, "영상 추가 완료", "귀하가 요청한 영상이 대기열에 추가되었습니다.", 3500 );

        reguStreaming.queueContainerStatus( false );
        reguStreaming.registerQueueDelay( );
    }
    else
    {
        var reason;

        switch ( data.code )
        {
            case 1:
                reason = "영상 추가를 할 수 없습니다, 마지막 영상을 추가한 시간으로부터 1분이 경과해야 합니다.";
                break;
            case 2:
                reason = "영상 추가를 할 수 없습니다, 이 채널에서는 추가할 수 없습니다.";
                break;
            case 3:
                if ( data.validFormat )
                    reason = "영상 추가를 할 수 없습니다, 주소의 형식이 올바르지 않습니다, 다음과 같이 입력하세요. (ex: " + data.validFormat + ")";
                else
                    reason = "영상 추가를 할 수 없습니다, 올바르지 않은 주소를 입력했습니다.";
                break;
            case 4:
                reason = "영상 추가를 할 수 없습니다, 영상 시작 시간이 올바르지 않습니다.";
                break;
            case 5:
                reason = "영상 추가 중 서버 오류가 발생했습니다, 나중에 다시 시도해주세요.";
                break;
            case 6:
                reason = "영상 추가를 할 수 없습니다, Youtube 실시간 스트리밍 영상은 추가할 수 없습니다.";
                break;
            case 7:
                reason = "영상 추가를 할 수 없습니다, 올바르지 않은 영상입니다.";
                break;
            case 8:
                reason = "영상 추가를 할 수 없습니다, 영상 시작 시간이 영상의 총 길이보다 더 이후입니다.";
                break;
            case 9:
                reason = "영상 추가를 할 수 없습니다, 영상 시작 시간과 영상의 총 길이의 간격이 너무 짧습니다.";
                break;
            case 10:
                reason = "영상 추가를 할 수 없습니다, 이 영상의 정보를 불러올 수 없거나 존재하지 않습니다.";
                break;
            case 11:
                reason = "영상 추가를 할 수 없습니다, 알 수 없는 오류가 발생했습니다.";
                break;
            case 12:
                reason = "해당 영상을 대기열에서 지울 수 없습니다, 현재 재생 중인 영상이 끝나기 10초전에 제거할 수 있습니다.";
                break;
            case 50:
                reason = "현재 영상 추가 서비스가 불가능합니다, 공지사항을 확인하세요.";
                break;
            default:
                reason = "영상 추가를 할 수 없습니다, 알 수 없는 오류가 발생했습니다.";
        }

        util.notification( util.notificationType.warning, "영상 추가 오류", reason, 4000 );

        reguStreaming.setActiveProcessBackground( false );
    }
} );

reguStreaming.registerQueueDelay = function( overrideDelay )
{
    this.queueRegisterDelay = overrideDelay ? overrideDelay : Date.now( ) + ( 1000 * 0 ); // 60

    controls.chatContainerQueueRegisterButton.attr( "src", "images/icon/circle_32.png" )
        .attr( "title", "대기열에 영상을 추가하시려면 잠시 기다리세요." );

    controls.chatContainerQueueRegisterButtonDelayRemain.stop( )
        .css( "opacity", 0 )
        .show( )
        .opacityTo( "1", 1000 )
        .text( Math.floor( ( this.queueRegisterDelay - Date.now( ) ) / 1000 ) );

    if ( this.queueRegisterDelayIntervalObj )
        clearInterval( this.queueRegisterDelayIntervalObj );

    this.queueRegisterDelayIntervalObj = setInterval( function( )
    {
        if ( Date.now( ) < reguStreaming.queueRegisterDelay )
        {
            controls.chatContainerQueueRegisterButtonDelayRemain.text( Math.floor( ( reguStreaming.queueRegisterDelay - Date.now( ) ) / 1000 ) );
        }
        else
        {
            controls.chatContainerQueueRegisterButtonDelayRemain.stop( )
                .css( "opacity", 1 )
                .opacityTo( "0", 1000, function( )
                {
                    controls.chatContainerQueueRegisterButton.attr( "src", controls.chatContainerQueueRegisterButton.attr( "data-original" ) )
                        .attr( "title", "대기열에 영상 추가" );
                } );

            clearInterval( reguStreaming.queueRegisterDelayIntervalObj );
            reguStreaming.queueRegisterDelayIntervalObj = null;
            reguStreaming.queueRegisterDelay = null;
        }
    }, 500 );
}

reguStreaming.registerVoteDelay = function( ) {

}

reguStreaming.queueElementList = [ ];
reguStreaming.queueCount = 0;

reguStreaming.findQueueDataByID = function( id )
{
    var length = this.queueElementList.length;

    for ( var i = 0; i < length; i++ )
    {
        var element = this.queueElementList[ i ];

        if ( !!element && typeof element !== "undefined" && element.data( "queueID" ) === id ) // *NOTE: undefined 체크 필요 없음.
        {
            return {
                success: true,
                index: i,
                element: element,
                queueData: element.data( "queueData" )
            }
        }
    }

    return {
        success: false
    };
}

// 수정바람
const queueRegisterFormatBase = '<div class="queueItem" id="queueItem_{0}"> \
                <img class="queueItemThumbnail" src="{1}" /> \
                <div class="queueItemByMe"></div> \
			</div>'
reguStreaming.onRegisterQueue = function( data )
{
    var newQueueElement;

    if ( typeof data.forceIndex === "undefined" )
    {
        newQueueElement = $( String.format(
                queueRegisterFormatBase,
                this.queueCount,
                data.mediaThumbnail
            ) )
            .appendTo( controls.queueVideoListContainer );
    }
    else
    {
        newQueueElement = $( String.format(
                queueRegisterFormatBase,
                this.queueCount,
                data.mediaThumbnail
            ) )
            .insertBefore( this.queueElementList[ data.forceIndex ] );
    }

    newQueueElement.startAnimation( "flipInX 1s" )

    newQueueElement.data( "queueData", data );
    newQueueElement.data( "queueID", data.id );

    if ( !data.user || reguStreaming.getConfig( "localUserID", "NULL" ) !== data.user.userID )
    {
        newQueueElement.find( ".queueItemByMe" )
            .remove( );
    }

    newQueueElement.on( "mouseenter", data, function( e )
    {
        if ( reguStreaming.queueInformationUITimeout )
        {
            clearTimeout( reguStreaming.queueInformationUITimeout );
            reguStreaming.queueInformationUITimeout = null;
        }

        // event handler data 지정 방식으로 수정 가능함
        var localData = e.data;

        controls.queueVideoInformation.stopAnimation( );

        if ( !controls.queueVideoInformation.is( ":visible" ) )
        {
            controls.queueVideoInformation.show( )
                .startAnimation( "fadeInUp 0.1s" );
        }

        if ( !localData.user || reguStreaming.getConfig( "localUserID", "NULL" ) !== localData.user.userID )
            controls.queueVideoInformationRemoveHint.hide( );
        else
            controls.queueVideoInformationRemoveHint.show( );

        controls.queueVideoInformationDuration.text( Math.floor( localData.mediaDuration )
            .toSimpleSexyMMSS( ) );

        controls.queueVideoInformationName.text( localData.mediaName )
            .closest( "a" )
            .attr( "href", localData.mediaProviderURL );
        controls.queueVideoInformationBG.css( "background-image", "url( '" + localData.mediaThumbnail + "' )" );
        controls.queueVideoInformationThumbnail.css( "background-image", "url( '" + localData.mediaThumbnail + "' )" );

        controls.queueVideoInformationProfileImage.attr( "src", localData.user ? localData.user.avatar : "/images/icon/user_64.png" )
            .off( "click" )
            .on( "click", function( )
            {
                if ( localData.user )
                    reguStreaming.userInfoContainerStatus( true, localData.user.userID );
                else
                    util.notification( util.notificationType.warning, "사용자 정보 없음", "이 사용자 정보는 불러올 수 없습니다." );
            } );

        controls.queueVideoInformationProfileName.text( localData.user ? localData.user.name : "서버" )
            .off( "click" )
            .on( "click", function( )
            {
                if ( localData.user )
                    reguStreaming.userInfoContainerStatus( true, localData.user.userID );
                else
                    util.notification( util.notificationType.warning, "사용자 정보 없음", "이 사용자 정보는 불러올 수 없습니다." );
            } );
    } );

    newQueueElement.on( "mouseleave", function( )
    {
        if ( reguStreaming.queueInformationUITimeout )
            clearTimeout( reguStreaming.queueInformationUITimeout );

        reguStreaming.queueInformationUITimeout = setTimeout( function( )
        {
            if ( controls.queueVideoInformation.is( ":visible" ) )
            {
                controls.queueVideoInformation.stopAnimation( );

                controls.queueVideoInformation.startAnimation( "fadeOutDown 0.1s", function( self )
                {
                    self.hide( );
                } );
            }

            reguStreaming.queueInformationUITimeout = null;
        }, 1000 );
    } );

    if ( typeof data.forceIndex === "undefined" && Number.isInteger( data.forceIndex ) )
        this.queueElementList.push( newQueueElement );
    else
        this.queueElementList.insert( data.forceIndex, newQueueElement );


    // *TODO: queueCount 관리 필요함
    this.queueCount = Math.clamp( this.queueCount + 1, 0, 9000 );
}

reguStreaming.onRemoveQueue = function( data )
{
    var
    {
        success,
        index,
        element,
        queueData
    } = this.findQueueDataByID( data.id );

    if ( success )
    {

        var length = this.queueElementList.length;

        for ( var i = index + 1; i < length; i++ )
        {
            this.queueElementList[ i ].startAnimation( "flipOutX 1s", function( self )
            {
                self.startAnimation( "zoomInRight 1s" );
            } );
        }

        this.queueElementList.splice( index, 1 );

        element.startAnimation( data.isRemoveRecent ? "zoomOutUp 1s" : "zoomOut 1s", function( self )
        {
            self.remove( );
        } );
    }
    else
    {
        if ( this.debugMode )
            console.log( "%c[ReguStreaming] Failed to process onRemoveQueue function, data is not valid! -> " + data, "color: red;" );
    }

    /*
    if ( data.isRemoveRecent )
    {

        util.startCSSAnimation( "flipOutX 1s", e );
        e.css( "opacity", "1" )
            .animate(
            {
                opacity: "0"
            }, 1000, function( )
            {
                util.startCSSAnimation( "zoomInRight 1s", $( this ) );
                $( this )
                    .css( "opacity", "0" );
                $( this )
                    .animate(
                    {
                        opacity: "1"
                    }, 1000 );
            } );
    }
    else
    {
        var
        {
            index,
            element,
            queueData
        } = reguStreaming.findQueueDataByID( data.id );

        var length = this.queueElementList.length;

        for ( var i = index + 1; i < length; i++ )
        {
            this.queueElementList[ i ].startAnimation( "flipOutX 1s", function( self )
            {
                self.startAnimation( "zoomInRight 1s" );
            } );
        }

        this.queueElementList.splice( index, 1 );

        element.startAnimation( "zoomOut 1s", function( self )
        {
            self.remove( );
        } );
    }*/
}

reguStreaming.onClearQueue = function( data )
{
    this.queueElementList.forEach( function( v, index )
    {
        v.startAnimation( "flipOutX 1s", function( self )
        {
            self.remove( );
        } );
    } );

    this.queueElementList = [ ];
    this.queueCount = 0;
}

reguStreaming.onDataInitializeQueue = function( data )
{
    this.queueElementList = [ ];
    this.queueCount = 0;
    controls.queueVideoListContainer.empty( );

    var queueList = data.queueList;
    var length = queueList.length;

    if ( length > 0 )
    {
        var fragment = $( document.createDocumentFragment( ) );

        for ( var i = 0; i < length; i++ )
        {
            // *NOTE: 변수 선언 말고 기존 data 변수 재정의 할 시 문제가 발생하는가? (data = queueList[i] 시 queueList 변수가 이상하게 정의될 수 있음?)
            var thisLoopData = queueList[ i ];

            var newQueueElement = $( String.format(
                    queueRegisterFormatBase,
                    this.queueCount,
                    thisLoopData.mediaThumbnail
                ) )
                .appendTo( controls.queueVideoListContainer );

            newQueueElement.startAnimation( "flipInX 1s" )

            newQueueElement.data( "queueData", thisLoopData );
            newQueueElement.data( "queueID", thisLoopData.id );

            if ( !thisLoopData.user || reguStreaming.getConfig( "localUserID", "NULL" ) !== thisLoopData.user.userID )
            {
                newQueueElement.find( ".queueItemByMe" )
                    .remove( );
            }

            newQueueElement.on( "mouseenter", thisLoopData, function( e )
            {
                if ( reguStreaming.queueInformationUITimeout )
                {
                    clearTimeout( reguStreaming.queueInformationUITimeout );
                    reguStreaming.queueInformationUITimeout = null;
                }

                // event handler data 지정 방식으로 수정 가능함
                var localData = e.data;

                controls.queueVideoInformation.stopAnimation( );

                if ( !controls.queueVideoInformation.is( ":visible" ) )
                {
                    controls.queueVideoInformation.show( )
                        .startAnimation( "fadeInUp 0.1s" );
                }

                if ( !localData.user || reguStreaming.getConfig( "localUserID", "NULL" ) !== localData.user.userID )
                    controls.queueVideoInformationRemoveHint.hide( );
                else
                    controls.queueVideoInformationRemoveHint.show( );

                controls.queueVideoInformationDuration.text( Math.floor( localData.mediaDuration )
                    .toSimpleSexyMMSS( ) );

                controls.queueVideoInformationName.text( localData.mediaName )
                    .closest( "a" )
                    .attr( "href", localData.mediaProviderURL );
                controls.queueVideoInformationBG.css( "background-image", "url( '" + localData.mediaThumbnail + "' )" );
                controls.queueVideoInformationThumbnail.css( "background-image", "url( '" + localData.mediaThumbnail + "' )" );

                controls.queueVideoInformationProfileImage.attr( "src", localData.user ? localData.user.avatar : "/images/icon/user_64.png" )
                    .off( "click" )
                    .on( "click", function( )
                    {
                        if ( localData.user )
                            reguStreaming.userInfoContainerStatus( true, localData.user.userID );
                        else
                            util.notification( util.notificationType.warning, "사용자 정보 없음", "이 사용자 정보는 불러올 수 없습니다." );
                    } );

                controls.queueVideoInformationProfileName.text( localData.user ? localData.user.name : "서버" )
                    .off( "click" )
                    .on( "click", function( )
                    {
                        if ( localData.user )
                            reguStreaming.userInfoContainerStatus( true, localData.user.userID );
                        else
                            util.notification( util.notificationType.warning, "사용자 정보 없음", "이 사용자 정보는 불러올 수 없습니다." );
                    } );
            } );

            newQueueElement.on( "mouseleave", function( )
            {
                if ( reguStreaming.queueInformationUITimeout )
                    clearTimeout( reguStreaming.queueInformationUITimeout );

                reguStreaming.queueInformationUITimeout = setTimeout( function( )
                {
                    if ( controls.queueVideoInformation.is( ":visible" ) )
                    {
                        controls.queueVideoInformation.stopAnimation( );

                        controls.queueVideoInformation.startAnimation( "fadeOutDown 0.1s", function( self )
                        {
                            self.hide( );
                        } );
                    }

                    reguStreaming.queueInformationUITimeout = null;
                }, 1000 );
            } );

            this.queueElementList.push( newQueueElement );

            // *TODO: queueCount 관리 필요함
            this.queueCount = Math.clamp( this.queueCount + 1, 0, 9000 );
        }

        fragment.appendTo( controls.queueVideoListContainer );
    }
}

// 여기 최적화 필요함.,.
// id 시스템 관리 넣기
//https://www.zerocho.com/category/jQuery/post/57c3a8821efc521700a70918
socket.on( "RS.queueEvent", function( data )
{
    console.log( "[ReguStreaming] Queue event [" + data.type + "] received." );

    if ( data.type == "register" )
    {
        reguStreaming.onRegisterQueue( data );
    }
    else if ( data.type == "remove" )
    {
        reguStreaming.onRemoveQueue( data );
    }
    else if ( data.type == "clear" )
    {
        reguStreaming.onClearQueue( data );
    }
    // else if ( data.type == "userVoteRefresh" )
    // {
    //     var voteList = data.voteList;

    //     console.log( voteList );
    // }
    else if ( data.type == "dataInitialize" )
    {
        reguStreaming.onDataInitializeQueue( data );
    }
} );

let chatMessageCount = 0;

reguStreaming.onLoadedVideoChat = function( )
{
    controls.chatBoxInner
        .animate(
        {
            scrollTop: controls.chatBoxInner[ 0 ].scrollHeight
        }, 300, "swing" );
}

reguStreaming.onLoadedImageChat = function( )
{
    controls.chatBoxInner
        .animate(
        {
            scrollTop: controls.chatBoxInner[ 0 ].scrollHeight
        }, 300, "swing" );
}

reguStreaming.chatFormatBase = {
    def: '<div class="chatMessageContainer" id="chatMessageContainer_{0}"> \
            <div class="chatMessageContainer-profile nodraggable selectable"> \
                <img src="{1}" alt="Profile Image" class="chatMessageContainer-profile-avatar" /> \
                <div class="chatMessageContainer-profile-name">{2}</div> \
            </div> \
            <div class="chatMessageContainer-time nodraggable">{3}</div> \
            <div class="chatMessageContainer-message"></div> \
        </div>',
    sys: '<div class="chatMessageContainer" id="chatMessageContainer_{0}"> \
            <span class="chatMessageContainer-systemIcon"></span> \
            <div class="chatMessageContainer-time nodraggable">{1}</div> \
            <div class="chatMessageContainer-message" style="font-size: 12px;">{2}</div> \
        </div>',
    video: '<div class="chatMessageContainer" id="chatMessageContainer_{0}"> \
        <div class="chatMessageContainer-profile nodraggable selectable"> \
            <img src="{1}" alt="Profile Image" class="chatMessageContainer-profile-avatar" /> \
            <div class="chatMessageContainer-profile-name">{2}</div> \
        </div> \
        <div class="chatMessageContainer-time nodraggable">{3}</div> \
        <video class="chatMessageContainer-video selectable" controls style="" onclick="" onload="reguStreaming.onLoadedVideoChat( );"> \
            <source src="{4}" type="{5}" /> \
        </video> \
    </div>',
    image: '<div class="chatMessageContainer" id="chatMessageContainer_{0}"> \
            <div class="chatMessageContainer-profile nodraggable selectable"> \
                <img src="{1}" alt="Profile Image" class="chatMessageContainer-profile-avatar" /> \
                <div class="chatMessageContainer-profile-name">{2}</div> \
            </div> \
            <div class="chatMessageContainer-time nodraggable">{3}</div> \
            <div class="chatMessageContainer-adultOverlay"> \
                <img class="chatMessageContainer-image selectable" style="" onclick="reguStreaming.onClickChatImage( this );" onload="reguStreaming.onLoadedImageChat( );" src="{4}" /> \
            </div> \
            <div class="chatMessageContainer-adultText">수위 이미지로 감지되었습니다<br />클릭하면 열람합니다.</div> \
        </div>',
    raw: '<div class="chatMessageContainer" id="chatMessageContainer_{0}"> \
        <div class="chatMessageContainer-profile nodraggable selectable"> \
            <img src="{1}" alt="Profile Image" class="chatMessageContainer-profile-avatar" /> \
            <div class="chatMessageContainer-profile-name">{2}</div> \
        </div> \
        <div class="chatMessageContainer-time nodraggable">{3}</div> \
        <div class="chatMessageContainer-raw"> \
             <div class="chatMessageContainer-raw-fileInformation"> \
                <span class="glyphicon glyphicon-file chatMessageContainer-raw-fileInformation-icon"></span> \
                {4} \
                <div class="chatMessageContainer-raw-download"> \
                    <span class="glyphicon glyphicon-download-alt chatMessageContainer-raw-download-icon"></span> \
                    <a class="chatMessageContainer-raw-download-link" href="{5}" target="_blank">다운로드</a> \
                </div> \
             </div> \
        </div> \
        </div>'
}
reguStreaming.currentChatMessageCount = 0;
reguStreaming.linkRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig; // http://talkerscode.com/webtricks/convert-url-text-into-clickable-html-links-using-javascript.php

reguStreaming.registerSpinnerImageUpload = function( fileData ) {

}

reguStreaming.onPostChatHandler = function( data )
{
    if ( data.code !== 0 && typeof data.code !== "undefined" )
    {
        let reason;
        switch ( data.code )
        {
            case 1:
                reason = "채팅 메세지는 1자 이상 200자 이하 되어야 합니다.";
                break;
            case 2:
                reason = "채팅 메세지에 입력할 수 없는 문장이 있습니다.";
                break;
            case 3:
                reason = "손님 계정으로는 채팅을 입력하실 수 없습니다.";
                break;
            case 4:
                reason = "현재 서버 설정으로 인해 채팅을 하실 수 없습니다.";
                break;
            case 5:
                reason = "현재 채널 설정으로 인해 채팅을 하실 수 없습니다.";
                break;
            default:
                reason = "정의되지 않은 오류가 발생했습니다.";
        }

        util.notification( util.notificationType.warning, "채팅 불가", reason, 2500 );

        return;
    }

    var currentTime = new Date( );
    var currentTimeString = ( currentTime.getHours( ) < 12 ? "AM " : "PM " ) + ( currentTime.getHours( ) % 12 || 12 ) + ":" + ( currentTime.getMinutes( ) < 10 ? ( "0" + currentTime.getMinutes( ) ) : currentTime.getMinutes( ) );

    if ( data.type == "file" )
    {
        var localClientData = reguStreaming.getLocalClientDataByID( data.userID );

        if ( !localClientData )
        {
            console.log( "%c[ReguStreaming] Failed to parse Chat Image! Local client data is not valid! -> " + data.userID, "color: red;" );
            return;
        }

        var newObj;

        if ( data.fileType === 0 )
        {
            newObj = $( String.format(
                    reguStreaming.chatFormatBase.raw,
                    reguStreaming.currentChatMessageCount,
                    localClientData.avatar,
                    localClientData.name,
                    currentTimeString,
                    data.fileName,
                    "/files/" + data.fileID
                ) )
                .appendTo( controls.chatBoxInner );

            controls.chatBoxInner.stop( )
                .animate(
                {
                    scrollTop: controls.chatBoxInner[ 0 ].scrollHeight
                }, 300, "swing" );
        }
        else if ( data.fileType === 1 )
        {
            newObj = $( String.format(
                    reguStreaming.chatFormatBase.image,
                    reguStreaming.currentChatMessageCount,
                    localClientData.avatar,
                    localClientData.name,
                    currentTimeString,
                    "/files/" + data.fileID
                ) )
                .appendTo( controls.chatBoxInner );
        }
        else if ( data.fileType === 2 )
        {
            newObj = $( String.format(
                    reguStreaming.chatFormatBase.video,
                    reguStreaming.currentChatMessageCount,
                    localClientData.avatar,
                    localClientData.name,
                    currentTimeString,
                    "/files/" + data.fileID,
                    data.mimeType
                ) )
                .appendTo( controls.chatBoxInner );

            controls.chatBoxInner
                .animate(
                {
                    scrollTop: controls.chatBoxInner[ 0 ].scrollHeight
                }, 300, "swing" );
        }

        newObj.data( "userID", data.userID )
            .startAnimation( "slideInRight 0.3s" );

        newObj.find( ".chatMessageContainer-profile" )
            .on( "click", function( )
            {
                reguStreaming.userInfoContainerStatus( true, newObj.data( "userID" ) );
            } );

        if ( data.fileType === 1 )
        {
            if ( data.isAdult )
            {
                newObj.find( ".chatMessageContainer-adultOverlay" )
                    .css(
                    {
                        "filter": "blur( 5px )",
                        "-webkit-filter": "blur( 5px )"
                    } );
            }
            else
                newObj.find( ".chatMessageContainer-adultText" )
                .remove( );
        }

        setTimeout( function( obj )
        {
            if ( obj )
                obj.animate(
                {
                    opacity: "0"
                }, 5000, function( )
                {
                    $( this )
                        .remove( );
                } );
        }, 1000 * 25, newObj );
    }
    else if ( data.type == "system" )
    {
        var newObj = $( String.format(
                reguStreaming.chatFormatBase.sys,
                reguStreaming.currentChatMessageCount,
                currentTimeString,
                data.message.replace( reguStreaming.linkRegex, "<a onclick='return reguStreaming.confirmChatLink( this );' target='_blank' href='$1'>$1</a>" )
            ) )
            .appendTo( controls.chatBoxInner );

        newObj.startAnimation( "slideInRight 0.3s" );

        if ( data.icon )
            newObj.find( ".chatMessageContainer-systemIcon" )
            .addClass( data.icon );
        else
            newObj.find( ".chatMessageContainer-systemIcon" )
            .remove( );

        controls.chatBoxInner.stop( )
            .animate(
            {
                scrollTop: controls.chatBoxInner[ 0 ].scrollHeight
            }, 300, "swing" );

        setTimeout( function( obj )
        {
            if ( obj )
                obj.animate(
                {
                    opacity: "0"
                }, 5000, function( )
                {
                    $( this )
                        .remove( );
                } );
        }, 1000 * 25, newObj );
    }
    else if ( data.type == "discord" )
    {
        var newObj = $( String.format(
                reguStreaming.chatFormatBase.def,
                reguStreaming.currentChatMessageCount,
                data.avatar,
                data.name,
                currentTimeString
            ) )
            .appendTo( controls.chatBoxInner );

        newObj.data( "userID", "discord" )
            .startAnimation( "slideInRight 0.3s" );

        newObj.find( ".chatMessageContainer-profile-name" )
            .css( "color", "#4845ff" );

        newObj.find( ".chatMessageContainer-profile" )
            .on( "click", function( )
            {
                reguStreaming.userInfoContainerStatus( true, "discord" );
            } );

        newObj.find( ".chatMessageContainer-message" )
            .html( data.message.replace( reguStreaming.linkRegex, "<a onclick='return reguStreaming.confirmChatLink( this );' target='_blank' href='$1'>$1</a>" ) );

        controls.chatBoxInner.stop( )
            .animate(
            {
                scrollTop: controls.chatBoxInner[ 0 ].scrollHeight
            }, 300, "swing" );

        setTimeout( function( obj )
        {
            if ( obj )
                obj.animate(
                {
                    opacity: "0"
                }, 5000, function( )
                {
                    $( this )
                        .remove( );
                } );
        }, 1000 * 20, newObj );
    }
    else if ( data.type == "text" )
    {
        var localClientData = reguStreaming.getLocalClientDataByID( data.userID );

        if ( !localClientData )
        {
            console.log( "%c[ReguStreaming] Failed to parse Chat message! Local client data is not valid! -> " + data.userID, "color: red;" );
            return;
        }

        var newObj = $( String.format(
                reguStreaming.chatFormatBase.def,
                reguStreaming.currentChatMessageCount,
                localClientData.avatar,
                localClientData.name,
                currentTimeString
            ) )
            .appendTo( controls.chatBoxInner );

        newObj.data( "userID", data.userID )
            .startAnimation( "slideInRight 0.3s" );

        newObj.find( ".chatMessageContainer-profile" )
            .on( "click", function( )
            {
                reguStreaming.userInfoContainerStatus( true, newObj.data( "userID" ) );
            } );

        newObj.find( ".chatMessageContainer-message" )
            .html( data.message.replace( reguStreaming.linkRegex, "<a onclick='return reguStreaming.confirmChatLink( this );' target='_blank' href='$1'>$1</a>" ) );

        controls.chatBoxInner.stop( )
            .animate(
            {
                scrollTop: controls.chatBoxInner[ 0 ].scrollHeight
            }, 300, "swing" );

        setTimeout( function( obj )
        {
            if ( obj )
                obj.animate(
                {
                    opacity: "0"
                }, 5000, function( )
                {
                    $( this )
                        .remove( );
                } );
        }, 1000 * 25, newObj );
    }

    reguStreaming.currentChatMessageCount++;
    reguStreaming.playChatSound( );
}

reguStreaming.confirmChatLink = function( self )
{
    self = $( self );

    util.showModal( "보안 경고", "'" + self.attr( "href" ) + "' 에 접속하시려고 합니다, 알 수 없는 사이트의 접속은 보안상의 위험이 있습니다.", "취소", "확인", null, function( )
    {
        window.open( self.attr( "href" ), self.attr( "target" ) );
    } );

    return false;
}

socket.on( "RS.modal", function( data )
{
    //title, body, closeText, confirmText, onClose, onConfirm, isSingleButton, bodyStyle
    util.showModal( data.title, data.body, data.closeText || "닫기", null, null, null, true );
} );

socket.on( "RS.chat", function( data )
{
    if ( data.code !== 0 && typeof data.code !== "undefined" )
    {
        let reason;
        switch ( data.code )
        {
            case 1:
                reason = "채팅 메세지는 1자 이상 200자 이하 되어야 합니다.";
                break;
            case 2:
                reason = "채팅 메세지에 입력할 수 없는 문장이 있습니다.";
                break;
            case 3:
                reason = "손님 계정으로는 채팅을 입력하실 수 없습니다.";
                break;
            case 4:
                reason = "현재 서버 설정으로 인해 채팅을 하실 수 없습니다.";
                break;
            case 5:
                reason = "현재 채널 설정으로 인해 채팅을 하실 수 없습니다.";
                break;
            default:
                reason = "정의되지 않은 오류가 발생했습니다.";
        }

        util.notification( util.notificationType.warning, "채팅 불가", reason, 2000 );

        return;
    }

    var currentTime = new Date( );
    var currentTimeString = ( currentTime.getHours( ) < 12 ? "AM " : "PM " ) + ( currentTime.getHours( ) % 12 || 12 ) + ":" + ( currentTime.getMinutes( ) < 10 ? ( "0" + currentTime.getMinutes( ) ) : currentTime.getMinutes( ) );

    if ( data.type == "file" )
    {
        var localClientData = reguStreaming.getLocalClientDataByID( data.userID );

        if ( !localClientData )
        {
            console.log( "%c[ReguStreaming] Failed to parse Chat Image! Local client data is not valid! -> " + data.userID, "color: red;" );
            return;
        }

        var newObj;

        if ( data.fileType === 0 )
        {
            newObj = $( String.format(
                    reguStreaming.chatFormatBase.raw,
                    reguStreaming.currentChatMessageCount,
                    localClientData.avatar,
                    localClientData.name,
                    currentTimeString,
                    data.fileName,
                    "/files/" + data.fileID
                ) )
                .appendTo( controls.chatBoxInner );

            controls.chatBoxInner.stop( )
                .animate(
                {
                    scrollTop: controls.chatBoxInner[ 0 ].scrollHeight
                }, 300, "swing" );
        }
        else if ( data.fileType === 1 )
        {
            newObj = $( String.format(
                    reguStreaming.chatFormatBase.image,
                    reguStreaming.currentChatMessageCount,
                    localClientData.avatar,
                    localClientData.name,
                    currentTimeString,
                    "/files/" + data.fileID
                ) )
                .appendTo( controls.chatBoxInner );
        }
        else if ( data.fileType === 2 )
        {
            newObj = $( String.format(
                    reguStreaming.chatFormatBase.video,
                    reguStreaming.currentChatMessageCount,
                    localClientData.avatar,
                    localClientData.name,
                    currentTimeString,
                    "/files/" + data.fileID,
                    data.mimeType
                ) )
                .appendTo( controls.chatBoxInner );

            controls.chatBoxInner
                .animate(
                {
                    scrollTop: controls.chatBoxInner[ 0 ].scrollHeight
                }, 300, "swing" );
        }

        newObj.data( "userID", data.userID )
            .startAnimation( "slideInRight 0.3s" );

        newObj.find( ".chatMessageContainer-profile" )
            .on( "click", function( )
            {
                reguStreaming.userInfoContainerStatus( true, newObj.data( "userID" ) );
            } );

        if ( data.fileType === 1 )
        {
            if ( data.isAdult )
            {
                newObj.find( ".chatMessageContainer-adultOverlay" )
                    .css(
                    {
                        "filter": "blur( 5px )",
                        "-webkit-filter": "blur( 5px )"
                    } );
            }
            else
                newObj.find( ".chatMessageContainer-adultText" )
                .remove( );
        }

        setTimeout( function( obj )
        {
            if ( obj )
                obj.animate(
                {
                    opacity: "0"
                }, 5000, function( )
                {
                    $( this )
                        .remove( );
                } );
        }, 1000 * 25, newObj );
    }
    else if ( data.type == "system" )
    {
        var newObj = $( String.format(
                reguStreaming.chatFormatBase.sys,
                reguStreaming.currentChatMessageCount,
                currentTimeString,
                data.message.replace( reguStreaming.linkRegex, "<a onclick='return reguStreaming.confirmChatLink( this );' target='_blank' href='$1'>$1</a>" )
            ) )
            .appendTo( controls.chatBoxInner );

        newObj.startAnimation( "slideInRight 0.3s" );

        if ( data.icon )
            newObj.find( ".chatMessageContainer-systemIcon" )
            .addClass( data.icon );
        else
            newObj.find( ".chatMessageContainer-systemIcon" )
            .remove( );

        controls.chatBoxInner.stop( )
            .animate(
            {
                scrollTop: controls.chatBoxInner[ 0 ].scrollHeight
            }, 300, "swing" );

        setTimeout( function( obj )
        {
            if ( obj )
                obj.animate(
                {
                    opacity: "0"
                }, 5000, function( )
                {
                    $( this )
                        .remove( );
                } );
        }, 1000 * 25, newObj );
    }
    else if ( data.type == "discord" )
    {
        var newObj = $( String.format(
                reguStreaming.chatFormatBase.def,
                reguStreaming.currentChatMessageCount,
                data.avatar,
                data.name,
                currentTimeString
            ) )
            .appendTo( controls.chatBoxInner );

        newObj.data( "userID", "discord" )
            .startAnimation( "slideInRight 0.3s" );

        newObj.find( ".chatMessageContainer-profile-name" )
            .css( "color", "#4845ff" );

        newObj.find( ".chatMessageContainer-profile" )
            .on( "click", function( )
            {
                reguStreaming.userInfoContainerStatus( true, "discord" );
            } );

        newObj.find( ".chatMessageContainer-message" )
            .html( data.message.replace( reguStreaming.linkRegex, "<a onclick='return reguStreaming.confirmChatLink( this );' target='_blank' href='$1'>$1</a>" ) );

        controls.chatBoxInner.stop( )
            .animate(
            {
                scrollTop: controls.chatBoxInner[ 0 ].scrollHeight
            }, 300, "swing" );

        setTimeout( function( obj )
        {
            if ( obj )
                obj.animate(
                {
                    opacity: "0"
                }, 5000, function( )
                {
                    $( this )
                        .remove( );
                } );
        }, 1000 * 20, newObj );
    }
    else if ( data.type == "text" )
    {
        var localClientData = reguStreaming.getLocalClientDataByID( data.userID );

        if ( !localClientData )
        {
            console.log( "%c[ReguStreaming] Failed to parse Chat message! Local client data is not valid! -> " + data.userID, "color: red;" );
            return;
        }

        var newObj = $( String.format(
                reguStreaming.chatFormatBase.def,
                reguStreaming.currentChatMessageCount,
                localClientData.avatar,
                localClientData.name,
                currentTimeString
            ) )
            .appendTo( controls.chatBoxInner );

        newObj.data( "userID", data.userID )
            .startAnimation( "slideInRight 0.3s" );

        newObj.find( ".chatMessageContainer-profile" )
            .on( "click", function( )
            {
                reguStreaming.userInfoContainerStatus( true, newObj.data( "userID" ) );
            } );

        newObj.find( ".chatMessageContainer-message" )
            .html( data.message.replace( reguStreaming.linkRegex, "<a onclick='return reguStreaming.confirmChatLink( this );' target='_blank' href='$1'>$1</a>" ) );

        controls.chatBoxInner.stop( )
            .animate(
            {
                scrollTop: controls.chatBoxInner[ 0 ].scrollHeight
            }, 300, "swing" );

        setTimeout( function( obj )
        {
            if ( obj )
                obj.animate(
                {
                    opacity: "0"
                }, 5000, function( )
                {
                    $( this )
                        .remove( );
                } );
        }, 1000 * 25, newObj );
    }

    reguStreaming.currentChatMessageCount++;
    reguStreaming.playChatSound( );
} );

/*
*NOTE: Deprecated!
socket.on( "regu.notification", function( data )
{
    util.notification( data.type || util.notificationType.info,
        data.title || "알림 :",
        data.message || "알 수 없음",
        data.time || 1000,
        data.allow_dismiss
    );
} );

socket.on( "serverNotification", function( data )
{
    util.notification( util.notificationType.info,
        data.title || "알림",
        data.message || "알 수 없음",
        0,
        true
    );
} );*/

reguStreaming.roomPlayerFormatBase = '<div class="innerHeader-roomPlayersContainer-item selectable"> \
    <img class="innerHeader-roomPlayersContainer-item-avatar" src="{0}" /> \
</div>';

reguStreaming.localClientData = {};
reguStreaming.roomPlayerItemList = [ ];

reguStreaming.getLocalClientDataByID = function( id )
{
    if ( id === reguStreaming.getConfig( "localUserID", "NULL" ) )
        return reguStreaming.getConfig( "localUserInfo", null );
    else
        return this.localClientData[ id ];
}

reguStreaming.onUpdateClientData = function( type, data )
{
    if ( type === "new" )
    {
        var newObj = $( String.format(
                this.roomPlayerFormatBase,
                data.avatar
            ) )
            .appendTo( controls.innerHeaderRoomPlayersContainer );

        newObj.data( "id", data.userID );
        newObj.on( "click", data, function( e )
        {
            var localData = e.data;

            reguStreaming.userInfoContainerStatus( true, localData.userID );
        } );

        this.roomPlayerItemList.push( newObj );
    }
    else if ( type === "remove" )
    {
        var length = this.roomPlayerItemList.length;

        for ( var i = 0; i < length; i++ )
        {
            if ( this.roomPlayerItemList[ i ] && this.roomPlayerItemList[ i ].data( "id" ) === data )
            {
                this.roomPlayerItemList[ i ].remove( );
                this.roomPlayerItemList.splice( i, 1 );
                break;
            }
        }
    }
    else if ( type === "initialize" )
    {
        controls.innerHeaderRoomPlayersContainer.empty( );
        this.roomPlayerItemList = [ ];

        var keys = Object.keys( data );
        var length = keys.length;

        for ( var i = 0; i < length; i++ )
        {
            var local = data[ keys[ i ] ];

            var newObj = $( String.format(
                    this.roomPlayerFormatBase,
                    local.avatar
                ) )
                .appendTo( controls.innerHeaderRoomPlayersContainer );

            newObj.data( "id", local.userID );
            newObj.on( "click", local, function( e )
            {
                var localData = e.data;

                reguStreaming.userInfoContainerStatus( true, localData.userID );
            } );

            this.roomPlayerItemList.push( newObj );
        }
    }

    controls.innerHeaderRoomPlayersCount.text( "접속자 " + ( Object.keys( this.localClientData )
        .length + 1 ) + "명" );
}

// *TODO: sort 추가바람.
socket.on( "RS.clientDataEvent", function( data )
{
    if ( data.type === "new" )
    {
        reguStreaming.localClientData[ data.targetClientData.userID ] = data.targetClientData;
        reguStreaming.onUpdateClientData( "new", data.targetClientData );
    }
    else if ( data.type === "remove" )
    {
        var index = data.id;

        if ( reguStreaming.localClientData[ index ] )
        {
            reguStreaming.localClientData[ index ] = null;
            delete reguStreaming.localClientData[ index ];
            reguStreaming.onUpdateClientData( "remove", index );
        }
        else
        {
            if ( reguStreaming.debugMode )
                console.log( "%c[ReguStreaming] ERROR: Client data remove failed. Unknown index " + index, "color: red;" );
        }
    }
    else if ( data.type === "initialize" )
    {
        reguStreaming.localClientData = data.allClientData;
        reguStreaming.onUpdateClientData( "initialize", data.allClientData );
    }
} );

socket.on( "disconnect", function( data )
{
    if ( reguStreaming.getConfig( "forceDisconnected", false ) ) return;

    if ( !reguStreaming.getActiveProcessBackground( ) )
    {
        if ( data === "io server disconnect" )
            reguStreaming.setActiveProcessBackground( true, null, "서버와의 연결이 끊겼습니다." );
        else if ( data === "transport close" )
            reguStreaming.setActiveProcessBackground( true, null, "서버와의 연결이 끊겼습니다, 다시 연결하고 있습니다 ..." );
    }

    console.log( "%c[ReguStreaming] ERROR: Connection to the server has been lost. (reason: " + data + ")", "color: red; font-size: 15px;" );
} );

socket.on( "RS.disconnect", function( data )
{
    socket.disconnect( );

    $( window )
        .off( "beforeunload" );
    localStorage.setItem( "regustreaming.forceDisconnectReason", "알 수 없는 오류" );
    document.location = "/?forceDisconnect";
} );

socket.on( "reconnecting", function( attemptNumber )
{
    if ( reguStreaming.getActiveProcessBackground( ) )
        reguStreaming.setActiveProcessBackground( true, null, "서버에 다시 연결하는 중 ... <p style='font-size: 12px;'>(" + attemptNumber + "번 시도함)</p>", true );

    console.log( "[ReguStreaming] Reconnecting to server ... [" + attemptNumber + "]" );
} );

socket.on( "reconnect_error", function( err )
{
    if ( reguStreaming.getActiveProcessBackground( ) )
        reguStreaming.setActiveProcessBackground( true, null, "서버에 일시적으로 연결할 수 없는 상태입니다. <p style='font-size: 12px; text-shadow: 0 0 16px red;'>(" + err + ")</p><br />잠시 후 다시 연결을 시도합니다.", true );

    console.log( "%c[ReguStreaming] ERROR: Failed to reconnecting to Server ... (err: " + err + ")", "color: red; font-size: 15px;" );
} );

socket.on( "reconnect", function( attemptNumber )
{
    if ( reguStreaming.getActiveProcessBackground( ) )
        reguStreaming.setActiveProcessBackground( false );

    if ( reguStreaming.getConfig( "lastLoginSuccess", false ) )
        socket.emit( "RS.join" );

    console.log( "[ReguStreaming] Reconnected!" );
} );

reguStreaming.providerType = {
    Null: -1,
    Youtube: 0,
    Ani24: 1,
    Tvple: 2,
    Direct: 3,
    KakaoTV: 4,
    Niconico: 5
};
reguStreaming.playerType = {
    both: 0,
    videoOnly: 1
}

reguStreaming.mediaProvider = reguStreaming.providerType.Null;
reguStreaming.playerMode = reguStreaming.playerType.both;

reguStreaming.getLocalStorageVolume = function( )
{
    return Number( localStorage.getItem( "RS.audioVolume" ) || "0.2" );
}

reguStreaming.setVolume = function( volume )
{
    controls.videoContainer.prop( "volume", volume / 100 );

    if ( reguStreaming.audioObj )
        reguStreaming.audioObj.volume = volume / 100;

    localStorage.setItem( "RS.audioVolume", volume / 100 );
}

// reguStreaming.fadeInVolume = function( )
// {
//     controls.videoContainer.prop( "muted", false );
//     reguStreaming.audio.muted = false;

//     var volume = 0;
//     var targetVolume = reguStreaming.getLocalStorageVolume( );

//     var volumeAnimator = setInterval( function( )
//     {
//         if ( volume >= targetVolume )
//         {
//             clearInterval( volumeAnimator );
//             return;
//         }
//         volume += 0.01;

//         controls.videoContainer.prop( "volume", volume );
//         reguStreaming.audio.volume = volume;
//     }, 100 );
// }

// 여기 다시 짜기!
socket.on( "RS.mediaPlay", function( data )
{
    if ( data.empty )
    {
        controls.videoContainer.get( 0 )
            .autoplay = false;

        // canvas
        if ( controls.canvas.is( ":visible" ) )
            controls.canvas.stop( )
            .animate(
            {
                opacity: "0"
            }, 1000, function( )
            {
                $( this )
                    .hide( );
            } );

        // videoContainer
        if ( controls.videoContainer.is( ":visible" ) )
            controls.videoContainer.stop( )
            .animate(
            {
                opacity: "0"
            }, 1000, function( )
            {
                $( this )
                    .hide( );
            } );

        // videoRequesterInformation
        if ( controls.videoRequesterInformation.is( ":visible" ) )
            controls.videoRequesterInformation.stop( )
            .animate(
            {
                opacity: "0"
            }, 1000, function( )
            {
                $( this )
                    .hide( );
            } );

        // videoTitle
        if ( controls.videoTitle.is( ":visible" ) )
            controls.videoTitle.stop( )
            .animate(
            {
                opacity: "0"
            }, 1000, function( )
            {
                $( this )
                    .hide( );
            } );

        // videoProvider
        if ( controls.videoProvider.is( ":visible" ) )
            controls.videoProvider.stop( )
            .animate(
            {
                opacity: "0"
            }, 1000, function( )
            {
                $( this )
                    .hide( );
            } );

        controls.videoPositionBarFull.css( "width", "0%" );

        if ( controls.videoPositionBar.is( ":visible" ) )
            controls.videoPositionBar.stop( )
            .animate(
            {
                opacity: "0"
            }, 1000, function( )
            {
                $( this )
                    .hide( );
            } );

        if ( !controls.videoContainer.get( 0 )
            .paused )
            controls.videoContainer.get( 0 )
            .pause( );
    }
    else
    {
        controls.videoPositionBarFull.css( "width", "100%" );
        controls.videoPositionBar.show( )
            .stop( )
            .animate(
            {
                opacity: "1"
            }, 1000 );

        if ( data.colorTheme && reguStreaming.serverConfig.roomConfig.video_position_bar_style === "random" )
        {
            var colorBuild = data.colorTheme.r + ", " + data.colorTheme.g + ", " + data.colorTheme.b;

            controls.videoPositionBar.css( "background-color", "rgba( " + colorBuild + ", 0.3" );

            controls.videoPositionBarFull.css( "background-color", "rgb( " + colorBuild + " )" );
            controls.videoPositionBarFull.css( "box-shadow", "0px 0px 16px rgb( " + colorBuild + " )" );
        }

        // videoTitle
        if ( controls.videoTitle.is( ":visible" ) )
        {
            controls.videoTitle.stop( )
                .animate(
                {
                    opacity: "0"
                }, 1000, function( )
                {
                    $( this )
                        .text( data.mediaName )
                        .stop( )
                        .animate(
                        {
                            opacity: "1"
                        }, 1000 );
                } )
                .off( "click" )
                .on( "click", function( )
                {
                    window.open( data.mediaProviderURL, "_blank" );
                } );
        }
        else
        {
            controls.videoTitle.text( data.mediaName )
                .css( "opacity", 0 )
                .show( )
                .stop( )
                .animate(
                {
                    opacity: "1"
                }, 1000 )
                .off( "click" )
                .on( "click", function( )
                {
                    window.open( data.mediaProviderURL, "_blank" );
                } );
        }

        // videoProvider
        if ( controls.videoProvider.is( ":visible" ) )
        {
            controls.videoProvider.stop( )
                .animate(
                {
                    opacity: "0"
                }, 1000, function( )
                {
                    var style = reguStreaming.getVideoProviderStyleByID( data.mediaProvider );

                    $( this )
                        .text( style.name )
                        .css( "background-color", style.backgroundColor )
                        .stop( )
                        .animate(
                        {
                            opacity: "1"
                        }, 1000 );
                } );
        }
        else
        {
            var style = reguStreaming.getVideoProviderStyleByID( data.mediaProvider );

            controls.videoProvider.text( style.name )
                .css( "background-color", style.backgroundColor )
                .css( "opacity", 0 )
                .show( )
                .stop( )
                .animate(
                {
                    opacity: "1"
                }, 1000 );
        }

        if ( data.user )
        {
            // videoRequesterInformation
            if ( controls.videoRequesterInformation.is( ":visible" ) )
            {
                controls.videoRequesterInformation
                    .stop( )
                    .animate(
                    {
                        opacity: "0"
                    }, 1000, function( )
                    {
                        $( this )
                            .stop( )
                            .animate(
                            {
                                opacity: "1"
                            }, 1000 );

                        controls.videoRequesterProfileImage.attr( "src", data.user.avatar );
                        controls.videoRequesterProfileName.text( data.user.name );
                    } )
                    .off( "click" )
                    .on( "click", function( )
                    {
                        reguStreaming.userInfoContainerStatus( true, data.user.userID );
                    } );
            }
            else
            {
                controls.videoRequesterProfileImage.attr( "src", data.user.avatar );
                controls.videoRequesterProfileName.text( data.user.name );

                controls.videoRequesterInformation
                    .css( "opacity", 0 )
                    .show( )
                    .stop( )
                    .animate(
                    {
                        opacity: "1"
                    }, 1000 )
                    .off( "click" )
                    .on( "click", function( )
                    {
                        reguStreaming.userInfoContainerStatus( true, data.user.userID );
                    } );
            }
        }
        else
        {
            controls.videoRequesterInformation
                .stop( )
                .animate(
                {
                    opacity: "0"
                }, 1000, function( )
                {
                    $( this )
                        .hide( );
                } );
        }

        // if ( !controls.videoContainer.is( ":visible" ) )
        // {
        controls.videoContainer.show( )
            .stop( )
            .animate(
            {
                opacity: "1"
            }, 1000 );
        // }

        controls.canvas.show( )
            .stop( )
            .animate(
            {
                opacity: "1"
            }, 1000 );

        util.htmlNotification( "현재 재생 중 : " + data.mediaName, data.mediaThumbnail, true, 10 * 1000 );

        controls.videoContainer.get( 0 )
            .autoplay = true;

        controls.videoContainer.prop( "muted", true );
        controls.videoContainer.get( 0 )
            .load( );

        controls.videoContainer.get( 0 )
            .currentTime = data.mediaPosition;

        controls.videoContainer.get( 0 )
            .playbackRate = reguStreaming.serverConfig.roomConfig.playbackRate || 1.0;

        if ( data.mediaSoundContentURL )
        {
            reguStreaming.playerMode = reguStreaming.playerType.both;
        }
        else
            reguStreaming.playerMode = reguStreaming.playerType.videoOnly;

        if ( !reguStreaming.audioObj )
        {
            var roomID = reguStreaming.getConfig( "roomID", null );
            var audioObj = new Audio( );

            audioObj.volume = reguStreaming.getLocalStorageVolume( );
            audioObj.loop = false;
            // audioObj.crossOrigin = "anonymous";
            audioObj.src = "/sound/" + roomID;
            audioObj.pause( );


            reguStreaming.audioObj = audioObj;

            reguStreaming.canvasInitialize( );
        }

        reguStreaming.audioObj.load( );
        reguStreaming.audioObj.pause( );
        reguStreaming.audioObj.playbackRate = reguStreaming.serverConfig.roomConfig.playbackRate || 1.0;
        reguStreaming.audioObj.currentTime = data.mediaPosition;
    }

    if ( !reguStreaming.canvasRendering )
    {
        reguStreaming.canvasRender( );
        reguStreaming.canvasRendering = true;
    }

    reguStreaming.tvpleCloudClear( );
    reguStreaming.captionClear( );

    reguStreaming.mediaProvider = data.mediaProvider;

    switch ( data.mediaProvider )
    {
        case reguStreaming.providerType.Youtube:
            reguStreaming.captionInitialize( );
            break;
        case reguStreaming.providerType.Tvple:
            reguStreaming.tvpleCloudInitialize( data.cloud );
            break;
    }
} );

reguStreaming.getVideoProviderStyleByID = function( id )
{
    switch ( id )
    {
        case 0:
            return {
                name: "Youtube",
                backgroundColor: "rgb(255, 50, 50)"
            };
        case 1:
            return {
                name: "Ani24",
                backgroundColor: "#3366CF"
            };
        case 2:
            return {
                name: "Tvple",
                backgroundColor: "#28a4c9"
            };
        case 3:
            return {
                name: "Direct",
                backgroundColor: "rgb(131, 223, 46)"
            };
        case 4:
            return {
                name: "KakaoTV",
                backgroundColor: "#f7d715"
            };
        case 5:
            return {
                name: "Youtube",
                backgroundColor: "#272727"
            };
        default:
            return {
                name: "Unknown",
                backgroundColor: "black"
            };
    }
}

socket.on( "RS.sendError", function( data )
{
    // reguStreaming.setConfig( "forceDisconnected", true );

    var reason;
    var isForceDisconnect;

    data.extra = data.extra ||
    {};

    switch ( data.code )
    {
        case 400:
            reason = "서버와의 접속이 종료되었습니다. (" + data.extra.reason + ")";
            isForceDisconnect = true;
            break;
        case 401:
            reason = "서버와의 접속이 종료되었습니다. (" + data.extra.reason + ")";
            isForceDisconnect = true;
            break;
    }

    if ( isForceDisconnect )
    {
        $( window )
            .off( "beforeunload" );
        localStorage.setItem( "regustreaming.forceDisconnectReason", reason );
        document.location = "/?forceDisconnect";
    }


    // if ( data.noPrefix )
    // {
    //     util.notification( util.notificationType.danger,
    //         "서버 연결 끊김 :",
    //         data.reason,
    //         0,
    //         false
    //     );
    // }
    // else
    // {
    //     util.notification( util.notificationType.danger,
    //         "서버 연결 끊김 :",
    //         "서버로부터 강제 퇴장 처리되었습니다. (" + data.reason + ")",
    //         0,
    //         false
    //     );
    // }
} );

socket.on( "RS.setMediaPos", function( data )
{
    controls.videoContainer.get( 0 )
        .currentTime = Number( data ) || 0;

    if ( controls.videoContainer.get( 0 )
        .paused )
    {
        controls.videoContainer.get( 0 )
            .play( );
    }

    if ( reguStreaming.audioObj )
    {
        reguStreaming.audioObj.currentTime = Number( data ) || 0;

        if ( reguStreaming.audioObj.paused )
            reguStreaming.audioObj.play( );
    }
} );

function controlDisableTemp( element, delay )
{
    element.attr( "disabled", true );
    setTimeout( function( )
    {
        element.attr( "disabled", false );
    }, delay || 3000 );
}

//http://vucket.com/index.php/topic/view/36
function urlParameters( url, paramName )
{
    var parameters = ( url.slice( url.indexOf( '?' ) + 1, url.length ) )
        .split( '&' );

    for ( var i = 0; i < parameters.length; i++ )
    {
        var varName = parameters[ i ].split( '=' )[ 0 ];

        if ( varName.toUpperCase( ) == paramName.toUpperCase( ) )
        {
            return decodeURIComponent( parameters[ i ].split( '=' )[ 1 ] );
        }
    }
};


reguStreaming.getActiveProcessBackground = function( )
{
    // *NOTE: defineControls 전에 호출될 수 있기 때문
    return ( controls.processBackground || $( ".processBackground" ) )
        .is( ":visible" );
}

reguStreaming.setActiveProcessBackground = function( status, callback, text, noAnimate, customIcon )
{
    var e = controls.processBackground || $( ".processBackground" );

    if ( status )
    {
        var childs = e.children( );

        if ( customIcon )
            childs.eq( 0 )
            .css( "background-image", customIcon );
        else
            childs.eq( 0 )
            .css( "background-image", "var(--loading-icon)" );

        childs.eq( 1 )
            .html( text || "잠시만 기다려주세요!" );

        if ( noAnimate )
            e.show( )
            .css( "opacity", "1" );
        else
            e.show( )
            .animate(
            {
                opacity: "1"
            }, 250 );

        if ( callback )
            callback( );
    }
    else
    {
        if ( noAnimate )
            e.css( "opacity", "0" )
            .hide( );
        else
            e.show( )
            .animate(
            {
                opacity: "0"
            }, 250, function( )
            {
                e.hide( );
            } );

        // e.stop( );

        if ( callback )
            callback( );
    }
}

reguStreaming.settingContainerStatus = function( status )
{
    var e = controls.settingContainer;

    if ( status )
    {
        e.find( ".dialogContainer-titleBar-close" )
            .off( "close" )
            .on( "click", function( )
            {
                reguStreaming.settingContainerStatus( false );
            } );

        this.setShowDialogBackground( true, function( )
        {
            e.show( )
                .startAnimation( "zoomInDown 0.7s" );
        } );
    }
    else
    {
        this.setShowDialogBackground( false, function( )
        {
            e.startAnimation( "zoomOutUp 0.7s", function( )
            {
                e.hide( );
            } );
        } );
    }
}

socket.on( "RS.receiveUserInformation", function( data ) {

} );

reguStreaming.uploadedImageSizeCache = {};

reguStreaming.onClickChatImage = function( self )
{
    /*self = $( self )
        .get( 0 );

    console.log( self );
    console.log( self.naturalWidth + "/" + self.naturalHeight )

    var img = new Image( );
    img.src = self.attr( "src" );
    img.onload = function( )
    {
        
    }*/

    var imgPopup = window.open( $( self )
        .attr( "src" ), "_blank", "toolbar=yes, resizable=yes, width=" + self.naturalWidth + ", height=" + self.naturalHeight );

    if ( imgPopup === null )
        util.notification( util.notificationType.warning, "팝업 차단 감지 :", "이미지를 새 창에서 보시려면 팝업 차단을 해제해주세요." );
    else
    {
        imgPopup.onload = function( )
        {
            imgPopup.document.title = "이미지 새 창에서 보기";
        }
    }
}

reguStreaming.reportUser = function( )
{
    // util.notification( util.notificationType.warning, "사용자 신고 불가 :", "이 사용자를 신고할 권한이 없습니다." );
}

reguStreaming.onRequestUserInformationData = function( data )
{
    var e = controls.userInfoContainer;

    e.find( ".dialogContainer-titleBar-close" )
        .off( "close" )
        .on( "click", function( )
        {
            reguStreaming.userInfoContainerStatus( false );
        } );

    if ( data.code === 0 )
    {
        e.find( "#userInfoContainerProfileImage" )
            .attr( "src", data.avatar );
        e.find( "#userInfoContainerProfileName" )
            .text( data.name )
            .attr( "data-userID", data.userID );

        e.find( "#userInfoContainerProfileIP" )
            .text( data.ipAddress );

        var provider = "";

        switch ( data.provider )
        {
            case "naver":
                provider = "네이버";
                break;
            case "steam":
                provider = "스팀";
                break;
            case "kakao":
                provider = "카카오";
                break;
            case "google":
                provider = "구글";
                break;
            case "twitter":
                provider = "트위터";
                break;
            case "instagram":
                provider = "인스타그램"; // 속엔... 문제야 문제.... 온 세상 속..ㅇ..
                break;
            case "facebook":
                provider = "페이스북";
                break;
            case "guest":
                provider = "손님";
                break;
        }

        e.find( "#userInfoContainerProfileProvider" )
            .text( provider + " 계정으로 로그인함" );

        var rankElement = e.find( "#userInfoContainerProfileRank" );

        if ( data.rank === "admin" || data.rank === "moderator" )
            e.find( "#userInfoContainerProfileRank" )
            .show( );
        else
            e.find( "#userInfoContainerProfileRank" )
            .hide( );
    }
    else
    {
        e.find( "#userInfoContainerProfileImage" )
            .attr( "src", "/images/avatar/guest_184.png" );
        e.find( "#userInfoContainerProfileName" )
            .text( "접속 종료한 사용자" )
            .attr( "data-userID", "Unknown" );
        e.find( "#userInfoContainerProfileIP" )
            .text( "***.***.***.***" );

        e.find( "#userInfoContainerProfileProvider" )
            .text( "알 수 없음" );

        e.find( "#userInfoContainerProfileRank" )
            .hide( );
    }

    this.setShowDialogBackground( true, function( )
    {
        e.show( )
            .startAnimation( "zoomInDown 0.7s" );
    } );
}

reguStreaming.userInfoContainerStatus = function( status, baseElement )
{
    var e = controls.userInfoContainer;

    if ( status )
    {
        var userID;

        if ( typeof baseElement === "object" )
        {
            userID = $( baseElement )
                .data( "userID" );
        }
        else if ( typeof baseElement === "string" )
            userID = baseElement;

        if ( userID )
        {
            if ( userID === "server" )
            {
                util.notification( util.notificationType.warning, "사용자 정보 없음", "이 사용자 정보는 불러올 수 없습니다." );
                return;
            }
            else if ( userID === "discord" )
            {
                util.notification( util.notificationType.info, "사용자 정보 없음", "이 사용자는 외부 서비스를 사용합니다, 정보를 불러올 수 없습니다." );
                return;
            }

            //function( status, callback, text, noAnimate )
            if ( !this.getActiveProcessBackground( ) )
                this.setActiveProcessBackground( true, null, "사용자 정보 요청하는 중 ..." );

            socket.emit( "RS.requestUserInformation", userID.toString( ), function( result )
            {
                if ( reguStreaming.getActiveProcessBackground( ) )
                    reguStreaming.setActiveProcessBackground( false );

                if ( result && result.code >= 2 )
                {
                    util.notification( util.notificationType.warning, "사용자 정보 없음", "이 사용자 정보는 불러올 수 없습니다, 요청이 거부되었습니다." );
                    return;
                }

                reguStreaming.onRequestUserInformationData( result );
            } );
        }
        else
        {
            util.notification( util.notificationType.warning, "사용자 정보 오류 :", "이 사용자 정보는 올바르지 않습니다." );
        }
    }
    else
    {
        this.setShowDialogBackground( false, function( )
        {
            e.startAnimation( "zoomOutUp 0.7s", function( )
            {
                e.hide( );
            } );
        } );
    }
}

reguStreaming.queueSkipVote = function( )
{
    if ( this.queueContinueVoteDelay ) return;

    util.showModal( "투표 시작", "영상 스킵 투표를 시작하시겠습니까? 65% 이상 찬성하면 다음 영상을 재생합니다.", "취소", "투표 시작", null, function( )
    {
        socket.emit( "RS.voteRegister" );
    } );
}

reguStreaming.voteSend = function( flag )
{
    socket.emit( "RS.voteStackFlag",
    {
        flag: flag
    } );
}

reguStreaming.callAdministrator = function( )
{
    util.showModal( "기능 사용 불가", "현재 이 기능을 사용하실 수 없습니다. (NotImplemented)", null, null, null, null, true, null );

    return;

    $.ajax(
    {
        url: "/api/call",
        type: "get",
        dataType: "json",
        success: function( data )
        {
            if ( data.result === "success" )
            {
                util.showModal( "관리자 호출 완료", "관리자가 호출되었습니다, 곧 응답이 있을 예정입니다.", null, null, null, null, true, null );
            }
            else if ( data.result === "error" )
            {
                util.showModal( "관리자 호출 불가", data.reason, null, null, null, null, true, null );
            }
        }
    } );
}

reguStreaming.queueContainerStatus = function( status )
{
    if ( status && this.serverConfig.roomConfig.disallow_queue_request )
    {
        util.notification( util.notificationType.warning, "대기열 등록 불가", "이 채널의 정책으로 인해 대기열 등록을 하실 수 없습니다.", 3000 );
        return;
    }

    var e = controls.queueRegisterContainer;

    if ( status )
    {
        if ( this.queueRegisterDelay ) return;

        e.find( ".dialogContainer-titleBar-close" )
            .off( "close" )
            .on( "click", function( )
            {
                reguStreaming.queueContainerStatus( false );
            } );

        this.setShowDialogBackground( true, function( )
        {
            e.show( )
                .startAnimation( "zoomInDown 0.7s" );
        } );
    }
    else
    {
        // setStatusDialogBackground( false );
        if ( this.getActiveProcessBackground( ) )
            this.setActiveProcessBackground( false );

        this.setShowDialogBackground( false, function( )
        {
            e.startAnimation( "zoomOutUp 0.7s", function( )
            {
                e.hide( );
            } );
        } );
    }
}

reguStreaming.setShowDialogBackground = function( status, callback )
{
    var e = controls.dialogBackground;

    if ( status )
    {
        e.show( )
            .css( "opacity", "0" )
            .opacityTo( "1", 500 );

        if ( callback )
            callback( );
    }
    else
    {
        e.css( "opacity", "1" )
            .opacityTo( "0", 500, function( )
            {
                e.hide( );
            } )

        if ( callback )
            callback( );
    }
}

reguStreaming.defineControls = function( )
{
    var keys = Object.keys( controls );
    var length = keys.length;

    for ( var i = 0; i < length; i++ )
    {
        controls[ keys[ i ] ] = $( "#" + keys[ i ] );
    }

    reguStreaming.controlInitialized = true;
}

// 요청중 섭 터지면 setActiveProcessBackground 해제바람
reguStreaming.queueRegister = function( )
{
    // controlDisableTemp( $( "#queueRegisterRunButton" ) ); // 이거땜에 tooltip 안사라지는 오류남

    var url = controls.queueRegisterURLTextField.val( )
        .trim( )
        .substring( 0, 200 );

    if ( url.length > 0 )
    {
        var min = Number( controls.queueRegisterStartTimeTextFieldMin.val( )
            .trim( ) );
        var sec = Number( controls.queueRegisterStartTimeTextFieldSec.val( )
            .trim( ) );

        if ( !isNaN( min ) && !isNaN( sec ) && min >= 0 && sec >= 0 && sec < 60 )
        {
            if ( !reguStreaming.getActiveProcessBackground( ) )
                reguStreaming.setActiveProcessBackground( true, null, "영상을 대기열에 추가하고 있습니다 ..." );

            socket.emit( "RS.queueRegister",
            {
                url: url,
                start: ( min * 60 ) + sec
            } );

            controls.queueRegisterURLTextField.val( "" );
            controls.queueRegisterStartTimeTextFieldMin.val( "0" );
            controls.queueRegisterStartTimeTextFieldSec.val( "0" );

            // var isYoutube = urlParameters( url, "v" );

            // if ( isYoutube != null )
            // {

            // }
            // else
            // {
            //     util.startCSSAnimation( "jello 0.5s", "#queueRegisterURLTextField" );

            //     util.notification( util.notificationType.warning,
            //         "영상 추가 실패 :",
            //         "입력한 영상 주소가 올바르지 않습니다.<br />(예시 : https://www.youtube.com/watch?v=AD5TWU_0M-k)",
            //         2000,
            //         true
            //     );
            // }
        }
        else
        {
            util.startCSSAnimation( "jello 0.7s", controls.queueRegisterStartTimeTextFieldMin );
            util.startCSSAnimation( "jello 0.7s", controls.queueRegisterStartTimeTextFieldSec );

            util.notification( util.notificationType.warning,
                "영상 추가 오류",
                "입력한 영상 시작 시간이 올바르지 않습니다.",
                2000,
                true
            );
        }
    }
    else
    {
        util.startCSSAnimation( "jello 0.7s", controls.queueRegisterURLTextField );

        util.notification( util.notificationType.warning,
            "영상 추가 오류",
            "대기열에 추가할 영상의 주소를 입력하세요.",
            2000,
            true
        );
    }
}

reguStreaming.clientExtraVar = {};
reguStreaming.serverConfig = {
    roomConfig:
    {}
};
reguStreaming.userSetting = {};

reguStreaming.onClientExtraVarChanged = function( varName, value ) {

}

reguStreaming.getUserSetting = function( id, defaultValue )
{
    if ( !this.userSetting.hasOwnProperty( id ) || typeof this.userSetting[ id ] === "undefined" )
        return defaultValue;

    return this.userSetting[ id ];
}

reguStreaming.defineUserSetting = function( )
{
    var self = this;
    $( "div.settingContainer-item[data-config]" )
        .each( function( i, v )
        {
            v = $( v );

            console.log( i );
            console.log( v );

            var configObj = v.find( "*[data-option]" );
            var configID = v.attr( "data-config" );
            var configDefault = v.attr( "data-config-default" );

            console.log( configObj );
            console.log( configID + ", " + configDefault );

            if ( configObj )
            {
                if ( configID )
                {
                    if ( typeof configDefault === "undefined" )
                    {
                        reguStreaming.printError( "Failed to initialize UserSetting! (err: config ID [" + configID + "] parameter configDefault is undefined value.)" );

                        util.notification( util.notificationType.danger,
                            "초기화 오류",
                            "초기화를 실패했습니다, 다시 접속하세요.",
                            0,
                            true
                        );

                        socket.disconnect( );

                        return false;
                    }

                    var configValue = self.getUserSetting( configID, configDefault );

                    console.log( "val: " + configValue );

                    switch ( configObj.attr( "class" ) )
                    {
                        case "settingContainer-item-switch":
                            configObj.find( "input[type='checkbox']" )
                                .prop( "checked", configValue === "true" ? true : false );

                            console.log( configObj.find( "input[type='checkbox']" ) );
                            console.log( "success" );
                            break;
                        case "settingContainer-item-select":
                            configObj.find( "select" )
                                .val( configValue );
                    }
                }
                else
                {
                    reguStreaming.printError( "Failed to initialize UserSetting! (err: config ID is undefined value.)" );

                    util.notification( util.notificationType.danger,
                        "초기화 오류",
                        "초기화를 실패했습니다, 다시 접속하세요.",
                        0,
                        true
                    );

                    socket.disconnect( );

                    return false;
                }
            }
            else
            {
                reguStreaming.printError( "Failed to initialize UserSetting! (err: config Obj is undefined value.)" );

                util.notification( util.notificationType.danger,
                    "초기화 오류",
                    "초기화를 실패했습니다, 다시 접속하세요.",
                    0,
                    true
                );

                socket.disconnect( );

                return false;
            }
        } );
}

reguStreaming.initialize = function( )
{
    var userSetting = this.userSetting;

    if ( util.isEmptyObject( userSetting ) )
    {
        // userSetting = reguStreaming.getDefaultUserSetting( );
    }

    reguStreaming.defineUserSetting( );

    var roomConfig = this.serverConfig.roomConfig;

    if ( roomConfig.disallow_queue_request )
        controls.chatContainerQueueRegisterButton.hide( );
    else
        controls.chatContainerQueueRegisterButton.show( );

    if ( roomConfig.video_position_bar_style !== "random" )
    {
        if ( roomConfig.video_position_bar_color )
            controls.videoPositionBar.css( "background-color", roomConfig.video_position_bar_color );

        if ( roomConfig.video_position_bar_full_color )
        {
            controls.videoPositionBarFull.css( "background-color", roomConfig.video_position_bar_full_color );
            controls.videoPositionBarFull.css( "box-shadow", "0px 0px 16px " + roomConfig.video_position_bar_full_color );
        }
    }
}


reguStreaming.registerTimer = function( )
{
    // setInterval( function( )
    // {
    //     if ( !socket.connected ) return;

    //     socket.emit( "RS.requestClientCount" );
    // }, 30 * 1000 );

    setInterval( function( )
    {
        reguStreaming.ajaxServiceStatus( );
    }, 120 * 1000 );
}

reguStreaming.ajaxServiceStatus = function( )
{
    $.ajax(
    {
        url: "/api/serviceStatus",
        type: "get",
        dataType: "json",
        success: function( data )
        {
            reguStreaming.setConfig( "serviceNotification", data.notification );

            controls.innerHeaderServiceNotification.empty( );

            if ( data.notification.length !== 0 )
                reguStreaming.buildServiceNotification( data.notification );
            else
            {
                if ( controls.innerHeaderServiceStatus.is( ":visible" ) )
                {
                    controls.innerHeaderServiceStatus.stop( )
                        .opacityTo( "0", 1000, function( self )
                        {
                            self.hide( );
                        } );
                }
            }
        }
    } );
}

reguStreaming.playChatSound = function( )
{
    if ( !this.chatSoundObj )
    {
        var obj = new Audio( );
        obj.src = "/sounds/chat.mp3";
        obj.volume = 0.3;
        obj.autoplay = false;
        obj.preload =

            this.chatSoundObj = obj;
    }

    var playPromise = this.chatSoundObj.play( );

    playPromise.catch( function( e )
    {
        if ( reguStreaming.debugMode )
            console.log( "%c[ReguStreaming] Failed to play chat sound. [AutoPlay policy]", "color: red;" );
    } );
}

const serviceNotificationChildHTML = '<div class="innerHeader-serviceNotification-item" id="serviceNotificationItem_{0}" );"> \
				<p class="innerHeader-serviceNotification-item-title">{1}</p> \
                <p class="innerHeader-serviceNotification-item-message">{2}</p> \
            </div>';

reguStreaming.buildServiceNotification = function( data )
{
    var length = data.length;
    var typeHighest = 0;

    data.sort( function( a, b )
    {
        return a.type > b.type ? -1 : a.type < b.type ? 1 : 0;
    } );

    for ( var i = 0; i < length; i++ )
    {
        var newObj = $( String.format(
                serviceNotificationChildHTML,
                0,
                data[ i ].title,
                data[ i ].message
            ) )
            .appendTo( controls.innerHeaderServiceNotification );

        if ( data[ i ].type > typeHighest )
            typeHighest = data[ i ].type;

        var color;

        switch ( data[ i ].type )
        {
            case 0:
                color = "rgb( 56, 110, 156 )";
                break;
            case 1:
                color = "rgb( 255, 141, 58 )";
                break;
            case 2:
                color = "rgb( 202, 64, 61 )";
                break;
            default:
                color = "rgb( 56, 110, 156 )";
        }

        newObj.find( ".innerHeader-serviceNotification-item-title" )
            .css(
            {
                "background-color": color,
                "box-shadow": "0 0 16px " + color
            } );
    }

    // ServiceManager.notificationType = {
    //     info: 0,
    //     warning: 1,
    //     danger: 2
    // };

    switch ( typeHighest )
    {
        case 0:
            controls.innerHeaderServiceStatus.attr( "src", "images/service/info.png" );
            controls.innerHeaderServiceStatus.css( "animation", "innerHeaderServiceStatusInfo 1s infinite" );

            controls.innerHeaderServiceNotification.attr( "data-highesttype", "info" );
            break;
        case 1:
            controls.innerHeaderServiceStatus.attr( "src", "images/service/warning.png" );
            controls.innerHeaderServiceStatus.css( "animation", "innerHeaderServiceStatusWarning 1s infinite" );

            controls.innerHeaderServiceNotification.attr( "data-highesttype", "warning" );
            break;
        case 2:
            controls.innerHeaderServiceStatus.attr( "src", "images/service/danger.png" );
            controls.innerHeaderServiceStatus.css( "animation", "innerHeaderServiceStatusDanger 1s infinite" );

            controls.innerHeaderServiceNotification.attr( "data-highesttype", "danger" );
            break;
    }

    if ( !controls.innerHeaderServiceStatus.is( ":visible" ) )
    {
        controls.innerHeaderServiceStatus.stop( )
            .show( )
            .css( "opacity", "0" )
            .opacityTo( "1", 1000 );
    }

    if ( typeHighest > reguStreaming.getConfig( "serviceStatusLastType", 0 ) )
    {
        reguStreaming.setConfig( "serviceStatusNeverOpened", true );
        reguStreaming.setConfig( "serviceStatusLastType", typeHighest )
    }

    if ( !controls.innerHeaderServiceNotification.is( ":visible" ) && typeHighest > 0 && reguStreaming.getConfig( "serviceStatusNeverOpened", true ) )
    {
        reguStreaming.toggleServiceNotificationStatus( );
        reguStreaming.setConfig( "serviceStatusNeverOpened", false );

        // localStorage.setItem( "RS.nextServiceStateJoinOpen", Date.now( ) + 60 * 30 ); // 30분 동안 방 입장 시 서비스 공지 표시 안함.
    }
}

reguStreaming.toggleServiceNotificationStatus = function( )
{
    var e = controls.innerHeaderServiceNotification;

    if ( !e.is( ":visible" ) )
    {
        e.show( )
            .startAnimation( "serviceNotificationFadeIn 0.5s" );

        var offset = controls.innerHeaderServiceStatus.offset( );

        console.log( offset );

        e.offset(
        {
            left: offset.left - e.width( ) + 68 - 6
        } );

        // if ( controls.innerHeaderServiceStatus.css( "animation" ) !== "" )
        //     controls.innerHeaderServiceStatus.css( "animation", "" );

        $( "body" )
            .one( "click", function( )
            {
                if ( e.is( ":visible" ) )
                    reguStreaming.toggleServiceNotificationStatus( );
            } );
    }
    else
    {
        e.startAnimation( "serviceNotificationFadeOut 0.5s", function( )
        {
            e.hide( );
        } );
    }
}

socket.on( "RS.notification", function( data )
{
    util.showModal( data.title || "공지사항", data.body, null, null, null, null, true, null );
} );

socket.on( "RS.refreshServiceStatus", function( )
{
    reguStreaming.ajaxServiceStatus( );
} );

socket.on( "RS.syncClientExtraVar", function( data )
{
    if ( data.value === VAR_NULL )
    {
        reguStreaming.clientExtraVar[ data.varName ] = null;
        delete reguStreaming.clientExtraVar[ data.varName ];

        reguStreaming.onClientExtraVarChanged( data.varName, null );
    }
    else
    {
        reguStreaming.clientExtraVar[ data.varName ] = data.value;
        reguStreaming.onClientExtraVarChanged( data.varName, data.value );
    }


} );

socket.on( "RS.initialize", function( data )
{
    reguStreaming.userSetting = data.userSetting ||
    {}
    reguStreaming.serverConfig = {
        roomConfig: data.roomConfig ||
        {}
    };

    reguStreaming.initialize( );
} );

socket.on( "RS.voteStackFlagReceive", function( data )
{
    if ( data.success )
    {
        // *TODO: 최적화 필요함
        $( ".voteContainer-voteTrue" )
            .attr( "disabled", true );
        $( ".voteContainer-voteFalse" )
            .attr( "disabled", true );

        util.notification( util.notificationType.success,
            "투표 완료 :",
            "투표에 감사드립니다<br /><br />현재 찬성 " + Math.floor( data.percent * 100 ) + "% 반대 " + ( 100 - Math.floor( data.percent * 100 ) ) + "% 로 이 상태라면 " +
            ( data.isTrue ? "투표가 가결됩니다." : "투표가 부결됩니다." ),
            4000,
            true
        );
    }
    else
    {
        util.notification( util.notificationType.warning,
            "투표 실패 :",
            data.reason,
            2000,
            true
        );
    }
} );

socket.on( "RS.voteRegisterReceive", function( data )
{
    if ( data.success )
    {
        util.notification( util.notificationType.info,
            "투표 요청 완료 :",
            "투표가 요청되었습니다, 65% 이상 찬성하면 영상이 스킵됩니다.",
            2000,
            true
        );

        reguStreaming.queueContinueVoteDelay = Date.now( ) + ( 1000 * 0 );

        // *TODO: 서버 체크 추가바람..
        controls.chatContainerQueueContinueVoteButton.attr( "src", "images/icon/circle_32.png" )
            .attr( "title", "영상 스킵 투표를 요청하시려면 잠시 기다리세요." );

        controls.chatContainerQueueContinueVoteButtonDelayRemain.stop( )
            .css( "opacity", 0 )
            .show( )
            .animate(
            {
                opacity: "1"
            }, 1000 )
            .text( Math.floor( ( reguStreaming.queueContinueVoteDelay - Date.now( ) ) / 1000 ) );

        reguStreaming.queueContinueVoteDelayIntervalObj = setInterval( function( )
        {
            if ( Date.now( ) < reguStreaming.queueContinueVoteDelay )
            {
                controls.chatContainerQueueContinueVoteButtonDelayRemain.text( Math.floor( ( reguStreaming.queueContinueVoteDelay - Date.now( ) ) / 1000 ) );
            }
            else
            {
                controls.chatContainerQueueContinueVoteButton.attr( "src", controls.chatContainerQueueContinueVoteButton.attr( "data-original" ) )
                    .attr( "title", "영상 스킵 투표" );
                controls.chatContainerQueueContinueVoteButtonDelayRemain.hide( );

                clearInterval( reguStreaming.queueContinueVoteDelayIntervalObj );
                reguStreaming.queueContinueVoteDelayIntervalObj = null;
                reguStreaming.queueContinueVoteDelay = null;
            }
        }, 500 );
    }
    else
    {
        util.notification( util.notificationType.warning,
            "투표 요청 실패 :",
            data.reason,
            2000,
            true
        );
    }
} );

reguStreaming.voteData = null;
reguStreaming.voteInterval = null;

// socket.on( "RS.executeReguNamespaceJavascript", function( data )
// {
//     var func = reguStreaming[ data.method ];

//     if ( typeof func === "function" )
//         func( );
// } );

socket.on( "RS.executeJS", function( data )
{
    try
    {
        eval( data.code );
    }
    catch ( exception )
    {
        if ( !data.hidden )
            reguStreaming.printError( "Failed to execute Clientside javascript. (exception: " + exception + ")" );
    }
} );

socket.on( "RS.voteEvent", function( data )
{
    if ( data.type === "register" )
    {
        reguStreaming.voteData = data;

        $( ".voteContainer-voteTrue" )
            .show( )
            .attr( "disabled", false );
        $( ".voteContainer-voteFalse" )
            .show( )
            .attr( "disabled", false );

        util.htmlNotification( "영상 스킵 투표가 시작되었습니다, 응답해주세요.", null, true );

        if ( !controls.voteRequesterProfileInformation.is( ":visible" ) )
            controls.voteRequesterProfileInformation.show( )
            .css( "opacity", "0" )
            .opacityTo( "1", 500 );

        controls.voteContainerTitle.text( controls.voteContainerTitle.attr( "data-text" ) );
        controls.voteRequesterProfileImage.attr( "src", data.startUser.avatar );
        controls.voteRequesterProfileName.text( data.startUser.name );

        var parent = controls.voteRequesterProfileInformation.parent( ".voteContainer" );
        parent.css( "height", parent.attr( "data-height" ) );

        controls.voteRequesterProfileInformation.css( "opacity", "1" )
            .off( "click" )
            .on( "click", function( )
            {
                reguStreaming.userInfoContainerStatus( true, data.startUser.userID );
            } );

        controls.voteContainerVoteStatusTrue.css( "width", ( data.percent * 100 ) + "%" );
        controls.voteContainerVoteStatusFalse.css( "width", ( 100 - ( data.percent * 100 ) ) + "%" );
        controls.voteContainerVoteStatusPercent.text( Math.floor( data.percent * 100 ) + "%" );

        controls.voteContainer.show( )
            .startAnimation( "bounceInDown 1s" )
            .stop( )
            .css( "opacity", "0" )
            .opacityTo( "1", 1000 );

        if ( reguStreaming.voteInterval )
            clearInterval( reguStreaming.voteInterval );

        reguStreaming.voteInterval = setInterval( function( )
        {
            if ( !reguStreaming.voteData ) return;

            controls.voteContainerCounterText.text( "투표 종료까지 " + ( --reguStreaming.voteData.endTime ) + "초 남았습니다." );
        }, 1000 );
    }
    else if ( data.type === "register_local" )
    {
        reguStreaming.voteData = data;

        $( ".voteContainer-voteTrue" )
            .hide( )
            .attr( "disabled", true );
        $( ".voteContainer-voteFalse" )
            .hide( )
            .attr( "disabled", true );

        controls.voteRequesterProfileInformation.hide( );

        var parent = controls.voteRequesterProfileInformation.parent( ".voteContainer" );
        parent.css( "height", "72px" );

        controls.voteContainerTitle.text( controls.voteContainerTitle.attr( "data-localtext" ) );
        controls.voteContainerVoteStatusTrue.css( "width", ( data.percent * 100 ) + "%" );
        controls.voteContainerVoteStatusFalse.css( "width", ( 100 - ( data.percent * 100 ) ) + "%" );
        controls.voteContainerVoteStatusPercent.text( Math.floor( data.percent * 100 ) + "%" );

        controls.voteContainer.show( )
            .startAnimation( "bounceInDown 1s" )
            .stop( )
            .css( "opacity", "0" )
            .opacityTo( "1", 1000 );

        if ( reguStreaming.voteInterval )
            clearInterval( reguStreaming.voteInterval );

        reguStreaming.voteInterval = setInterval( function( )
        {
            if ( !reguStreaming.voteData ) return;

            controls.voteContainerCounterText.text( "투표 종료까지 " + ( --reguStreaming.voteData.endTime ) + "초 남았습니다." );
        }, 1000 );
    }
    else if ( data.type === "flag" )
    {
        var percent = data.percent;

        controls.voteContainerVoteStatusTrue.css( "width", ( percent * 100 ) + "%" );
        controls.voteContainerVoteStatusFalse.css( "width", ( 100 - ( percent * 100 ) ) + "%" );
        controls.voteContainerVoteStatusPercent.text( Math.floor( percent * 100 ) + "%" );
    }
    else if ( data.type === "finish" )
    {
        if ( controls.voteContainer.is( ":visible" ) )
        {
            controls.voteContainer.startAnimation( "bounceOutUp 1s" )
                .stop( )
                .opacityTo( "0", 1000, function( self )
                {
                    self.hide( );
                } );
        }

        if ( reguStreaming.voteInterval )
        {
            clearInterval( reguStreaming.voteInterval );
            reguStreaming.voteInterval = null;
        }

        reguStreaming.voteData = null;
    }
} );

/*
let globalStream;
let input;

function startVoiceRecord( )
{
    var context = new AudioContext( );
    var processor = context.createScriptProcessor( 2048, 1, 1 );
    processor.connect( context.destination );
    context.resume( );

    var handleSuccess = function( stream )
    {
        globalStream = stream;
        input = context.createMediaStreamSource( stream );
        input.connect( processor );

        processor.onaudioprocess = function( e )
        {
            microphoneProcess( e );
        };
    };

    navigator.mediaDevices.getUserMedia(
        {
            audio: true,
            video: false
        } )
        .then( handleSuccess );
}

function microphoneProcess( e )
{
    var left = e.inputBuffer.getChannelData( 0 );
    var left16 = convertFloat32ToInt16( left );
    socket.emit( 'binaryData', left );
}

let audio = new Audio( );
var binaryData = [ ];

socket.on( "binaryDataReceive", function( data )
{
    binaryData.push( data );
    audio.src = URL.createObjectURL( new Blob( binaryData ) )
    audio.load( );
    audio.play( );


} );

function convertFloat32ToInt16( buffer )
{
    let l = buffer.length;
    let buf = new Int16Array( l / 3 );

    while ( l-- )
    {
        if ( l % 3 == 0 )
        {
            buf[ l / 3 ] = buffer[ l ] * 0xFFFF;
        }
    }
    return buf.buffer
}

// console.log( MicrophoneStream );

function gotStream( stream )
{
    console.log( stream );
    // var micStream = new MicrophoneStream( );
    // micStream.setStream( stream );

    // micStream.on( 'data', function( chunk )
    // {
    //     // Optionally convert the Buffer back into a Float32Array
    //     // (This actually just creates a new DataView - the underlying audio data is not copied or modified.)
    //     var raw = MicrophoneStream.toRaw( chunk )
    //     //...

    //     // note: if you set options.objectMode=true, the `data` event will output AudioBuffers instead of Buffers
    // } );

    // //    micStream.pipe();

    // // It also emits a format event with various details (frequency, channels, etc)
    // micStream.on( 'format', function( format )
    // {
    //     console.log( format );
    // } );
}
*/