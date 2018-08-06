/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const Logger = require( "../logger" );
require( "passport-openid" );

const util = require( "util" );
const passport = require( "passport" );
const KakaoStrategy = require( "passport-kakao" )
    .Strategy;

passport.serializeUser( function( user, done )
{
    done( null, user );
} );

passport.deserializeUser( function( obj, done )
{
    done( null, obj );
} );

passport.use( new KakaoStrategy(
    {
        clientID: "26d70e4f43a369f7ff280336c7355b45",
        clientSecret: "apKyOsPBfRhFXfCMo9PG6ELy0PREkXBW", // clientSecret을 사용하지 않는다면 넘기지 말거나 빈 스트링을 넘길 것
        callbackURL: "https://regustreaming.oa.to/login/kakao/return"
    },
    function( accessToken, refreshToken, profile, done )
    {
        var isAllowedAccount = hook.run( "CanLoginAccount", profile.id, profile );

        if ( isAllowedAccount && isAllowedAccount.isBanned )
        {
            return done( null, false,
            {
                id: isAllowedAccount.id
            } );
        }

        process.nextTick( function( )
        {
            Logger.write( Logger.LogType.Info, `[Router] Login with KAKAO ... ${ util.inspect( profile, false, 3 ) }` );

            profile.avatar = profile._json.properties.thumbnail_image;
            profile.avatarFull = profile._json.properties.profile_image;

            return done( null, profile );
        } );
    }
) );