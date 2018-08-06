/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const socket = io(
{
    reconnectionDelay: 5000,
    secure: true
} );

// socket.on( 'ping', ( ) =>
// {
//     console.log( "ping!" );
// } );

// socket.on( "pong", function( latency )
// {

//     console.log( latency );
// } );

const siofu = new SocketIOFileUpload( socket );

// 채팅 딜레이 넣기

reguStreaming.controlInitialized = false;
reguStreaming.chatCommands = [
    {
        command: "/clear",
        func: function( )
        {
            controls.chatBoxInner.empty( );

            chatMessageCount = 0;
            chatMessageInputHistory = [ ];

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

reguStreaming.canUpload = function( fileData, callback )
{
    var allowType = [
        "image/png",
        "image/gif",
        "image/jpg",
        "image/jpeg"
    ];

    if ( fileData )
    {
        if ( allowType.indexOf( fileData.type ) > -1 )
        {
            var img = new Image( );
            img.src = URL.createObjectURL( fileData );
            img.onload = function( )
            {
                var width = this.naturalWidth,
                    height = this.naturalHeight;

                URL.revokeObjectURL( this.src );

                if ( width <= 2048 && height <= 2048 )
                    callback( true );
                else
                    callback( false, "2048x2048 크기를 초과하는 이미지는 업로드할 수 없습니다." ); // 맞춤법 검사 바람
            }
        }
        else
            callback( false, "gif, png, jpg 형식의 이미지만 업로드할 수 있습니다." );
    }
    else
        callback( false, "파일 데이터가 올바르지 않습니다." );
}

reguStreaming.imageUploadButtonClicked = function( )
{
    controls.imageFileInput.trigger( "click" );
}

reguStreaming.fileUploadData = null;
let chatMessageInputHistory = [ ];
let currentChatMessageInputHistoryIndex = 0;

// id element only!
let controls = {
    imageFileInput: null,
    background: null,

    innerHeader: null,

    chatContainer: null,
    chatInputContainer: null,
    chatTextField: null,

    userRightMenu: null,

    videoTitle: null,
    videoBuffering: null,
    videoPositionBar: null,
    videoPositionFullBar: null,
    videoURL: null,
    videoVolumeController: null,
    videoRequesterInformation: null,
    videoRequesterProfileImage: null,
    videoRequesterProfileName: null,

    voteContainerTime: null,
    voteContainerStartUser: null,

    queueRegisterButton: null,
    queueRegisterContainer: null,
    queueRegisterURLTextField: null,
    queueRegisterStartTimeTextFieldMin: null,
    queueRegisterStartTimeTextFieldSec: null,

    voteContainer: null,
    userInfoContainer: null,
    settingContainer: null,

    welcomeClientCount: null,
    chatBoxInner: null,

    currentRoomInformation: null,

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
    videoAutoPlayAgree: null
};

$( window )
    .on( "load", function( )
    {
        if ( !reguStreaming.getActiveProcessBackground( ) )
            reguStreaming.setActiveProcessBackground( true, null, "불러오는 중 ...", true );

        reguStreaming.defineControls( );

        controls.videoVolumeController.val( reguStreaming.getLocalStorageVolume( ) * 100 );
        // controls.chatInputContainer.hide( );
        controls.videoContainer.prop( "volume", reguStreaming.getLocalStorageVolume( ) );

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

        controls.videoContainer.on( "loadedmetadata", function( ) {

        } );

        controls.videoContainer.on( "waiting", function( )
        {
            if ( !controls.videoBuffering.is( ":visible" ) )
                controls.videoBuffering.show( )
                .stop( )
                .css( "opacity", "0" )
                .animate(
                {
                    opacity: "1"
                }, 300 );
        } );

        controls.videoContainer.on( "canplay", function( )
        {
            if ( controls.videoBuffering.is( ":visible" ) )
                controls.videoBuffering.stop( )
                .animate(
                {
                    opacity: "0"
                }, 300, function( )
                {
                    $( this )
                        .hide( );
                } );
        } );

        controls.videoContainer.on( "timeupdate", function( )
        {
            var video = controls.videoContainer.get( 0 );

            if ( video.paused ) return;

            controls.videoPositionFullBar.css( "width", ( ( video.currentTime / video.duration ) * 100 ) + "%" );
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

                    switch ( e.target.className )
                    {
                        case "canvas":
                            e.preventDefault( );

                            break;
                        case "queueItem":
                            e.preventDefault( );
                            break;
                        case "chatProfileName":
                        case "chatProfileAvatar":
                            reguStreaming.clickedChatMessageTemp = e.target;

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
                                reguStreaming.userInfoContainerStatus( true, reguStreaming.clickedChatMessageTemp.parentElement );
                                break;
                        }

                        reguStreaming.clickedChatMessageTemp = null;
                    }
                }
            } )




        // $( "#notifyModal" ).modal( "show" );

        controls.imageFileInput.on( "change", function( )
        {
            var fileList = $( this )
                .prop( "files" );

            reguStreaming.canUpload( fileList[ 0 ], function( isAllow, reason )
            {
                if ( isAllow )
                {
                    reguStreaming.fileUploadData = $.extend( true,
                    {}, fileList ); // Shallow copy to deep;

                    var reader = new FileReader( );
                    // Closure to capture the file information.
                    reader.onload = function( e )
                    {
                        var fileData = reguStreaming.fileUploadData[ 0 ];

                        var raw = e.target.result;

                        console.log( raw );

                        // https://developer.mozilla.org/en/JavaScript_typed_arrays
                        var rawBytes = new Uint8Array( raw );
                        var hex = "";
                        for ( var cycle = 0; cycle < raw.byteLength; cycle++ )
                        {
                            hex += rawBytes[ cycle ].toString( 16 ) + " ";
                            // TODO: more elegance
                            if ( !( ( cycle + 1 ) % 8 ) )
                                hex += "\n";
                        }

                        socket.emit( "regu.uploadFile",
                        {
                            name: fileData.name,
                            size: fileData.size,
                            lastModified: fileData.lastModified
                        } );
                    }

                    reader.readAsArrayBuffer( reguStreaming.fileUploadData[ 0 ] );

                    // console.log( reguStreaming.fileUploadData );
                    // console.log( reguStreaming.fileUploadData[ 0 ] );
                }
                else
                    util.notification( util.notificationType.warning, "업로드 불가 :", reason || "이 이미지는 업로드할 수 없습니다.", 2000 );

                controls.imageFileInput.val( "" );
            } );
        } );

        $( "#queueRegisterURLTextField" )
            .keydown( function( event )
            {
                if ( event.keyCode == 13 )
                {
                    $( "#queueRegisterRunButton" )
                        .trigger( "click" );

                    controlDisableTemp( $( this ) );
                    controlDisableTemp( $( "#queueRegisterRunButton" ) );

                    return false;
                }
            } );

        $( "#chatTextField" )
            .keydown( function( event )
            {
                if ( event.keyCode == 13 ) // 엔터
                {
                    var chatMessage = $( this )
                        .val( )
                        .trim( );

                    if ( chatMessage.length == 0 ) return;

                    $( this )
                        .val( "" );

                    if ( chatMessage.length <= 0 || chatMessage.length > 200 )
                    {
                        util.notification( util.notificationType.warning, "채팅 불가 :", "채팅 메세지는 1자 이상 200자 이하 되어야 합니다.", 2000 );
                        return false;
                    }

                    reguStreaming.checkXSS( chatMessage, function( detected )
                    {
                        if ( detected )
                        {
                            util.notification( util.notificationType.warning, "채팅 불가 :", "채팅 메세지에 입력할 수 없는 문장입니다.", 2000 );
                            return false;
                        }

                        if ( runChatCommand( chatMessage ) )
                            return false;

                        if ( chatMessageInputHistory.length > 5 )
                            chatMessageInputHistory.slice( 0, 1 );

                        chatMessageInputHistory.push( chatMessage );

                        currentChatMessageInputHistoryIndex = chatMessageInputHistory.length - 1;

                        socket.emit( "regu.chat", chatMessage );

                        return false;
                    } );
                }
                else if ( event.keyCode == 38 ) // 위 방향
                {
                    if ( chatMessageInputHistory.length > 0 && chatMessageInputHistory[ currentChatMessageInputHistoryIndex ] )
                    {
                        var messageHistory = chatMessageInputHistory[ currentChatMessageInputHistoryIndex ]

                        $( this )
                            .val( messageHistory )
                            .putCursorAtEnd( );

                        currentChatMessageInputHistoryIndex = Math.clamp( currentChatMessageInputHistoryIndex - 1, 0, chatMessageInputHistory.length - 1 );
                    }
                }
                else if ( event.keyCode == 40 ) // 아래 방향
                {
                    if ( chatMessageInputHistory[ currentChatMessageInputHistoryIndex ] )
                    {
                        var messageHistory = chatMessageInputHistory[ currentChatMessageInputHistoryIndex ]

                        $( this )
                            .val( messageHistory )
                            .putCursorAtEnd( );

                        currentChatMessageInputHistoryIndex = Math.clamp( currentChatMessageInputHistoryIndex + 1, 0, chatMessageInputHistory.length - 1 );
                    }
                }
            } );

        controls.videoAutoPlayAgree.on( "click", function( )
        {
            $( this )
                .animate(
                {
                    opacity: "0"
                }, 300, function( )
                {
                    $( this )
                        .hide( );
                } );

            controls.videoContainer.prop( "muted", false );
        } );

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

        if ( util.isIE( ) || util.isEdge( ) )
        {
            util.notification( util.notificationType.warning, "호환성 알림 :", "이 사이트는 해당 브라우저에서 테스트되지 않았습니다<br />버그 발견 시 즉시 신고해주세요.", 0 );
        }

        reguStreaming.canvas = document.getElementById( "canvas" );
        reguStreaming.canvas2D = reguStreaming.canvas.getContext( "2d" );

        reguStreaming.canvas.width = window.innerWidth;
        reguStreaming.canvas.height = window.innerHeight - 112;

        $( window )
            .resize( function( )
            {
                reguStreaming.canvasResize( );
            } );

        reguStreaming.documentLoaded = true;

        reguStreaming.registerTimer( );

        socket.emit( "RS.join" );
    } );

socket.on( "regu.uploadFileReceive", function( data )
{
    if ( !data.exists && reguStreaming.fileUploadData != null )
        siofu.submitFiles( reguStreaming.fileUploadData );
    else
        reguStreaming.fileUploadData = null;
} );

function runChatCommand( message )
{
    message = message.toLowerCase( );

    return reguStreaming.chatCommands.some( function( val )
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
    socket.emit( "regu.mediaUserVote",
    {
        type: type
    } );
}

socket.on( "regu.mediaUserVoteReceive", function( data )
{
    if ( data.success )
    {

    }
    else
    {
        util.notification( util.notificationType.warning, "투표 불가", data.reason, 2500 );
    }
} );

socket.on( "RS.joinResult", function( data )
{
    setTimeout( function( )
    {
        if ( reguStreaming.getActiveProcessBackground( ) )
            reguStreaming.setActiveProcessBackground( false );
    }, 0 ); // 1000

    reguStreaming.setConfig( "lastLoginSuccess", true );
    // reguStreaming.onLoginSuccess( true );

    var roomID = reguStreaming.getConfig( "roomID", null );

    if ( roomID )
        controls.videoContainer.attr( "src", "/media/" + roomID );

    socket.emit( "regu.mediaRequest" );

    // if ( data.queuePlaying )
    // {
    //     controls.videoContainer.css( "opacity", "0" )
    //         .show( )
    //         .stop( )
    //         .animate(
    //         {
    //             opacity: "1"
    //         }, 1000 );
    // }

    if ( !controls.videoContainer.is( ":visible" ) )
        controls.videoContainer.css( "opacity", "0" )
        .show( )
        .stop( )
        .animate(
        {
            opacity: "1"
        }, 1000 );

    if ( !controls.innerHeader.is( ":visible" ) )
        controls.innerHeader.css( "opacity", "0" )
        .show( )
        .stop( )
        .animate(
        {
            opacity: "1"
        }, 1000 );

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
            socket.emit( "forceDisconnect" );
            // e = e || window.event;

            // if ( e )
            //     e.returnValue = "레그 스트리밍에서 접속을 종료하시겠습니까?";

            // return "레그 스트리밍에서 접속을 종료하시겠습니까?";
        } );
} );

