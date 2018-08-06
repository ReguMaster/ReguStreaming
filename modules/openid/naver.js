/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const Logger = require( "../logger" );
require( "passport-openid" );

const util = require( "util" );
const passport = require( "passport" );
const NaverStrategy = require( "passport-naver" )
    .Strategy;

passport.serializeUser( function( user, done )
{
    done( null, user );
} );

passport.deserializeUser( function( obj, done )
{
    done( null, obj );
} );

passport.use( new NaverStrategy(
    {
        clientID: "Qv8zgVwxiralK6Sz25U6",
        clientSecret: "9cMS_fqbEF",
        callbackURL: "https://regustreaming.oa.to/login/naver/return"
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
            Logger.write( Logger.LogType.Info, `[Router] Login with NAVER ... ${ util.inspect( profile, false, 3 ) }` );

            profile.avatar = profile._json.profile_image;
            profile.avatarFull = profile._json.profile_image;

            return done( null, profile );
        } );
    }
) );