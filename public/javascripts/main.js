/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

reguStreaming.controlInitialized = false;
let controls = {
    roomList: null,
    roomListContainer: null,
    roomListContainerLoginRequired: null,

    loginWithContainer: null,

    headerLoginInformationContainer: null,
    headerLoginInformationContainerProfileImage: null,
    headerLoginInformationContainerProfileName: null,
    headerLoginInformationContainerProfileProvider: null,
    logoutButton: null,

    serviceNotificationContainer: null,
    serviceStatusIcon: null,
    serviceStatusProblem: null,
    discordRecommendModal: null
};

reguStreaming.discordRecommendModalContainerStatus = function( status )
{
    var e = controls.discordRecommendModal;

    if ( status )
    {
        e.show( );
        util.startCSSAnimation( "zoomInUp 0.5s", e );
    }
    else
    {
        util.startCSSAnimation( "zoomOutDown 0.5s", e, function( )
        {
            e.hide( );
        } );

        $.ajax(
        {
            url: "/api/discordRecommend",
            type: "post"
        } );
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

reguStreaming.processMainQueryString = function( )
{
    var queryList = util.getQueryObject( );

    if ( queryList.hasOwnProperty( "roomIDError" ) )
    {
        util.showModal( "채널 오류", "올바르지 않은 채널입니다.", "닫기", null, null, null, true );
        util.removeAllQueryParameters( );
    }

    if ( queryList.hasOwnProperty( "error" ) )
    {
        util.showModal( "접속 불가", decodeURIComponent( queryList[ "error" ] ), "닫기", null, null, null, true );
        util.removeAllQueryParameters( );
    }

    if ( queryList.hasOwnProperty( "permissionError" ) )
    {
        util.showModal( "접근 거부", "접근 권한이 없습니다.", "닫기", null, null, null, true );
        util.removeAllQueryParameters( );
    }
}

window.onload = function( )
{
    reguStreaming.defineControls( );
    reguStreaming.AjaxLoginStatus( );
    reguStreaming.AjaxServiceStatus( );
    reguStreaming.processMainQueryString( );

    // if ( util.getCookieByName( "discordRecommend" ) === "1" )


    if ( util.getQueryByName( "loginRequired" ) != null )
    {
        util.showModal( "로그인 필요", "로그인이 필요한 서비스입니다.", "닫기", null, null, null, true );
        util.removeAllQueryParameters( );
    }

    if ( util.getQueryByName( "forceDisconnect" ) != null )
    {
        var reason = localStorage.getItem( "regustreaming.forceDisconnectReason" );

        localStorage.removeItem( "regustreaming.forceDisconnectReason" );

        util.showModal( "서비스 안내", reason, "닫기", null, null, null, true );
        util.removeAllQueryParameters( );
    }

    if ( util.getQueryByName( "banDataError" ) != null )
    {
        util.showModal( "데이터 오류", "서비스 정지된 계정이 아닙니다.", "닫기", null, null, null, true );
        util.removeAllQueryParameters( );
    }

    if ( util.getQueryByName( "banInfo" ) != null )
    {
        util.showModal( "서비스 정지", "죄송합니다, 귀하는 '" + util.getQueryByName( "banInfo" ) + "' 으로 인해 서비스가 영구적으로 정지되었습니다.", "닫기", null, null, null, true );
        util.removeAllQueryParameters( );
    }

    if ( util.getQueryByName( "banned" ) != null )
    {
        util.notification( util.notificationType.danger, "접속 불가", "귀하의 계정에 서비스 약관 위반 내역이 있습니다. 그 결과로 계정이 정지되었으며 더 이상 서비스를 이용할 수 없습니다. <br />자세한 정보는 다음 <a class='aRegu' target='_blank' href='https://regustreaming.oa.to/ban/" + util.getQueryByName( "id" ) + "'>페이지</a>를 참고하세요.", 0 );
        util.removeAllQueryParameters( );
    }

    controls.roomListContainer.css( "opacity", "0" )
        .show( )
        .animate(
        {
            opacity: "1"
        }, 1000 );

    controls.serviceStatusIcon.on( "click", function( e )
    {
        e.stopPropagation( );
    } );

    controls.serviceNotificationContainer.on( "click", function( e )
    {
        e.stopPropagation( );
    } );

    controls.serviceStatusProblem.on( "click", function( e )
    {
        e.stopPropagation( );
    } );


    if ( util.isIE( ) || util.isEdge( ) )
    {
        util.notification( util.notificationType.warning, "호환성 알림 :", "이 사이트는 해당 브라우저에서 테스트되지 않았습니다<br />버그 발견 시 즉시 신고해주세요.", 0 );
    }

    reguStreaming.documentLoaded = true;

    setInterval( function( )
    {
        reguStreaming.AjaxServiceStatus( );
    }, 60 * 1000 );

    setInterval( function( )
    {
        reguStreaming.AjaxOnlyRoom( );
    }, 30 * 1000 );

    reguStreaming.afterLoad( );
}

// <p class="roomChildTitleSmall"> \
// 			채널 \
// 		</p> \
// <button type="button" class="btn btn-blue" id="roomChildConnectButton" onclick="connectToServer( {5} );">접속</button> \
const roomChildHTML = '<div class="roomChild hvr-float" id="roomChild_{0}" onclick="reguStreaming.connectToServer( {1} );"> \
				<p class="roomChildTitle">{2}</p> \
                <p class="roomChildDesc">{3}</p> \
                <p class="roomChildCurrentPlaying">{4}</p> \
				<p class="roomChildCount">{5}/{6}</p> \
			</div>';
reguStreaming.roomCount = 0;

reguStreaming.connectToServer = function( roomID )
{
    window.location = "/?room=" + roomID;
}

reguStreaming.initializeRoom = function( rooms )
{
    var waitInitialize = setInterval( function( )
    {
        if ( reguStreaming.controlInitialized )
        {
            var keys = Object.keys( rooms );
            var keysLength = keys.length;

            controls.roomList.empty( );

            for ( var i = 0; i < keysLength; i++ )
            {
                var roomData = rooms[ keys[ i ] ];

                var newObj = $( String.format(
                        roomChildHTML,
                        reguStreaming.roomCount++,
                        "'" + roomData.roomID + "'",
                        roomData.title,
                        roomData.desc,
                        roomData.currentPlaying ? ( "재생 중 : " + roomData.currentPlaying ) : "재생 중인 영상이 없습니다.",
                        roomData.count,
                        roomData.maxConnectable
                    ) )
                    .appendTo( controls.roomList )

                newObj.css( "opacity", "0" );

                setTimeout( function( obj )
                {
                    util.startCSSAnimation( "flipInX 1s", obj );
                    obj.css( "opacity", "1" );
                }, 100 + ( 150 * i ), newObj );
            }

            if ( reguStreaming.isAuthenticated )
            {
                if ( controls.roomListContainerLoginRequired.is( ":visible" ) )
                {
                    controls.roomListContainerLoginRequired.stop( )
                        .animate(
                        {
                            opacity: "0"
                        }, 1000, function( )
                        {
                            $( this )
                                .hide( );
                        } );
                }

                controls.roomList.css( "filter", "" );
                controls.roomList.css( "-webkit-filter", "" );
            }
            else
            {
                if ( !controls.roomListContainerLoginRequired.is( ":visible" ) )
                {
                    controls.roomListContainerLoginRequired.show( )
                        .stop( )
                        .animate(
                        {
                            opacity: "1"
                        }, 1000 );
                }

                controls.roomList.css( "filter", "blur( 2px )" );
                controls.roomList.css( "-webkit-filter", "blur( 2px )" );
            }

            clearInterval( waitInitialize );
        }
    }, 100 );
}

reguStreaming.AjaxServiceStatus = function( )
{
    $.ajax(
    {
        url: "/api/serviceStatus",
        type: "get",
        dataType: "json",
        success: function( data )
        {
            reguStreaming.setConfig( "serviceNotification", data.notification );

            if ( data.serviceStatus === 1 )
            {
                if ( !controls.serviceStatusProblem.is( ":visible" ) )
                {
                    controls.serviceStatusProblem.show( );
                    util.startCSSAnimation( "slideInDown 0.5s", controls.serviceStatusProblem );
                }
            }
            else
            if ( controls.serviceStatusProblem.is( ":visible" ) )
                controls.serviceStatusProblem.hide( );

            controls.serviceNotificationContainer.empty( );

            if ( data.notification.length !== 0 )
                reguStreaming.buildServiceNotification( data.notification );
        }
    } );
}

const serviceNotificationChildHTML = '<div class="serviceNotificationItem" id="serviceNotificationItem_{0}" );"> \
				<p class="serviceNotificationItemTitle">{1}</p> \
                <p class="serviceNotificationItemMessage">{2}</p> \
            </div>';

reguStreaming.buildServiceNotification = function( data )
{
    var length = data.length;
    var typeHighest = 0;

    for ( var i = 0; i < length; i++ )
    {
        var newObj = $( String.format(
                serviceNotificationChildHTML,
                0,
                data[ i ].title,
                data[ i ].message
            ) )
            .appendTo( controls.serviceNotificationContainer );

        if ( data[ i ].type > typeHighest )
            typeHighest = data[ i ].type;

        switch ( data[ i ].type )
        {
            case 0:
                newObj.find( ".serviceNotificationItemTitle" )
                    .css( "background-color", "rgb( 56, 110, 156 )" );
                break;
            case 1:
                newObj.find( ".serviceNotificationItemTitle" )
                    .css( "background-color", "rgb( 255, 141, 58 )" );
                break;
            case 2:
                newObj.find( ".serviceNotificationItemTitle" )
                    .css( "background-color", "rgb( 202, 64, 61 )" );
                break;
        }
    }

    // ServiceManager.notificationType = {
    //     info: 0,
    //     warning: 1,
    //     danger: 2
    // };

    switch ( typeHighest )
    {
        case 0:
            controls.serviceStatusIcon.attr( "src", "images/service/info.png" );
            controls.serviceStatusIcon.css( "animation", "serviceStatusIconInfoAnimate 1s infinite" );
            break;
        case 1:
            controls.serviceStatusIcon.attr( "src", "images/service/warning.png" );
            controls.serviceStatusIcon.css( "animation", "serviceStatusIconWarningAnimate 1s infinite" );
            break;
        case 2:
            controls.serviceStatusIcon.attr( "src", "images/service/danger.png" );
            controls.serviceStatusIcon.css( "animation", "serviceStatusIconDangerAnimate 1s infinite" );
            break;
    }

    controls.serviceStatusIcon.show( )
        .css( "opacity", "0" )
        .animate(
        {
            "opacity": "1"
        }, 1000 );
}

reguStreaming.toggleServiceNotificationStatus = function( )
{
    var e = controls.serviceNotificationContainer;

    if ( !e.is( ":visible" ) )
    {
        e.show( );
        util.startCSSAnimation( "serviceNotificationContainerBounceInDown 0.5s", e );

        if ( controls.serviceStatusIcon.css( "animation" ) !== "" )
            controls.serviceStatusIcon.css( "animation", "" );

        $( "body" )
            .one( "click", function( )
            {
                if ( e.is( ":visible" ) )
                    reguStreaming.toggleServiceNotificationStatus( );
            } );
    }
    else
    {
        util.startCSSAnimation( "serviceNotificationContainerBounceOutUp 0.5s", e, function( )
        {
            e.hide( );
        } );
    }
}

reguStreaming.AjaxLoginStatus = function( )
{
    $.ajax(
    {
        url: "/api/main",
        type: "get",
        dataType: "json",
        success: function( data )
        {
            reguStreaming.accountInformation = data;
            reguStreaming.isAuthenticated = data.isAuthenticated;

            if ( data.isAuthenticated )
            {
                if ( controls.roomListContainerLoginRequired.is( ":visible" ) )
                {
                    controls.roomListContainerLoginRequired.stop( )
                        .animate(
                        {
                            opacity: "0"
                        }, 1000, function( )
                        {
                            $( this )
                                .hide( );
                        } );
                }

                controls.roomList.css( "filter", "" );
                controls.roomList.css( "-webkit-filter", "" );
            }
            else
            {
                if ( !controls.roomListContainerLoginRequired.is( ":visible" ) )
                {
                    controls.roomListContainerLoginRequired.show( )
                        .stop( )
                        .animate(
                        {
                            opacity: "1"
                        }, 1000 );
                }

                controls.roomList.css( "filter", "blur( 2px )" );
                controls.roomList.css( "-webkit-filter", "blur( 2px )" );
            }

            if ( data.isAuthenticated )
            {
                if ( controls.loginWithContainer.is( ":visible" ) )
                    controls.loginWithContainer.hide( );

                if ( !controls.headerLoginInformationContainer.is( ":visible" ) )
                {
                    controls.headerLoginInformationContainer.show( );
                }
                // controls.headerLoginInformationContainer.css( "opacity", "0" )
                //     .animate(
                //     {
                //         opacity: "1"
                //     }, 1000 );

                controls.logoutButton.show( );

                controls.headerLoginInformationContainerProfileImage.attr( "src", data.avatar );
                controls.headerLoginInformationContainerProfileName.text( data.name );

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
                        provider = "인스타그램";
                        break;
                    case "facebook":
                        provider = "페이스북";
                        break;
                    case "guest":
                        provider = "손님";
                        break;
                }

                controls.headerLoginInformationContainerProfileProvider.text( provider + " 계정" );
            }
            else
            {
                if ( !controls.loginWithContainer.is( ":visible" ) )
                    controls.loginWithContainer.show( );

                if ( controls.headerLoginInformationContainer.is( ":visible" ) )
                {
                    controls.headerLoginInformationContainer.hide( );
                    // controls.headerLoginInformationContainer.css( "opacity", "1" )
                    //     .animate(
                    //     {
                    //         opacity: "0"
                    //     }, 1000, function( )
                    //     {
                    //         $( this )
                    //             .hide( );
                    //     } );
                }

                controls.logoutButton.hide( );
            }

            reguStreaming.initializeRoom( data.room );
        },
        error: function( err )
        {
            if ( controls.loginWithContainer.is( ":visible" ) )
                controls.loginWithContainer.hide( );

            controls.headerLoginInformationContainer.hide( );
            controls.logoutButton.hide( );
        }
    } );
}

reguStreaming.AjaxOnlyRoom = function( )
{
    $.ajax(
    {
        url: "/api/room",
        type: "get",
        dataType: "json",
        success: function( data )
        {
            reguStreaming.initializeRoom( data );
        },
        error: function( err )
        {
            if ( !controls.roomListContainerLoginRequired.is( ":visible" ) )
            {
                controls.roomListContainerLoginRequired.show( )
                    .stop( )
                    .animate(
                    {
                        opacity: "1"
                    }, 1000 );
            }
        }
    } );
}

reguStreaming.login = function( type )
{
    if ( type === "guest" )
    {
        util.showModal( "로그인 경고", "손님 계정으로 로그인하시겠습니까? 소셜 계정을 연동하지 않으면 서비스가 제한될 수 있습니다.", "손님 계정으로 로그인", "소셜 계정으로 로그인", function( )
        {
            window.location = "/login/" + type;
        } );

        return;
    }
    else if ( type === "naver" )
    {
        util.notification( util.notificationType.warning,
            "로그인 불가 :",
            "현재 네이버 계정을 통한 로그인은 지원하지 않습니다.",
            2000,
            true
        );

        return;
    }

    window.location = "/login/" + type;
}

reguStreaming.logout = function( )
{
    util.showModal( "로그아웃", "레그 스트리밍에서 로그아웃하시겠습니까? 다시 로그인하기 전까지 서비스가 제한됩니다.", "취소", "로그아웃", null, function( )
    {
        window.location = "/logout";
    } );
}

reguStreaming.accountInformation = {};
reguStreaming.localConfig = {};
reguStreaming.serverConfig = {};
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
    {
        var color = roomConfig.video_position_bar_color;

        controls.videoPositionBar.css( "background-color", "rgba( " + color.r + ", " + color.g + ", " + color.b + ", 0.2 )" );
        controls.videoPositionFullBar.css( "background-color", "rgba( " + color.r + ", " + color.g + ", " + color.b + ", 0.7 )" );
        controls.videoPositionFullBar.css( "box-shadow", "0px 0px 16px rgba( " + color.r + ", " + color.g + ", " + color.b + ", 0.7 )" );
    }
}