// 수정바람
const queueEventString = '<div class="queueItem" id="queueItem_{0}"> \
                <img class="queueItemThumbnail" src="{1}" /> \
			</div>'

let queueCount = 0;
let queueListClient = [ ];

// QueueManager.statusCode = {
//     success: 0,
//     delayError: 1,
//     roomConfigDisallowError: 2,
//     urlError: 3,
//     startTimeError: 4,
//     serverError: 5,
//     liveStreamError: 6,
//     notValidError: 7,
//     startPositionOverThanLengthError: 8,
//     startPositionTooShortThanLengthError: 9,
//     failedToGetInformationError: 10,
//     unknownError: 11
// };
socket.on( "regu.queueRegisterReceive", function( data )
{
    if ( data.code === 0 )
    {
        util.notification( util.notificationType.info, "영상 추가", "귀하가 요청한 영상을 대기열에 추가했습니다.", 2500 );

        reguStreaming.queueContainerStatus( false );
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
                reason = "해당 영상을 서버에서 처리 중 오류가 발생했습니다, 나중에 다시 시도해주세요.";
                break;
            case 6:
                reason = "영상 추가를 할 수 없습니다, 실시간 스트리밍 영상은 추가할 수 없습니다.";
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
                reason = "영상 추가를 할 수 없습니다, 이 영상의 정보를 불러올 수 없습니다.";
                break;
            case 11:
                reason = "영상 추가를 할 수 없습니다, 알 수 없는 오류가 발생했습니다.";
                break;
            default:
                reason = "영상 추가를 할 수 없습니다, 알 수 없는 오류가 발생했습니다.";
        }

        util.notification( util.notificationType.warning, "영상 추가 오류", reason, 4000 );

        reguStreaming.setActiveProcessBackground( false );
    }
} );


