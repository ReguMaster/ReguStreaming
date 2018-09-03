/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const Logger = require( "../logger" );
require( "passport-openid" );

const util = require( "util" );
const hook = require( "../../hook" );
const passport = require( "passport" );
const KakaoStrategy = require( "passport-kakao" )
    .Strategy;
const apiConfig = require( "../../const/config" )
    .Kakao;

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
        clientID: apiConfig.clientID,
        clientSecret: apiConfig.clientSecret, // clientSecret을 사용하지 않는다면 넘기지 말거나 빈 스트링을 넘길 것
        callbackURL: apiConfig.callbackURL
    },
    function( accessToken, refreshToken, profile, done )
    {
        // var isAllowedAccount = hook.run( "CanLoginAccount", profile.id, profile );

        // if ( isAllowedAccount && isAllowedAccount.isBanned )
        // {
        //     return done( null, false,
        //     {
        //         id: isAllowedAccount.id
        //     } );
        // }

        process.nextTick( function( )
        {
            Logger.write( Logger.type.Info, `[Router] Login with KAKAO ... ${ util.inspect( profile, false, 3 ) }` );

            profile.avatar = profile._json.properties.thumbnail_image;
            profile.avatarFull = profile._json.properties.profile_image;

            return done( null, profile );
        } );
    }
) );