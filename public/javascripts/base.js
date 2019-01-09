/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const reguStreaming = {
    config:
    {}
};

reguStreaming.debugMode = true;

window.VAR_NULL = "^NULL^";

reguStreaming.setConfig = function( name, value )
{
    this.config[ name ] = value;
}

reguStreaming.getConfig = function( name, defaultValue )
{
    if ( !this.config.hasOwnProperty( name ) || typeof this.config[ name ] === "undefined" )
        return defaultValue;

    return this.config[ name ];
}

reguStreaming.printError = function( errorMessage )
{
    if ( this.debugMode )
        console.log( "%c[ReguStreaming] " + errorMessage, "color: red; font-size: 13px;" );
}

// 브라우저 간 호환성 해결. https://blog.outsider.ne.kr/856
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.oGetUserMedia || navigator.msGetUserMedia;
URL = window.URL || window.webkitURL || window.mozURL || window.oURL || window.msURL;