// 여기 최적화 필요함.,.
// id 시스템 관리 넣기
//https://www.zerocho.com/category/jQuery/post/57c3a8821efc521700a70918
socket.on( "regu.queue", function( data )
{
    console.log( data );

    if ( data.type == "register" )
    {
        var newObj = $( String.format(
                queueEventString,
                queueCount,
                data.mediaThumbnail
            ) )
            .appendTo( controls.queueVideoListContainer );

        util.startCSSAnimation( "flipInX 1s", newObj );

        // var authorElement = newObj.find( ".queueItemAuthor" );

        // if ( data.user )
        // {
        //     newObj.data( "userID", data.user.userID );

        //     authorElement.on( "click", function( )
        //     {
        //         reguStreaming.userInfoContainerStatus( true, newObj );
        //     } );
        // }
        // else
        // authorElement.remove( );

        // var titleElement = newElement.find( ".queueItemTitle" );

        // if ( titleElement )
        // textFit( titleElement );

        queueListClient.push( newObj );

        queueCount = Math.clamp( queueCount + 1, 0, 1000 ); // 숫자 수정바람
    }
    // else if ( data.type == "converted" )
    // {
    //     var e = queueListClient[ data.index ];

    //     if ( !e ) return;

    //     var convertingElement = e.find( ".queueContainerVideoChildConverting" );

    //     if ( convertingElement )
    //     {
    //         convertingElement.css( "opacity", "1" );
    //         convertingElement.animate(
    //         {
    //             opacity: "0"
    //         }, 500, function( )
    //         {
    //             $( this )
    //                 .remove( );
    //         } );
    //     }
    // }
    else if ( data.type == "removeRecent" )
    {
        var element = queueListClient[ 0 ];

        if ( element )
        {
            for ( var i = 1; i < queueListClient.length; i++ )
            {
                var e = queueListClient[ i ];

                if ( !e ) continue;

                util.startCSSAnimation( "flipOutX 1s", e );
                e.css( "opacity", "1" );
                e.animate(
                {
                    opacity: "0"
                }, 1000, function( )
                {
                    util.startCSSAnimation( "zoomInUp 1s", $( this ) );
                    $( this )
                        .css( "opacity", "0" );
                    $( this )
                        .animate(
                        {
                            opacity: "1"
                        }, 1000 );
                } );
            }

            util.startCSSAnimation( "zoomOutUp 1s", element );

            element.css( "opacity", "1" );
            element.animate(
            {
                opacity: "0"
            }, 1000, function( )
            {
                element.remove( );
                queueListClient.splice( 0, 1 );
            } );
        }
    }
    else if ( data.type == "removeAt" )
    {
        var element = queueListClient[ data.index ];

        if ( typeof element != "undefined" )
        {
            element.css( "opacity", "1" );
            element.animate(
            {
                opacity: "0"
            }, 500, function( )
            {
                $( this )
                    .remove( );
                queueListClient.splice( data.index, 1 );
            } );
        }
    }
    else if ( data.type == "userVoteRefresh" )
    {
        var voteList = data.voteList;

        console.log( voteList );
    }
    else if ( data.type == "dataReq" )
    {
        queueCount = 0;
        queueListClient = [ ];
        controls.queueVideoListContainer.empty( );

        var queueList = data.queueList;
        var queueListLength = queueList.length;

        if ( queueListLength > 0 )
        {
            var fragment = $( document.createDocumentFragment( ) );

            for ( var i = 0; i < queueListLength; i++ )
            {
                var thisData = queueList[ i ];

                var newObj = $( String.format(
                        queueEventString,
                        queueCount,
                        thisData.mediaThumbnail
                    ) )
                    .appendTo( fragment );


                // var authorElement = newObj.find( ".queueItemAuthor" );

                // if ( thisData.user )
                // {
                //     newObj.data( "userID", thisData.user.userID );

                //     authorElement.on( "click", function( )
                //     {
                //         reguStreaming.userInfoContainerStatus( true, newObj );
                //     } );
                // }
                // else
                //     authorElement.text( "test님이 추가함" );
                // else
                //     authorElement.remove( );

                // var titleElement = newElement.find( ".queueItemTitle" );

                // if ( titleElement )
                // textFit( titleElement );

                util.startCSSAnimation( "zoomInUp 1s", newObj );

                queueListClient.push( newObj );
                queueCount = Math.clamp( queueCount + 1, 0, 1000 ); // 숫자 수정바람
            }

            fragment.appendTo( controls.queueVideoListContainer );
        }
    }
} );

