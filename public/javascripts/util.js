/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

//https://gist.github.com/demonixis/4202528/5f0ce3c2622fba580e78189cfe3ff0f9dd8aefcc
Math.clamp = function( value, min, max )
{
	if ( value < min )
	{
		return min;
	}
	else if ( value > max )
	{
		return max;
	}
	
	return value;
}

// Obtient une interpolation linéaire entre 2 valeurs
Math.lerp = function( a, b, amount )
{
	amount = amount < 0 ? 0 : amount;
	amount = amount > 1 ? 1 : amount;
	return a + ( b - a ) * amount;
}

String.prototype.toMMSS = function () {
	var sec_num = parseInt(this, 10); // don't forget the second param
	var hours   = Math.floor(sec_num / 3600);
	var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	var seconds = sec_num - (hours * 3600) - (minutes * 60);

	if (hours   < 10) {hours   = "0"+hours;}
	if (minutes < 10) {minutes = "0"+minutes;}
	if (seconds < 10) {seconds = "0"+seconds;}
	return minutes+':'+seconds;
}

function formatTime(numberofseconds){    
	var zero = '0', hours, minutes, seconds, time;

	time = new Date(0, 0, 0, 0, 0, numberofseconds, 0);

	mm = time.getMinutes();
	ss = time.getSeconds();

	// Pad zero values to 00
	mm = (zero+mm).slice(-2);
	ss = (zero+ss).slice(-2);

	time = mm + ':' + ss
	return time; 
}