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
const SteamStrategy = require( "passport-steam" )
    .Strategy;

passport.serializeUser( function( user, done )
{
    done( null, user );
} );

passport.deserializeUser( function( obj, done )
{
    done( null, obj );
} );

/*
{ provider: 'steam',
  _json:
   { steamid: '76561198011675377',
     communityvisibilitystate: 3,
     profilestate: 1,
     personaname: 'undefinedMaster',
     lastlogoff: 1531901212,
     commentpermission: 1,
     profileurl: 'https://steamcommunity.com/id/regumaster/',
     avatar: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/3c/3c00d434e8eaa2b8b538befcbb4033d59d7b0170.jpg',
     avatarmedium: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/3c/3c00d434e8eaa2b8b538befcbb4033d59d7b0170_medium.jpg',
     avatarfull: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/3c/3c00d434e8eaa2b8b538befcbb4033d59d7b0170_full.jpg',
     personastate: 1,
     realname: '레그마스터',
     primaryclanid: '103582791461069563',
     timecreated: 1247025073,
     personastateflags: 0,
     loccountrycode: 'KR' },
  id: '76561198011675377',
  displayName: 'undefinedMaster',
  photos:
   [ { value: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/3c/3c00d434e8eaa2b8b538befcbb4033d59d7b0170.jpg' },
     { value: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/3c/3c00d434e8eaa2b8b538befcbb4033d59d7b0170_medium.jpg' },
     { value: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/3c/3c00d434e8eaa2b8b538befcbb4033d59d7b0170_full.jpg' } ] }
*/

passport.use( new SteamStrategy(
    {
        returnURL: "https://regustreaming.oa.to/login/steam/return",
        realm: "https://regustreaming.oa.to/",
        apiKey: "6FD21C3629A18581B780F424C782DDE6"
    },
    function( identifier, profile, done )
    {
        var isAllowedAccount = hook.run( "CanLoginAccount", null, profile.id, profile );

        if ( isAllowedAccount && isAllowedAccount.isBanned )
        {
            return done( null, false,
            {
                id: isAllowedAccount.id
            } );
        }

        process.nextTick( function( )
        {
            // To keep the example simple, the user's Steam profile is returned to
            // represent the logged-in user.  In a typical application, you would want
            // to associate the Steam account with a user record in your database,
            // and return that user instead.

            Logger.write( Logger.LogType.Info, `[Router] Login with STEAM ... ${ util.inspect( profile, false, 3 ) }` );

            profile.avatar = profile._json.avatar;
            profile.avatarFull = profile._json.avatarfull;
            profile.identifier = identifier;

            return done( null, profile );
        } );
    }
) );