/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/


'use strict';

const Logger = require( "../logger" );
require( "passport-openid" );

const util = require( "util" );
const passport = require( "passport" );
const GoogleStrategy = require( "passport-google-oauth20" )
    .Strategy

passport.serializeUser( function( user, done )
{
    done( null, user );
} );

passport.deserializeUser( function( obj, done )
{
    done( null, obj );
} );

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).

passport.use( new GoogleStrategy(
    {
        clientID: "662427320441-bvoorak4gref67pb1tndloeilcojk95p.apps.googleusercontent.com",
        clientSecret: "gYLSMRM9gBCDu9aDFsbxxFFP",
        callbackURL: "https://regustreaming.oa.to/login/google/return"
    },
    function( accessToken, refreshToken, profile, done )
    {
        process.nextTick( function( )
        {
            Logger.write( Logger.LogType.Info, `[Router] Login with GOOGLE ... ${ util.inspect( profile, false, 3 ) }` );

            profile.avatar = profile._json.image.url;
            profile.avatarFull = profile.avatar.replace( "?sz=50", "?sz=180" );

            return done( null, profile );
        } );
    }
) );