let chatMessageCount = 0;

function imageOnLoaded( )
{
    controls.chatBoxInner
        .animate(
        {
            scrollTop: controls.chatBoxInner[ 0 ].scrollHeight
        }, 300, "swing" );
}

reguStreaming.chatFormatBase = {
    def: '<div class="chatMessageContainer" id="chatMessageContainer_{0}"> \
        <img src="{1}" alt="Profile Image" class="chatProfileAvatar" /> \
            <p class="chatProfileName"></p> \
            <p class="chatReceivedTime">{2}</p> \
            <p class="chatMessage"></p> \
        </div>',
    sys: '<div class="chatMessageContainer" id="chatMessageContainer_{0}"> \
            <span class="glyphicon glyphicon-warning-sign" id="sysMessageTypeIcon"></span> \
            <p class="chatMessage" style="margin: 12px;">{1}</p> \
        </div>',
    img: '<div class="chatMessageContainer" id="chatMessageContainer_{0}"> \
        <img src="{1}" alt="Profile Image" class="chatProfileAvatar" /> \
            <p class="chatProfileName"></p> \
            <p class="chatReceivedTime">{2}</p> \
            <img class="chatImage" style="object-fit: fit; width: 100%; padding: 8px; padding-top: 0; cursor: pointer;" onclick="reguStreaming.onClickChatImage( this );" onload="imageOnLoaded( );" src="{3}" /> \
        </div>'
}
reguStreaming.currentChatMessageCount = 0;
reguStreaming.linkRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig; // http://talkerscode.com/webtricks/convert-url-text-into-clickable-html-links-using-javascript.php