reguStreaming.settingButtonClicked = function( )
{
    this.settingContainerStatus( true );
}

reguStreaming.onLoginSuccess = function( success )
{
    if ( success )
    {
        if ( Notification.permission !== Notification.permission.granted )
            Notification.requestPermission( );

        //     elements.videoContainer.attr( "src", "/media/" + data.roomID );

        // controls.footer.css( "opacity", "1" )
        //     .stop( )
        //     .animate(
        //     {
        //         opacity: "0"
        //     }, 1000, function( )
        //     {
        //         $( this )
        //             .hide( );
        //     } );
        // controls.roomListContainer.css( "opacity", "1" )
        //     .stop( )
        //     .animate(
        //     {
        //         opacity: "0"
        //     }, 1000, function( )
        //     {
        //         $( this )
        //             .hide( );
        //     } );


        // controls.header.css( "opacity", "1" )
        //     .animate(
        //     {
        //         opacity: "0"
        //     }, 1000, function( )
        //     {
        //         socket.emit( "regu.mediaRequest" )

        //         $( this )
        //             .hide( );

        //         if ( data.queuePlaying )
        //         {
        //             elements.videoContainer.css( "opacity", "0" )
        //                 .show( )
        //                 .stop( )
        //                 .animate(
        //                 {
        //                     opacity: "1"
        //                 }, 1000 );
        //         }

        //         controls.innerHeader.css( "opacity", "0" )
        //             .show( )
        //             .stop( )
        //             .animate(
        //             {
        //                 opacity: "1"
        //             }, 1000 );

        //         controls.chatContainer.css( "opacity", "0" )
        //             .show( )
        //             .stop( )
        //             .animate(
        //             {
        //                 opacity: "1"
        //             }, 1000 );

        //         controls.queueContainer.css( "opacity", "0" )
        //             .show( )
        //             .stop( )
        //             .animate(
        //             {
        //                 opacity: "1"
        //             }, 1000 );


        //         $( "#footerTitle" )
        //             .css( "animation", "footerTitleFadeOut 1s" );
        //         $( "#footerTitle" )
        //             .animate(
        //             {
        //                 opacity: "0"
        //             }, 1000, function( )
        //             {
        //                 $( this )
        //                     .hide( );
        //             } );

        //     } );

        // $( window )
        //     .on( "beforeunload", function( e )
        //     {
        //         e = e || window.event;

        //         if ( e )
        //             e.returnValue = "레그 스트리밍에서 접속을 종료하시겠습니까?";

        //         return "레그 스트리밍에서 접속을 종료하시겠습니까?";
        //     } );
    }
}

