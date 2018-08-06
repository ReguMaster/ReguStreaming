/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const reguStreaming = {};
reguStreaming.config = {};

reguStreaming.setConfig = function( name, value )
{
    this.config[ name ] = value;
}

reguStreaming.getConfig = function( name, defaultValue )
{
    if ( typeof this.config[ name ] === "undefined" || this.config[ name ] === null )
        return defaultValue || null;

    return this.config[ name ];
}

// 브라우저 간 호환성 해결. https://blog.outsider.ne.kr/856
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.oGetUserMedia || navigator.msGetUserMedia;
URL = window.URL || window.webkitURL || window.mozURL || window.oURL || window.msURL;