socket.on( "regu.chat", function( data )
{
    var currentChatCount = reguStreaming.currentChatMessageCount;
    var currentTime = new Date( );
    var currentTimeString = ( currentTime.getHours( ) < 12 ? "AM " : "PM " ) + ( currentTime.getHours( ) % 12 || 12 ) + ":" + ( currentTime.getMinutes( ) < 10 ? ( "0" + currentTime.getMinutes( ) ) : currentTime.getMinutes( ) );

    if ( data.type == "img" )
    {
        var newObj = $( String.format(
                reguStreaming.chatFormatBase.img,
                reguStreaming.currentChatMessageCount,
                data.profileImage,
                currentTimeString,
                "/files/" + data.fileID
            ) )
            .appendTo( controls.chatBoxInner );

        newObj.data( "userID", data.userID );
        util.startCSSAnimation( "zoomInRight 0.3s", newObj );

        var childAvatar = newObj.children( )
            .eq( 0 );
        var childName = newObj.children( )
            .eq( 1 );

        childAvatar.on( "click", function( )
        {
            reguStreaming.userInfoContainerStatus( true, newObj );
        } );
        childName.on( "click", function( )
        {
            reguStreaming.userInfoContainerStatus( true, newObj );
        } );

        childName.text( data.name );

        if ( data.isAdmin )
        {
            newObj.css( "background-image", "linear-gradient(to right, rgba(65, 124, 127, 0.5), rgba(70, 70, 70, 0.5))" );
            childName.css( "text-shadow", "0px 0px 12px rgba( 91, 216, 222, 1 )" );
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
        }, 1000 * 20, newObj );
    }
    else if ( data.type == "system" )
    {
        var newObj = $( String.format(
                reguStreaming.chatFormatBase.sys,
                reguStreaming.currentChatMessageCount,
                data.message.replace( reguStreaming.linkRegex, "<a class='aRegu' onclick='return reguStreaming.confirmChatLink( this );' target='_blank' href='$1'>$1</a>" )
            ) )
            .appendTo( controls.chatBoxInner );

        util.startCSSAnimation( "zoomInRight 0.3s", newObj );

        newObj.find( ".chatMessage" )
            .css( "font-size", "12px" );
        newObj.css( "background-color", "rgba( 255, 255, 255, 0.9 )" );

        if ( data.icon )
            newObj.find( "#sysMessageTypeIcon" )
            .attr( "class", data.icon );
        else
            newObj.find( "#sysMessageTypeIcon" )
            .remove( );

        /*
        // normal, red, green, blue
        if ( data.color === 0 )
        {
            newObj.find( "#sysMessageTypeIcon" )
                .remove( );
        }
        else if ( data.color === 1 )
        {
            // newObj.css( "background-image", "linear-gradient( to right, rgba(235, 177, 177, 0.3), rgba(70, 70, 70, 0.5))" );
            newObj.find( "#sysMessageTypeIcon" )
                .attr( "class", "glyphicon glyphicon-warning-sign" );
        }
        else if ( data.color === 2 )
        {
            newObj.find( "#sysMessageTypeIcon" )
            .attr( "class", "glyphicon glyphicon-ok" );
        }
        // newObj.css( "background-image", "linear-gradient( to right, rgba(177, 235, 177, 0.3), rgba(70, 70, 70, 0.5))" );
        else if ( data.color === 3 )
        {
            newObj.find( "#sysMessageTypeIcon" )
            .attr( "class", "glyphicon glyphicon-warning-sign" );
        }
        // newObj.css( "background-image", "linear-gradient( to right, rgba(177, 177, 235, 0.3), rgba(70, 70, 70, 0.5))" );
*/

        controls.chatBoxInner
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
    else
    {
        var newObj = $( String.format(
                reguStreaming.chatFormatBase.def,
                reguStreaming.currentChatMessageCount,
                data.profileImage,
                currentTimeString
            ) )
            .appendTo( controls.chatBoxInner );

        newObj.data( "userID", data.userID );
        util.startCSSAnimation( "zoomInRight 0.3s", newObj );

        var childAvatar = newObj.children( )
            .eq( 0 );
        var childName = newObj.children( )
            .eq( 1 );

        childAvatar.on( "click", function( )
        {
            reguStreaming.userInfoContainerStatus( true, newObj );
        } );
        childName.on( "click", function( )
        {
            reguStreaming.userInfoContainerStatus( true, newObj );
        } );

        childName.text( data.name );

        newObj.children( )
            .eq( 3 )
            .html( data.message.replace( reguStreaming.linkRegex, "<a class='aRegu' onclick='return reguStreaming.confirmChatLink( this );' target='_blank' href='$1'>$1</a>" ) );

        if ( data.isAdmin )
        {
            newObj.css( "background-image", "linear-gradient(to right, rgba(65, 124, 127, 0.5), rgba(70, 70, 70, 0.5))" );
            childName.css( "text-shadow", "0px 0px 12px rgba( 91, 216, 222, 1 )" );
        }

        controls.chatBoxInner
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

    reguStreaming.currentChatMessageCount++;
} );

reguStreaming.confirmChatLink = function( self )
{
    self = $( self );

    util.showModal( "보안 경고", "'" + self.attr( "href" ) + "' 에 접속하시려고 합니다, 알 수 없는 사이트의 접속은 보안상의 위험이 있습니다.", "취소", "확인", null, function( )
    {
        window.open( self.attr( "href" ), self.attr( "target" ) );
    } );

    return false;
}
let anotherClientData = [ ];

// *TODO;
// under construction;
socket.on( "clientDataRefresh", function( data )
{
    switch ( data.command )
    {
        case "register":
            anotherClientData.push( data.data );
            break;
        case "update":
            // not working;
            anotherClientData[ data.index ] = data.newData;
            break;
    }
} );

socket.on( "RS.modal", function( data )
{
    util.showModal( data.title, data.message, data.cancelText || "닫기", null, null, null, true );
} );

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
} );

