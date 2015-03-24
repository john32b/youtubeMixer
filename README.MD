YoutubeMixer
============

**Version** 0.1
**Author:** JohnDimi, <johndimi@outlook.com>, twitter:[@jondmt](https://twitter.com/jondmt)  
**Date started:** 03-2015

----------

__YoutubeMixer__ is a javascript experiment. It will play youtube videos on the background of the page and mix them using a crossfade effect.


[![Interface Demo](http://i.imgur.com/cR39HYH.gif)](http://johndimi.github.io/youtubeMixer/)

_A video transition in progress_

###[Click Here for a Demo In action](http://johndimi.github.io/youtubeMixer/)


## Features

- __Linear crossfade__ when changing videos (video & audio)
- Playlist videos can have a starting and an ending time.
- Videos are __preloaded__, so that the transitions will be fluid without waiting.
- Videos are set on the background and are __dynamically resizable__ to match the window size.
-  Provides a simple flexible __API__ so that you can use it without much hassle.

## Notes
Currently this __ONLY supports Google Chrome__, as I didn't put time to check every other browser.
This is an alpha version, there are bugs to fix and features to be covered in future versions.

The embedded videos will display ads just like youtube. You can use an adblocker to remove them, or embed videos that don't feature ads.

###### Some known issues are:
- When a video can't load, the videos will stop altogether! Reasons a video won't load are _region lock/private/embed blocked/bad ID_ Hopefully will fix this at a later release.
- There is a bug, when you have visited a video on youtube.com and youtube puts a cookie to know the time where you left off, if you try to load that video on youtubeMixer, sometimes it will start at the wrong time. If such thing occurs, until fixed, use incognito mode on Chrome to skip reading the cookies.


# How to use

Import the __youtubemixer.js__ source file. This creates a global object named __youtubeMixer__. 
```html
<script src="youtubemixer.js"></script>
```


## YoutubeMixer API exposed functions

- [youtubeMixer.**playlistPush( ... )**;](#youtubeMixerplaylistPush)
- [youtubeMixer.**init( ... )**;](#youtubeMixerinit)
- [youtubeMixer.**eventHandler( )**;](#youtubeMixereventHandler)
- [youtubeMixer.**playNextVideo( );**](#youtubeMixerplayNextVideo)
- [youtubeMixer.**getAudio( );**](#youtubeMixergetAudio)
- [youtubeMixer.**setAudio( );**](#youtubeMixersetAudio)



### youtubeMixer.playlistPush( id, parameters );

The first thing to do is to __add videos__ to the youtubeMixer playlist. Do this before calling __init()__; Videos on the playlist will __loop forever__

#### id: String
The youtube ID of the video to add. Required.
#### parameters.start : Int, _(default = 0 )_
Start time of the video in seconds.
#### parameters.playfor : Int, _( optional )_
Play for this many seconds. If omitted will play the entire video
#### parameters.end : Int, _( optional )_
Play video until this timestamp. note it is in seconds. If omitted will play the entire video
#### parameters.once : Bool, _(default = false)_
Play the video only once, if the playlist loops, this will not play again. 

###### example:
```javascript
/* Will add the video "ht2TigJp88w" to the playlist
   The video will start playing at 520 seconds
   And it will last for 20 seconds */
youtubeMixer.playlistPush("ht2TigJp88w", { start:520, playfor:20 });
```
### youtubeMixer.init( parameters );
Once you have pushed some videos to the playlist, it's time to init and run the object. Calling this will __automatically__ start loading and playing videos from the playlist.

#### parameters.audio: Bool, _(default = false )_
Whether or not to start the player with the audio enabled.
#### parameters.useProgressBar: Bool, _(default = true)_
If true, will add a simple progress bar on the bottom of the player.
#### parameters.quality: String, _(default = "default")_
Force a quality for the videos played. Valid values are:

 - hd1080
 - hd720
 - large
 - medium
 - small
 - default, _This will choose the best quality based on network speed_

#### parameters.elementID: String, _( optional )_

If you want to have overlay content, pass the ID of the DIV, and youtuberMixer will re-arrange the DOM so that this will overlay the player. __If omitted, be sure to have a clean HTML with no elements in it.__ Check the example files for more info

###### example
```javascript
youtubeMixer.init({
	audio:true,
	useProgressBar:true,
	quality:"medium",
	screenMode:"fullsceen",
	elementID:"overlay"
});
```




### youtubeMixer.eventHandler(event, data ); _// (overridable)_

youTubePlayer features a basic eventHandler for a quick and easy user feedback on basic events.
This is not a proper event emitter per-se, as only 1 listener can be active. It's more like an expanded callback, but instead of having 10+ callback functions, I decided to do this.

##### Override this function
```javascript
youtubeMixer.eventHandler = function(event,data)
{
    // user code to handle events
};
```

### Events that can be emitted:

- __api-loading__
	- When the youTube API starts to load
- __api-ok__
	- when the youTube API is loaded.
- __error__
	- data:String = The error occured
- __resized__
	- Whenever the window is resized
	- data[0]:Int = New viewport width
	- data[1]:Int = New viewport height
- __video-loading__
	- data:String = video ID
	- When a video player is loading.
- __video-ready__
	- data:String = video ID
	- When a video has loaded and is ready to play.
- __video-buffering__
	- data:String = video ID
	- When the active playing video is currently buffering
- __video-play__
	-  data:String = video ID
	- When the active video starts playing, This is called whenever it resumes from buffering and on the first play of a video
- __time-update__
	- data[0]:Int = current Time of playing video
	- data[1]:Int = totalTime of playing video
	- Triggers every 1 second if the video is playing, sends the timestamp of the playing video.
- __playlist-update__
	- data[0]:Int = current Video index
	- data[1]:Int = total Videos
	- Triggers whenever the playing video changes. Sends the current video index of the playlist
- __swap-end__
	- When a crossfade between videos is finished
- __swap-start__
	- When a crossfade between videos starts
- __video-play-first__
	- Called only once, when the first video of the playlist starts playing.

###### example
```javascript
youtubeMixer.eventHandler = function(event,data)
{
    switch(event) {
	    case:"playlist-update":
		    console.log("Playing video#"+data[0]+ " of #"+data[1]);
		    // Output example:
		    // Playing video #1 of #16
	    break;
		
		case:"time-update":
			// Update  screen time indication.
			GUI_updateVideoTimer(data[0],data[1]);
		break;
	}
};
```
### youtubeMixer.playNextVideo( );
Plays the next video on the playlist. If that video is not ready yet, it will do nothing.

### youtubeMixer.getAudio( );
Returns Boolean, Whether or not the Audio is currently enabled on the player.

### youtubeMixer.setAudio( state );
state:Bool, Enable or Disable the audio of the player.

# Other

Feel free to use this at your liking. Feedback, questions and suggestions are always welcome :-)