/*
if ( getParameterByName( "mode" ) === "1" )
{
    console.log( "CLIENT 1 MODE" );

    var peer = new Peer( "client_1",
    {
        host: "regustreaming.oa.to",
        port: 443,
        path: "/peerjs",
        secure: true
    } );

    peer.on( "open", function( id )
    {
        console.log( "peer opened : " + id )
    } )

    peer.on( "connection", function( dataConnection )
    {
        console.log( "peer conn" )
        console.log( dataConnection );

        dataConnection.on( "open", function( )
        {
            console.log( 'OPEN' );
        } );

        dataConnection.on( "data", function( data )
        {
            console.log( 'Received', data );
        } );
    } )
}
else
{
    console.log( "CLIENT 0 MODE" );

    var peer = new Peer( "client_0",
    {
        host: "regustreaming.oa.to",
        port: 443,
        path: "/peerjs",
        secure: true
    } );

    peer.on( "open", function( id )
    {
        console.log( "peer opened : " + id )
    } )

    var dataConnection = peer.connect( "client_1" );

    peer.on( "connection", function( conn )
    {
        console.log( "peer conn" )

        setInterval( function( )
        {
            conn.send( "test" );
        }, 500 );

    } )


}


// var peer = new Peer( "master",
// {
//     host: "regustreaming.oa.to",
//     port: 443,
//     path: "/peerjs",
//     secure: true
// } );


function startVoiceRecord( )
{
    navigator.getUserMedia(
    {
        audio: true,
        video: true
    }, gotStream, function( err )
    {
        console.log( err );
    } );

    // ss( socket )
    //     .emit( 'voice', stream,
    //     {
    //         wow: "wow"
    //     } );
}


function gotStream( mediaStream )
{
    var mediaRecorder = new MediaRecorder( mediaStream );
    mediaRecorder.onstart = function( e )
    {
        console.log( "onstart", e )
        this.chunks = [ ];
    };
    mediaRecorder.ondataavailable = function( e )
    {
        this.chunks.push( e.data );

        console.log( "ondataavailable", this.chunks );

        var blob = new Blob( this.chunks,
        {
            'type': 'audio/ogg; codecs=opus'
        } );
        socket.emit( 'radio', blob );

        this.chunks = [ ];
    };
    mediaRecorder.onstop = function( e )
    {
        console.log( mediaRecorder.chunks );
    };

    mediaRecorder.start( );

    setInterval( function( )
    {
        mediaRecorder.requestData( )
    }, 5000 );

    //     mediaRecorder.start( );

    //     setTimeout( function( )
    //     {
    //         mediaRecorder.stop( );
    //     }, 1000 );
    // };

    // Start recording
    // mediaRecorder.start( );

    // Stop recording after 5 seconds and broadcast it to server
    // setTimeout( function( )
    // {
    //     mediaRecorder.stop( );
    // }, 1000 );
    // socket.emit( "voiceStart",  );
}


socket.on( 'voice', function( arrayBuffer )
{
    var blob = new Blob( [ arrayBuffer ],
    {
        'type': 'audio/ogg; codecs=opus'
    } );
    // var audio = document.createElement( 'audio' );
    // audio.src = window.URL.createObjectURL( blob );
    // audio.play( );

    var vid1 = $( "#musicVideo" );
    vid1.show( );
    vid1.css( "opacity", 1 );

    vid1.get( 0 )
        .src = URL.createObjectURL( blob );

    // if ( vid1.get( 0 )
    //     .paused )
    vid1.get( 0 )
        .play( );
} );

// socket.on( "voiceRec", function( stream )
// {
//     console.log( data );
//     var vid1 = $( "#musicVideo" );

//     console.log( );

//     vid1.on( "loadedmetadata", function( e )
//     {
//         vid1.get( 0 )
//             .play( );
//         console.log( "loaded" );
//     } );

//     vid1.show( );
//     vid1.css( "opacity", 1 );

//     vid1.get( 0 )
//         .src = data;
// } );*/