socket.on( "regu.clientCountUpdate", function( data )
{
    controls.currentRoomInformation.html( data.roomTitle + " 채널 : " + data.count + "명" );

    controls.currentRoomInformation.css( "opacity", "0" );
    controls.currentRoomInformation.animate(
    {
        opacity: "1"
    }, 1000 );
} );

socket.on( "disconnect", function( data )
{
    if ( reguStreaming.getConfig( "forceDisconnected", false ) ) return;

    if ( !reguStreaming.getActiveProcessBackground( ) )
        reguStreaming.setActiveProcessBackground( true, null, "서버와의 연결을 다시 시도하고 있습니다 ..." );

    console.log( "[ReguStreaming] ERROR: Connection to the server has been lost." );
} );

socket.on( "reconnect_attempt", function( attemptNumber )
{
    console.log( "[ReguStreaming] Reconnecting to server ... [" + attemptNumber + "]" );
} );

socket.on( "reconnect", function( attemptNumber )
{
    if ( reguStreaming.getActiveProcessBackground( ) )
        reguStreaming.setActiveProcessBackground( false );

    if ( reguStreaming.getConfig( "lastLoginSuccess", false ) )
        socket.emit( "RS.join" );

    util.notification( util.notificationType.success,
        "서버 연결 :",
        "서버에 다시 접속되었습니다.",
        2000,
        false
    );

    console.log( "[ReguStreaming] Reconnected!" );
} );

reguStreaming.providerType = {
    Null: -1,
    Youtube: 0,
    Ani24: 1,
    Tvple: 2,
    Direct: 3
};
reguStreaming.mediaProvider = reguStreaming.providerType.Null;

reguStreaming.getLocalStorageVolume = function( )
{
    return Number( localStorage.getItem( "regustreaming.audio_volume" ) || "0.2" );
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
    console.log( "RS.mediaPlay" );
    console.log( data );

    if ( data.empty )
    {
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

        controls.videoPositionFullBar.css( "width", "0%" );

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
        controls.videoPositionFullBar.css( "width", "100%" );
        controls.videoPositionBar.show( )
            .stop( )
            .animate(
            {
                opacity: "1"
            }, 1000 );

        // videoTitle
        if ( controls.videoTitle.is( ":visible" ) )
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
        else
            controls.videoTitle.text( data.mediaName )
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
                    } )
            }
            else
            {
                controls.videoRequesterProfileImage.attr( "src", data.user.avatar );
                controls.videoRequesterProfileName.text( data.user.name );

                controls.videoRequesterInformation.show( )
                    .stop( )
                    .animate(
                    {
                        opacity: "1"
                    }, 1000 )
                    .off( "click" )
                    .on( "click", function( )
                    {
                        reguStreaming.userInfoContainerStatus( true, data.user.userID );
                    } )
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

        util.htmlNotification( "현재 재생 중 : " + data.mediaName, true );

        controls.videoContainer.prop( "muted", false );
        controls.videoContainer.load( );

        var playAction = controls.videoContainer.get( 0 )
            .play( );

        playAction.then( function( )
            {
                controls.videoAutoPlayAgree.hide( );
            } )
            .catch( function( err )
            {
                controls.videoAutoPlayAgree.show( );
                controls.videoContainer.prop( "muted", true );
                controls.videoContainer.get( 0 )
                    .play( );
            } );

        controls.videoContainer.get( 0 )
            .currentTime = data.mediaPosition;

        controls.videoContainer.get( 0 )
            .playbackRate = reguStreaming.serverConfig.roomConfig.playbackRate || 1.0;
    }

    if ( !reguStreaming.canvasRendering )
    {
        reguStreaming.canvasRender( );
        reguStreaming.canvasRendering = true;
    }

    reguStreaming.cloudReset( );
    reguStreaming.captionReset( );

    reguStreaming.mediaProvider = data.mediaProvider;

    switch ( data.mediaProvider )
    {
        case reguStreaming.providerType.Youtube:
            reguStreaming.captionInitialize( );
            break;
        case reguStreaming.providerType.Tvple:
            reguStreaming.cloudInitialize( data.cloud );
            break;
        case "Soundcloud":
            // TODO;
            break;
        case "Baykoreans":
            // TODO;
            break;
        case "Dongyoungsang":
            // TODO;
            break;
    }
} );

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
} );

