/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

reguStreaming.controlInitialized = false;
let controls = {
    roomListContainer: null,
    roomListContainerList: null,
    roomListContainerLoginRequired: null,

    headerLogin: null,
    headerLoginGuestText: null,

    headerLoginInformation: null,
    headerLoginInformationProfileName: null,
    headerLoginInformationProfileImage: null,
    headerLoginInformationProfileProvider: null,
    headerLoginInformationLogout: null,

    headerServiceNotification: null,
    headerServiceStatus: null,
    headerServiceStatusFloating: null,
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

        return;
    }

    if ( queryList.hasOwnProperty( "loginNotAllowed" ) )
    {
        util.showModal( "로그인 불가", "현재 이 서비스를 통한 로그인이 사용 가능하지 않습니다.", "닫기", null, null, null, true );
        util.removeAllQueryParameters( );

        return;
    }

    if ( queryList.hasOwnProperty( "loginFailed" ) )
    {
        util.showModal( "로그인 오류", "로그인에 실패했습니다, 나중에 다시 시도하세요.", "닫기", null, null, null, true );
        util.removeAllQueryParameters( );

        return;
    }

    if ( queryList.hasOwnProperty( "loginFailedService" ) )
    {
        util.showModal( "로그인 오류", "서비스 오류로 인해 로그인에 실패했습니다, 나중에 다시 시도하세요.", "닫기", null, null, null, true );
        util.removeAllQueryParameters( );

        return;
    }

    if ( queryList.hasOwnProperty( "error" ) )
    {
        util.showModal( "접속 불가", decodeURIComponent( queryList[ "error" ] ), "닫기", null, null, null, true );
        util.removeAllQueryParameters( );

        return;
    }

    if ( queryList.hasOwnProperty( "permissionError" ) )
    {
        util.showModal( "접근 거부", "접근 권한이 없습니다.", "닫기", null, null, null, true );
        util.removeAllQueryParameters( );

        return;
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

    controls.headerServiceStatus.on( "click", function( e )
    {
        e.stopPropagation( );
    } );

    controls.headerServiceNotification.on( "click", function( e )
    {
        e.stopPropagation( );
    } );

    controls.headerServiceStatusFloating.on( "click", function( e )
    {
        e.stopPropagation( );
    } );


    if ( util.isIE( ) )
    {
        util.notification( util.notificationType.warning, "호환성 알림 :", "해당 브라우저에서 호환성 문제가 확인되었습니다, 다른 브라우저로 이용해주세요.", 0 );
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

            controls.roomListContainerList.empty( );

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
                    .appendTo( controls.roomListContainerList )

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

                controls.roomListContainerList.css( "filter", "" );
                controls.roomListContainerList.css( "-webkit-filter", "" );
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

                controls.roomListContainerList.css( "filter", "blur( 2px )" );
                controls.roomListContainerList.css( "-webkit-filter", "blur( 2px )" );
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
                if ( !controls.headerServiceStatusFloating.is( ":visible" ) )
                {
                    controls.headerServiceStatusFloating.show( );
                    util.startCSSAnimation( "slideInDown 0.5s", controls.headerServiceStatusFloating );
                }
            }
            else
            {
                if ( controls.headerServiceStatusFloating.is( ":visible" ) )
                    controls.headerServiceStatusFloating.hide( );
            }

            var showingCount = 0;

            $( ".header-login-button" )
                .each( function( index, self )
                {
                    self = $( self );

                    var provider = self.attr( "data-provider" );

                    if ( provider && data.loginDisallowList.indexOf( provider ) === -1 )
                    {
                        if ( !self.is( ":visible" ) )
                            self.show( );

                        self.on( "click", function( )
                        {
                            reguStreaming.login( provider );
                        } );

                        showingCount++;
                    }
                    else
                        self.hide( );
                } );

            if ( showingCount <= 1 )
            {
                if ( controls.headerLoginGuestText.is( ":visible" ) )
                    controls.headerLoginGuestText.hide( );
            }
            else
            {
                if ( !controls.headerLoginGuestText.is( ":visible" ) )
                    controls.headerLoginGuestText.show( );
            }

            controls.headerServiceNotification.empty( );

            if ( data.notification.length !== 0 )
                reguStreaming.buildServiceNotification( data.notification );
        }
    } );
}

