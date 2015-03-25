/*---------------------------------------------------;
█░░█ █▀▀█ █░░█ ▀▀█▀▀ █░░█ █▀▀▄ █▀▀
█▄▄█ █░░█ █░░█ ░░█░░ █░░█ █▀▀▄ █▀▀
▄▄▄█ ▀▀▀▀ ░▀▀▀ ░░▀░░ ░▀▀▀ ▀▀▀░ ▀▀▀

█▀▄▀█ ░▀░ █░█ █▀▀ █▀▀█
█░▀░█ ▀█▀ ▄▀▄ █▀▀ █▄▄▀
▀░░░▀ ▀▀▀ ▀░▀ ▀▀▀ ▀░▀▀
-----------------------------------------------------;
- Version 0.11
- JohnDimi, <johndimi@outlook.com>, twitter@jondmt
-----------------------------------------------------;
- project homepage: 
- https://github.com/johndimi/youtubemixer
----------------------------------------------------*/

// Code and comments could be polished more.

var youtubeMixer = new function() {
	"use strict";
	this.version = "0.11";
	// Hold this, for easy reference
	var THIS = this;
	// Elements
	var container, overlay, progressBar;
	// Pointers to Youtube video objects
	var videoPlaying, videoWaiting, videoFocused = null;
	// Store YouTube video objects
	var ar_video = [];
	// Store YouTube iframe DOM elements
	var ar_videoEl = [];
	// A playlist holding object with video IDs,starting time and end times
	var playlist = [];
	// Current video playing on the queue list
	var playlistPointer = 0;
	// Track time for the current video playing
	var currentTime, endTime, playDuration;
	// This is the standard most youtube videos ratio.
	var ratio = 16/9;
	// The size of the container
	var containerWidth, containerHeight;
	// Whether a crossfade is in progress
	var isSwapping = false;

	// Timers for chacking progress and updating the sound crossfade
	var timerProgress, timerVolume = null;
	// reusable values, used in crossfading
	var soundStep, volumeInc, volumeDec = 0;


	// -- Some default parameters  ----------
	// In seconds, duration of the video/audio crossfade transition
	var TRANSITION_TIME = 2;
	// In Pixels.
	var PROGRESSBAR_HEIGHT = 10;
	var PROGRESSBAR_COLOR = "#F00";
	// Update sound crossfade effect, every X millisecs
	var CROSSFADE_TIMER_STEP = 80;
	// Self explanatory
	var FLAG_PROGRESS_BAR = true;
	// Whether or not to play sound on videos
	var FLAG_AUDIO = false;
	// Use fullpage mode?
	var FLAG_FULLPAGE = true;
	// Enable general debugging mode
	var DEBUG = false;
	// Other values:
	var QUALITY = "default";

	// ===================================================;
	// FUNCTIONS
	// ===================================================;

	// Helper
	// Returns the last element of an array.
	function getLastFrom(array) {
		return array[array.length-1];
	}//---------------------------------------------------;

	// source : http://stackoverflow.com/a/894877
	function defVal(v,d){
		return typeof v!=='undefined'?v:d;
	}//---------------------------------------------------;

	// Override this function to respond to events
	this.eventHandler = function(event,data)
	{

		/* Events that are emitted, #events
		 * ------------------------
		 *
		 * 'api-loading',		when the API starts to load
		 * 'api-ok',			when the API loads
		 * 'error',				[errorString], some error has occured
		 * 'resized'			[width,height], every time the container is resized
		 * 'video-loading'		[videoID], when a video player is loading
		 * 'video-ready'		[videoID], when a video has loaded and is ready to play
		 * 'video-buffering'	[videoID], when a video player is requested to play,
		 * 'video-play'			[videoID], when a video start playing
		 * 'time-update'		[currentTime,Duration], auto-triggered every on time change, ( ever 1 second
		 * 'playlist-update'	[currentVideo,totalVideos],
		 * 'swap-end'			when a crossfade-swap has ended
		 * 'swap-start'			when a crossfade-swap is starting
		 * 'video-play-first'	when the first video starts playing.
		 */

	}//--------------------------------------------------;



	// Push a video to the playlist.
	// id:String = the id of the video to play
	// params = {
	//	  start:Int,   Time to start playing from, in seconds
	//	  playfor:Int, Play the video for this many seconds
	//	  end:Int,	   Stop video at this time, in seconds
	//	  once:Bool,   Play the video only once, if the playlist loops, this will not play again.
	// };
	this.playlistPush = function(id,params)
	{
		if(params==null) params = {};
		var o = {};

		o.id = id;
		o.start = params.start || 0;
		o.playfor = params.playfor || 0;
		o.end = params.end || 0;
		o.once = params.once || false;

		if(o.playfor>0 && o.end >0)
		{
			console.warn("Can't have both 'playfor' and 'end' parameters set, ignoring 'playfor'");
			o.playfor = 0;
		}

		playlist.push(o);

	}//---------------------------------------------------;

	// DO NOT TOUCH!
	// Called when the youtube API loads. User should not call this function.
	this.onAPIReady = function()
	{
		// User callback
		this.eventHandler("api-ok");
		// start loading videos.
		loadNextVideo();
	}//---------------------------------------------------;



	// Call this function AFTER having pushed videos to the playlist
	
	// params = {
	//	 audio:Bool,			Use audio on videos,
	//	 useProgressBar:Bool,	Show a progressBar
	//	 quality:String,		Video quality to play, [hd1080,hd720,large,medium,default]
	//	 elementID:String,		Select the ID for the user overlay, (must exist on the dom)

	//	 fullpage: BOOLEAN,		Currently in development,
	//
	//	 -- Debug parameters are going to be removed eventually --
	//	 debug:Bool,			Enable debug mode, current playing and waiting video are always visible. usuful sometimes.
	//	 debugUI:Bool,			Enable debugUI mode, don't load any videos and simulate a typical run, useful for UI debugging.
	// };
	this.init = function(params)
	{
		// Get any parameters passed to the object
		if(params==null) params = {};
		DEBUG = defVal(params.debug,DEBUG);
		QUALITY = defVal(params.quality,QUALITY);
		FLAG_AUDIO = defVal(params.audio,FLAG_AUDIO);
		FLAG_FULLPAGE = defVal(params.fullpage,FLAG_FULLPAGE);
		FLAG_PROGRESS_BAR = defVal(params.useProgressBar,FLAG_PROGRESS_BAR);

		// Get the screen option, "fullpage" or "element"
		if(FLAG_FULLPAGE)
		{
			container = document.createElement("div");

			if(params.elementID) {
				overlay = document.getElementById(params.elementID);
				overlay.parentNode.removeChild(overlay); //Remove it
			} else {
				overlay = document.createElement("div");
			}

			container.appendChild(overlay);

			// Create CSS Style for elements
			container.style.position = "absolute";
			container.style.margin = 0;
			container.style.padding = 0;
			container.style.overflow = "hidden";

			overlay.style.position = "relative";
			overlay.style.zIndex = 4; // Implying 1-2 are the videos, 3 is the loading bar
			overlay.style.overflowX = "hidden";

			// Add the video container as the first element on the body
			// todo: make sure that it's the only child!
			document.body.appendChild(container);


			// Add the window resize listener,
			window.onresize = updateResize;

		}
		else // Running on an element
		{
			container = document.getElementById(params.elementID);
			window.onresize = function(){};
			containerWidth = container.clientWidth;
			containerHeight = container.clientHeight;
		}

		// Check progressbar
		if(FLAG_PROGRESS_BAR==true)
		{
			progressBar = document.createElement("div");
			progressBar.style.position = "relative";
			progressBar.style.opacity = 0.6;
			progressBar.style.height = PROGRESSBAR_HEIGHT + "px";
			progressBar.style.display = "block";
			progressBar.style.backgroundColor = PROGRESSBAR_COLOR;
			progressBar.style.zIndex = 3;	//1,2 are the videos.
			progressBar.style.top = (containerHeight - PROGRESSBAR_HEIGHT) + "px";
			progressBar.style.left = "0px"; //fixme, if not a fullpage implementation this needs to be parent's x
			progressBar.style.width = 0;
			document.body.appendChild(progressBar);
		}
		else
		{
			// nullify this function, so calls to this are ignored.
			updateProgressBarPercent = function(o){};
		}


		updateResize();

		if(DEBUG) {
			console.log("YoutubeMixer Parameters: --------------- ")
			console.log("FLAG_PROGRESS_BAR",FLAG_PROGRESS_BAR);
			console.log("FLAG_AUDIO",FLAG_AUDIO);
			console.log("DEBUG",DEBUG);
			console.log("QUALITY",QUALITY);
			console.log("FLAG_FULLPAGE",FLAG_FULLPAGE);
			console.log("--------------------------");
		}

		// In case I want to work on the DOM without loading from youtube anything.
		if(params.debugUI)
		{
			console.log("Staring debug UI mode. ( no videos )");
			if(progressBar!=null) updateProgressBarPercent(90);
			// Simulate a typical order of events
			THIS.eventHandler('api-loading');
			setTimeout(function(){THIS.eventHandler('api-ok');},700);
			setTimeout(function(){THIS.eventHandler('video-loading');},1000);
			setTimeout(function(){THIS.eventHandler('video-ready');},2000);
			setTimeout(function(){THIS.eventHandler('video-buffering');},3000);
			setTimeout(function(){THIS.eventHandler('video-play-first');},4000);
			setTimeout(function(){THIS.eventHandler('video-play');},4100);
			return;
		}

		// Resize and place elements
		updateResize();

		// Load the YouTube API
		console.log("LOADING API");
		var tag = document.createElement('script');
		tag.src = "https://www.youtube.com/iframe_api";
		var firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
		this.eventHandler('api-loading');

		// Init other things
		soundStep = Math.ceil(100 / ((TRANSITION_TIME * 1000) / CROSSFADE_TIMER_STEP));

	}//---------------------------------------------------;


	// This function is set only when PageMode is true
	// -- called whenever the window resizes.
	function updateResize()
	{
		var r1,i;

		containerWidth	= window.innerWidth;
		containerHeight = window.innerHeight;
		var targetRatio = containerWidth / containerHeight;

		container.style.width = containerWidth + "px";
		container.style.height = containerHeight + "px";
		overlay.style.width = containerWidth + "px";
		overlay.style.height = containerHeight + "px";

		// If on debug mode, videos are placed next to each other, just so I can see what happens.
		if(!DEBUG) {

		i = ar_videoEl.length;

		while(i-->0){
			if(targetRatio < ratio)
			{
				// Fit height
				r1 = containerHeight * ratio;
				ar_video[i].setSize(Math.ceil(r1),containerHeight);
				ar_videoEl[i].style.left = -Math.ceil( (r1 - containerWidth) / 2 ) + "px";
				ar_videoEl[i].style.top	 = "0px";
			}
			else
			{
				// Fit width
				r1 = containerWidth / ratio;
				ar_video[i].setSize(containerWidth,Math.ceil(r1));
				ar_videoEl[i].style.top = -Math.ceil( (r1 - containerHeight) / 2 ) + "px";
				ar_videoEl[i].style.left  = "0px";
			}
		};

		} else {
			// Don't overlay the videos,
			// Place them side by side, so that they are both visible.
			// This way I can see what's going on.
			for(i=0;i<ar_video.length;i++) {
				ar_videoEl[i].style.left = (420*i) + "px";
				ar_videoEl[i].style.top = "20px";
				ar_video[i].setSize(400,260);
			}
		}

		// update the progress bar
		if(progressBar!=null)
		{
			progressBar.style.top = (containerHeight - PROGRESSBAR_HEIGHT) + "px";
		}

		// Callback to user
		THIS.eventHandler("resize", [containerWidth,containerHeight]);

	}//---------------------------------------------------;

	// Loads next video from the playlist
	// It is queued to play if there is a video playing already.
	function loadNextVideo()
	{
		// Safeguard
		if(ar_video.length>=2)
		{
			console.error("Cannot load a new video to play, There is already a video waiting to play.");
			return;
		}

		// Safeguard
		if(playlist.length==0)
		{
			console.warn("No videos to play!");
			return;
		}

		if(playlistPointer>=playlist.length) playlistPointer = 0;
		var videoInfoToLoad = playlist[playlistPointer++];

		if(videoInfoToLoad.once==true) {
			// Don't put .once to all videos, otherwise it's a crash.
			if(videoInfoToLoad.hasPlayed==true)
			{
				loadNextVideo();
				return;
			}
		}

		console.log("Loading video with id = " + videoInfoToLoad.id);
		loadVideo(videoInfoToLoad);
		videoInfoToLoad.hasPlayed = true;

	}//---------------------------------------------------;

	// Plays the next video that is currently on hold
	// Can also be called from the user to force a video skip
	this.playNextVideo = function() {

		if(isSwapping == true) {
			console.warn("Was already swapping videos, returning.");
			return;
		}

		if(videoWaiting == null) {
			console.error("Waiting video is not ready!!, returning.");
			return;
		}

		console.log("# Request to play next video.");
		THIS.eventHandler('swap-start');
		isSwapping = true;
		videoWaiting.holdPlay = false;
		videoWaiting.playVideo();
		THIS.eventHandler('video-buffering');
		// note: Next expected call is onPlayerStateChange()
	}//---------------------------------------------------;

	// Starts loading a video, puts the video player on the DOM hidden.
	// note: Expected call after this is onPlayerReady();
	function loadVideo(videoInfo)
	{
		var tempElement = document.createElement('div');
		container.appendChild(tempElement);
		var video = new YT.Player(tempElement, {
			videoId: videoInfo.id,
			playerVars: {
			  autoplay: 1,
			  controls: 0,
			  disablekb:1,
			  iv_load_policy:3,
			  showinfo:0,
			  rel:0,
			  start:videoInfo.start
			},
			events: {
				onReady: onPlayerReady,
				onStateChange: onPlayerStateChange,
			}
		});

		// -- Set some custom parameters on the videos
		video.param = videoInfo;
		video.isBuffering = false;
		video.firstPlay = true;

		var el_video = video.getIframe();
		if(!DEBUG){
			el_video.style.opacity = 0;
			el_video.style.visibility = "hidden";
		}else{
			el_video.style.opacity = 0.4;
		}
		el_video.style.position = "absolute";
		el_video.style.transition = "opacity " + TRANSITION_TIME + "s ease-out";
		el_video.addEventListener('webkitTransitionEnd', onTransitionEnd);

		ar_video.push(video);
		ar_videoEl.push(el_video);

		THIS.eventHandler('video-loading',[videoInfo.id]);
	}//---------------------------------------------------;


	// Called when the video player is loaded and ready to play.
	// = NOTE =
	// The video is not ready to be played yet, I want to make sure
	// it enters the screen when the youtube buffering is off and the video
	// actually starts playing, this happens in onPlayerStateChange();
	function onPlayerReady(e)
	{
		console.log("Video Player loaded, ready to play");

		// I could use 'video=e.target;'
		var video = getLastFrom(ar_video);

		// Fix the Z-ordering of the videos, so that
		// the most recent one is always on top
		for(var i=0;i<ar_videoEl.length;i++) {
			ar_videoEl[i].style.zIndex = i+1;
		}

		video.setVolume(0);
		video.setPlaybackQuality(QUALITY);

		if(DEBUG) updateResize();

		// It's the first time a video is ever played
		if(videoPlaying==null)
		{
			console.log("videoPlaying set, id=", video.param.id);
			videoPlaying = video;
			videoPlaying.firstPlay = true;
			video.playVideo(); // note: Does not play immediately.
			if(FLAG_AUDIO) video.setVolume(100);
			
			// Doesn't matter if it's not actually buffering,
			// just tell the UI that the video is loading.
			THIS.eventHandler('video-buffering');
		}
		else
		{
			console.log("videoWaiting set, id=", video.param.id);
			videoWaiting = video;
			videoWaiting.holdPlay = true;
			videoWaiting.playVideo();// note: It will stop once the buffering stops!
			THIS.eventHandler('video-ready',[video.param.id]);
		}


	}//---------------------------------------------------;

	// Called when the video actually starts playing
	// Plays last pushed video of the queue
	// next expected call onTransitionEnd();
	function onPlayerStateChange(event)
	{
		// Called whenever any video starts playing
		// Note , this can be triggered after a buffering pause, or a first play.
		if (event.data == YT.PlayerState.PLAYING)
		{
			// The video returns to play state from a buffering state
			if(videoPlaying.isBuffering == true)
			{
				THIS.eventHandler("video-play",[event.target.param.id]);
				videoPlaying.isBuffering = false;
			}

			// Skip further initialization if it's not the first play of this video
			if(event.target.firstPlay == false)
			{
				return;
			}
			
			// This is the first video played
			if(videoFocused == null)
			{
				THIS.eventHandler('video-play-first');
			}

			// By playing the waiting video for a bit, allows it to preload
			// so that it will play instantly
			if(event.target.holdPlay == true)
			{
				event.target.holdPlay = false;
				event.target.pauseVideo();
				return;
			}

			event.target.firstPlay = false;

			console.log("+ Video Playing, id=",event.target.param.id);
			var video = getLastFrom(ar_video);
			var style = video.getIframe().style;

			// Start fading the video into the screen
			updateResize();
			style.visibility = "visible";
			style.opacity = 1; // --> will begin transition and call onTransitionEnd();

			// Check and calculate video durations
			var tt = video.getDuration();

			if(video.param.end>0)
				endTime = video.param.end;
			else if(video.param.playfor>0)
				endTime = video.param.start + video.param.playfor;
			else
				endTime = tt;

			if(endTime>tt) {
				console.warn("Requested END time for video exceeds real end time, reseting value.");
				endTime = tt;
			}

			if(video.param.start>endTime) {
				console.warn("Requested START time can't be higher than END TIME, reseting value.");
				video.param.start = 0;
			}

			playDuration = endTime - video.param.start;
			currentTime = 0;

			videoFocused = video;
			updateProgressBarPercent(0);
			
			if(FLAG_AUDIO) crossFadeSound();

			// Create the timer to check for progress
			if(timerProgress == null)
			{
				timerProgress = setInterval(onTimeCheck,100); // Every 1/10 second
			}
			
			// User callback
			THIS.eventHandler("video-play",[video.param.id]);
			THIS.eventHandler("playlist-update",[playlistPointer,playlist.length]);
			
		}
		else if(event.data == YT.PlayerState.BUFFERING)	 //#buffering
		{
			if(event.target == videoPlaying) {
				videoPlaying.isBuffering = true;
				console.log("# Video Buffering");
				THIS.eventHandler('video-buffering');
			}
		}

	}//---------------------------------------------------;



	// Called when the fade in transition of a video ends
	function onTransitionEnd(event)
	{
	   console.log("- Video Transition end.");

		// The first ever video to be faded in, doesn't need to be swapped
		if(isSwapping == true)
		{
			// just in case, stop the crossfade sound timer
			if(timerVolume != null) {
				clearInterval(timerVolume);
				timerVolume = null;
			}

			// Remove the oldest video from the array
			var video = ar_video.shift();
			var video_el = ar_videoEl.shift();
			// And from the DOM
			container.removeChild(video_el);
			video.destroy();

			videoPlaying = videoWaiting;
			videoWaiting = null;
			isSwapping = false;
			if(FLAG_AUDIO) videoPlaying.setVolume(100);
			console.log("- Video Removed");
			THIS.eventHandler("swap-end");
		}

		// Prepare the second video
		loadNextVideo();
	}//---------------------------------------------------;


	// Called every one second to check for video end trigger, #timecheck
	function onTimeCheck()
	{
		if(videoPlaying.isBuffering == true) return;

		//currentTime = videoFocused.getCurrentTime() - videoFocused.param.start; // time doesn't report well with this,
		currentTime += 0.1;	// might cause bugs, but I can emit the time better at exact seconds.
		updateProgressBarPercent( Math.ceil((currentTime / playDuration) * 100) );
		
		// I want to trigger the time-update every 1 second, not every 1/10 of a second
		if((currentTime % 1) <= 0.1) // there are no decimal points
			THIS.eventHandler("time-update",[Math.ceil(currentTime),playDuration]);

		if(isSwapping) return;
		if(currentTime + TRANSITION_TIME > playDuration)
		{
			THIS.playNextVideo();
		}
	}//---------------------------------------------------;


	// Start crossfading the sound of the waiting and playing video
	// Increasing the volume of the waiting, and decreasing the playing video.
	// * Simple Linear crossfade.
	function crossFadeSound()
	{
		// No need to crossfade
		if(videoWaiting == null) return;

		// Init the volume helpers
		volumeInc = 0;
		volumeDec = 100;

		// Safeguard, this shouldn't happen
		if(timerVolume != null) {
			console.warn("A crossfade is still in progress, skipping");
			return;
		}

		timerVolume = setInterval(function(){
			volumeInc += soundStep;
			if(volumeInc>=100) {
				volumeInc = 100;
				clearInterval(timerVolume);
				timerVolume = null;
			}
			volumeDec = 100 - volumeInc;

			// actually update the Video Sounds
			videoPlaying.setVolume(volumeDec);
			videoWaiting.setVolume(volumeInc);

		}, CROSSFADE_TIMER_STEP);

	}//---------------------------------------------------;

	// This updates the progressbar's width.
	function updateProgressBarPercent(percent)
	{
	   // progressBar.style.width = Math.ceil((containerWidth * percent) / 100) + "px";
		progressBar.style.width = percent + "%"; // this works as well.
	}//---------------------------------------------------;


	// Set the audio, either true(on), or false (
	this.setAudio = function(state)
	{
		FLAG_AUDIO = state;
		//if(isSwapping) return; // avoid bugs?
		if(videoPlaying!=null){
			if(FLAG_AUDIO)
			videoPlaying.setVolume(100);
			else
			videoPlaying.setVolume(0);
		}
	}//---------------------------------------------------;
	// Whether the player is muted or not
	this.getAudio = function() {
		return FLAG_AUDIO;
	}//---------------------------------------------------;

}//-- end YouTubeMixer;


// This function must exist at the global scope for the youtube API to work
function onYouTubeIframeAPIReady() {
	console.log("API READY");
	youtubeMixer.onAPIReady();
}//---------------------------------------------;