reguStreaming.setVolume = function( volume )
{
    controls.videoContainer.prop( "volume", volume / 100 );
    localStorage.setItem( "regustreaming.audio_volume", volume / 100 );
}

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
    return $( ".processBackground" )
        .is( ":visible" );
}

reguStreaming.setActiveProcessBackground = function( status, callback, text, noAnimate )
{
    var e = $( ".processBackground" );

    // e.stop( );

    if ( status )
    {
        e.find( ".processBackgroundText" )
            .text( text || "잠시만 기다려주세요!" );

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
    var element = controls.settingContainer;

    if ( status )
    {
        setStatusDialogBackground( true, function( )
        {
            element.css( "opacity", "1" );
            element.css( "animation", "fadeInUp 0.5s" );
            element.show( );
            element.animate(
            {
                opacity: "1"
            }, 500 );
        } );
    }
    else
    {
        setStatusDialogBackground( false, function( )
        {
            element.css( "animation", "fadeOutDown 0.5s" );
            element.css( "opacity", "1" );
            element.animate(
            {
                opacity: "0"
            }, 500, function( )
            {
                element.hide( );
            } );
        } );
    }
}

socket.on( "regu.receiveUserInfo", function( data )
{
    var e = controls.userInfoContainer;

    e.find( "#userInfoContainerProfileImage" )
        .attr( "src", data.avatar );
    e.find( "#userInfoContainerProfileName" )
        .text( data.name );
    e.find( "#userInfoContainerProfileIP" )
        .text( data.ipAddress );

    e.find( "#userInfoContainerProfileProvider" )
        .text( data.provider );

    var rankElement = e.find( "#userInfoContainerProfileRank" );

    switch ( data.rank )
    {
        case "admin":
            rankElement.text( "*관리자*" );
            rankElement.css( "color", "rgb( 235, 50, 50 )" )

            break;
        case "moderator":
            rankElement.text( "*모더레이터*" );
            rankElement.css( "color", "rgb( 235, 235, 50 )" )

            break;
        case "user":
            rankElement.text( "유저" );

            break;
        default:
            rankElement.text( "유저" );
            break;
    }

    setStatusDialogBackground( true, function( )
    {
        e.show( );
        util.startCSSAnimation( "zoomInUp 0.5s", e );
    } );
} );

var menuDisplayed = false;
var menuBox = null;

reguStreaming.clickedChatMessageTemp = null;

reguStreaming.onClickChatImage = function( self )
{
    self = $( self );

    var img = new Image( );
    img.src = self.attr( "src" );
    img.onload = function( )
    {
        var imgPopup = window.open( self.attr( "src" ), "_blank", "left=50, top=50, width=" + this.width + "; height=" + this.height + "" );

        if ( imgPopup === null )

            util.notification( util.notificationType.warning, "팝업 차단 감지 :", "이미지를 새 창에서 보시려면 팝업 차단을 해제해주세요." );
        else
        {
            imgPopup.onload = function( )
            {
                imgPopup.document.title = "이미지 새창에서 보기";
            }
        }
    }
}

reguStreaming.reportUser = function( )
{
    util.notification( util.notificationType.warning, "사용자 신고 불가 :", "이 사용자를 신고할 권한이 없습니다." );
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
                util.notification( util.notificationType.warning, "사용자 정보 없음", "이 사용자는 외부 서비스를 이용하고 있습니다, 정보를 불러올 수 없습니다." );
                return;
            }

            // if ( !reguStreaming.getActiveProcessBackground( ) )
            //     reguStreaming.setActiveProcessBackground( true );

            socket.emit( "regu.requestUserInfo",
            {
                userID: userID.toString( )
            } );
        }
        else
        {
            util.notification( util.notificationType.warning, "사용자 정보 오류 :", "알 수 없는 사용자입니다." );
        }
    }
    else
    {
        setStatusDialogBackground( false, function( )
        {
            util.startCSSAnimation( "zoomOutDown 0.5s", e, function( )
            {
                e.hide( );
            } );
        } );
    }
}

reguStreaming.queueSkipVote = function( )
{
    util.showModal( "투표 시작", "영상 스킵 투표를 시작하시겠습니까? 65% 이상 찬성하면 영상이 스킵됩니다.", "취소", "투표 시작", null, function( )
    {
        socket.emit( "regu.voteRegister" );
    } );
}

reguStreaming.voteSend = function( flag )
{
    socket.emit( "regu.voteStackFlag",
    {
        flag: flag
    } );
}

reguStreaming.queueContainerStatus = function( status )
{
    if ( status && reguStreaming.serverConfig.roomConfig.disallow_queue_request )
    {
        util.notification( util.notificationType.warning, "영상 추가 불가", "이 채널에서는 영상 추가를 하실 수 없습니다.", 1500 );
        return;
    }

    var e = controls.queueRegisterContainer;

    if ( status )
    {
        setStatusDialogBackground( true, function( )
        {
            e.show( );
            util.startCSSAnimation( "zoomInUp 0.5s", e );
        } );
    }
    else
    {
        // setStatusDialogBackground( false );
        if ( reguStreaming.getActiveProcessBackground( ) )
            reguStreaming.setActiveProcessBackground( false );

        setStatusDialogBackground( false, function( )
        {
            util.startCSSAnimation( "zoomOutDown 0.5s", e, function( )
            {
                e.hide( );
            } );
        } );
    }
}