const serviceNotificationChildHTML = '<div class="header-serviceNotification-item" id="serviceNotificationItem_{0}" );"> \
				<p class="header-serviceNotification-item-title">{1}</p> \
                <p class="header-serviceNotification-item-message">{2}</p> \
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
            .appendTo( controls.headerServiceNotification );

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

        newObj.find( ".header-serviceNotification-item-title" )
            .css( "background-color", color );
    }

    // ServiceManager.notificationType = {
    //     info: 0,
    //     warning: 1,
    //     danger: 2
    // };

    switch ( typeHighest )
    {
        case 0:
            controls.headerServiceStatus.attr( "src", "images/service/info.png" );
            controls.headerServiceStatus.css( "animation", "headerServiceStatusInfo 1s infinite" );
            break;
        case 1:
            controls.headerServiceStatus.attr( "src", "images/service/warning.png" );
            controls.headerServiceStatus.css( "animation", "headerServiceStatusWarning 1s infinite" );
            break;
        case 2:
            controls.headerServiceStatus.attr( "src", "images/service/danger.png" );
            controls.headerServiceStatus.css( "animation", "headerServiceStatusDanger 1s infinite" );
            break;
    }

    controls.headerServiceStatus.show( )
        .css( "opacity", "0" )
        .animate(
        {
            "opacity": "1"
        }, 1000 );
}

reguStreaming.toggleServiceNotificationStatus = function( )
{
    var e = controls.headerServiceNotification;

    if ( !e.is( ":visible" ) )
    {
        e.show( );
        util.startCSSAnimation( "serviceNotificationFadeIn 0.5s", e );

        if ( controls.headerServiceStatus.css( "animation" ) !== "" )
            controls.headerServiceStatus.css( "animation", "" );

        $( "body" )
            .one( "click", function( )
            {
                if ( e.is( ":visible" ) )
                    reguStreaming.toggleServiceNotificationStatus( );
            } );
    }
    else
    {
        util.startCSSAnimation( "serviceNotificationFadeOut 0.5s", e, function( )
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
            reguStreaming.isAuthenticated = true; // data.isAuthenticated;

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

                controls.roomListContainerList.css( "filter", "" );
                controls.roomListContainerList.css( "-webkit-filter", "" );
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

                controls.roomListContainerList.css( "filter", "blur( 2px )" );
                controls.roomListContainerList.css( "-webkit-filter", "blur( 2px )" );
            }

            if ( data.isAuthenticated )
            {
                if ( controls.headerLogin.is( ":visible" ) )
                    controls.headerLogin.hide( );

                if ( !controls.headerLoginInformation.is( ":visible" ) )
                    controls.headerLoginInformation.show( )
                    .animate(
                    {
                        opacity: "1"
                    }, 500 );

                controls.headerLoginInformationLogout.show( );

                controls.headerLoginInformationProfileImage.attr( "src", data.avatar );
                controls.headerLoginInformationProfileName.text( data.name );

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

                controls.headerLoginInformationProfileProvider.text( provider + " 계정" );
            }
            else
            {
                if ( !controls.headerLogin.is( ":visible" ) )
                {
                    controls.headerLogin
                        .show( )
                        .animate(
                        {
                            opacity: "1"
                        }, 500 );
                }

                if ( controls.headerLoginInformation.is( ":visible" ) )
                    controls.headerLoginInformation.hide( );

                controls.headerLoginInformationLogout.hide( );
            }

            reguStreaming.initializeRoom( data.room );
        },
        error: function( err )
        {
            if ( controls.headerLogin.is( ":visible" ) )
                controls.headerLogin.hide( );

            controls.headerLoginInformation.hide( );
            controls.headerLoginInformationLogout.hide( );
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

onRecaptcha = function( key )
{
    $.ajax(
    {
        url: "/login/guest",
        type: "post",
        data:
        {
            key: key
        },
        success: function( data )
        {
            if ( data === "success" )
                window.location.reload( );
            else
                window.location = "/?" + data;
        },
        error: function( err )
        {
            util.notification( util.notificationType.error, "reCAPTCHA 오류", "알 수 없는 reCAPTCHA 오류가 발생했습니다.", 4000 );
        }
    } );
}

reguStreaming.login = function( type )
{
    if ( type === "guest" )
    {
        $( ".modal-recaptcha" )
            .show( ); // *TODO: 추후 문제가 될 수 있음, modal onClosed 후 hide 하는 함수 실행 고려바람.

        util.showModal( "로그인 경고", "손님 계정으로 로그인하시겠습니까? 소셜 계정을 연동하지 않으면 서비스가 제한될 수 있습니다, 손님 계정으로 로그인 하시려면 아래 reCAPTCHA를 완료하세요.", "소셜 계정으로 로그인", null, null, null, true );

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