function setStatusDialogBackground( status, callback )
{
    var e = $( ".dialogBackground" );

    if ( status )
    {
        e.show( );
        e.css( "opacity", "0" );
        e.animate(
        {
            opacity: "1"
        }, 500 );

        if ( callback )
            callback( );
    }
    else
    {
        e.css( "opacity", "1" );
        e.animate(
        {
            opacity: "0"
        }, 500, function( )
        {
            $( this )
                .hide( );
        } )

        if ( callback )
            callback( );
    }
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
                reguStreaming.setActiveProcessBackground( true, null, "대기열에 추가하고 있습니다!" );

            socket.emit( "regu.queueRegister",
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

reguStreaming.localConfig = {};
reguStreaming.serverConfig = {
    roomConfig:
    {}
};
reguStreaming.onLocalConfigChanged = function( configName, value ) {

}

reguStreaming.initialize = function( )
{
    var roomConfig = reguStreaming.serverConfig.roomConfig;

    if ( roomConfig.disallow_queue_request )
        controls.queueRegisterButton.hide( );
    else
        controls.queueRegisterButton.show( );

    if ( roomConfig.video_position_bar_color )
        controls.videoPositionBar.css( "background-color", roomConfig.video_position_bar_color );

    if ( roomConfig.video_position_bar_full_color )
    {
        controls.videoPositionFullBar.css( "background-color", roomConfig.video_position_bar_full_color );
        controls.videoPositionFullBar.css( "box-shadow", "0px 0px 16px " + roomConfig.video_position_bar_full_color );
    }
}

reguStreaming.settingButtonClicked = function( )
{
    this.settingContainerStatus( true );
}

reguStreaming.registerTimer = function( )
{
    setInterval( function( )
    {
        if ( !socket.connected ) return;

        socket.emit( "RS.requestClientCount" );
    }, 30 * 1000 );
}

socket.on( "regu.client.configChanged", function( data )
{
    reguStreaming.localConfig[ data.configName ] = data.configValue;
    reguStreaming.onLocalConfigChanged( data.configName, data.configValue );
} );

socket.on( "regu.initialize", function( data )
{
    reguStreaming.serverConfig = data ||
    {
        roomConfig:
        {}
    };

    reguStreaming.initialize( );
} );

socket.on( "regu.voteStackFlagReceive", function( data )
{
    if ( data.success )
    {
        util.startCSSAnimation( "zoomOut 1s", controls.voteContainer );
        controls.voteContainer.css( "opacity", "1" );
        controls.voteContainer.animate(
        {
            opacity: "0"
        }, 1000, function( )
        {
            $( this )
                .hide( );
        } );
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

socket.on( "regu.voteRegisterReceive", function( data )
{
    if ( data.success )
    {
        util.notification( util.notificationType.info,
            "투표 요청 완료 :",
            "투표가 요청되었습니다, 65% 이상 찬성하면 영상이 스킵됩니다.",
            2000,
            true
        );
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

socket.on( "regu.executeReguNamespaceJavascript", function( data )
{
    var func = reguStreaming[ data.method ];

    if ( typeof func === "function" )
        func( );
} );

socket.on( "regu.executeJavascript", function( data )
{
    try
    {
        eval( data );
    }
    catch ( exception )
    {
        console.log( "[ReguStreaming] Failed to execute clientside Javascript! " + exception );
    }
} );

socket.on( "regu.voteEvent", function( data )
{
    if ( data.type === "register" )
    {
        reguStreaming.voteData = data;

        util.htmlNotification( "영상 스킵 투표가 시작되었습니다, 응답해주세요.", true );

        controls.voteContainerStartUser.text( data.startUserName + "님이 투표를 시작하셨습니다." );

        util.startCSSAnimation( "zoomInDown 1s", controls.voteContainer );
        controls.voteContainer.show( );
        controls.voteContainer.css( "opacity", "0" );
        controls.voteContainer.animate(
        {
            opacity: "1"
        }, 1000 );

        if ( reguStreaming.voteInterval )
            clearInterval( reguStreaming.voteInterval );

        reguStreaming.voteInterval = setInterval( function( )
        {
            if ( !reguStreaming.voteData ) return;

            controls.voteContainerTime.text( --reguStreaming.voteData.endTime + "초 남았습니다." );
        }, 1000 );
    }
    else if ( data.type === "finish" )
    {
        if ( controls.voteContainer.is( ":visible" ) )
        {
            util.startCSSAnimation( "zoomOut 1s", controls.voteContainer );
            controls.voteContainer.css( "opacity", "1" );
            controls.voteContainer.animate(
            {
                opacity: "0"
            }, 1000, function( )
            {
                $( this )
                    .hide( );
            } );
        }

        if ( reguStreaming.voteInterval )
            clearInterval( reguStreaming.voteInterval );

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