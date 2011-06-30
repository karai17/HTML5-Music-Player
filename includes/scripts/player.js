//== Global Variables ==
var emptyList	= true;
var overlay		= true;
var loaded		= false;
var shuffle		= false;
var timeLeft	= false;
var manualSeek	= false;
var mp3			= canPlay('audio/mpeg') || canPlay('audio/mp3');
var ogg			= canPlay('audio/ogg') || canPlay('application/ogg');
var wav			= canPlay('audio/wav');
var $audio;
var $handle;
var $timer;

//== Set width of slider based on window size ==
function setSliderWidth(){
	//-- Get controller widths (+ padding) --
	var bwidth = $('#buttons').innerWidth() + 30;
	var twidth = $('#timer').innerWidth();
	var swidth = $('#controller').width() - bwidth - twidth;
	
	$('#slider').css('width', swidth);
	$('#slider').css('left', bwidth);
}

function prevSong(){
	var prev;
	loaded = false;
	
	if($('tbody :first-child').hasClass('playing'))
		prev = $('tbody :last-child');
	else
		prev = $('.playing').prev();
	
	$(prev).find('.play button').click();
}

function nextSong(shuffle){
	var next;
	loaded = false;
	
	if(shuffle){
		var total = $('tbody tr').size();
		
		if(total > 2){
			do{
				var rand = Math.floor(Math.random() * total);
				next = $('tbody tr')[rand];
			}
			while($(next).hasClass('playing'));
		}
		else
			shuffle = false;
	}
	
	if(!shuffle){
		if(($('tbody :last-child').hasClass('playing')) || (!$('.playing').length))
			next = $('tbody :first-child');
		else
			next = $('.playing').next();
	}
	
	$(next).find('.play button').click();
}

/**
 *	Check Size of List
 */
function checkList(){
	if(!$('.playing').length){
		$($audio).prop('src', ' ');
		$("#playToggle").removeClass('bpause');
		nextSong(shuffle);
	}
	
	if(!$('tbody:has(tr)').length){
		emptyList = true;
	}
}



function canPlay(type){
	var a = document.createElement('audio');
	return !!(a.canPlayType && a.canPlayType(type).replace(/no/, ''));
}


/**
 *	Prepare 'dragover' and 'drop' Events for Execution
 *	
 *	@param {Event} event			- 'dragover' or 'drop'
 */
function dndPrep(event){
	event.stopPropagation();
	event.preventDefault();
	
	return false;
}

/**
 *	Remove Initial Overlay
 */
function removeOverlay(){
	$('#fade').css('display', 'none');
	$('#drop').css('display', 'none');
}

/**
 *	Calculate Where to Position Drop Box
 */
function setDropLocation(){
	//-- Get width and height of appropriate elements --
	var wwidth	= $(window).width();
	var wheight	= $(window).height();
	var dwidth	= $('#drop').innerWidth();
	var dheight	= $('#drop').innerHeight();
	
	//-- Calculate where #drop will go --
	var dtop	= (wheight / 2) - (dheight / 2);
	var dleft	= (wwidth / 2) - (dwidth / 2);
	
	//-- #fade takes up full screen --
	$('#fade').css('width', wwidth);
	$('#fade').css('height', wheight);
	
	//-- Position #drop --
	$('#drop').css('top', dtop);
	$('#drop').css('left', dleft);
}

/**
 *	Calculate Height of Song List
 */
function setTableHeight(){
	//-- Get height of appropriate elements --
	var wheight	= $(window).height();
	var cheight	= $('#controller').innerHeight();
	var hheight	= $('thead').height();
	
	//-- Calculate new height --
	var nheight	= wheight - cheight - hheight;
	
	//-- Set new height --
	$('tbody').css('height', nheight);
}

/**
 *	Calculate Width of Table Rows
 */
function setRowWidth(){
	//-- Get generic widths --
	var windowWidth		= $(window).width();
	var scrollWidth		= $.getScrollbarWidth();
	
	//-- Get <thead /> widths (+ borders) --
	var checkWidth		= $('#check').innerWidth() + 2;
	var deleteWidth		= $('#delete').innerWidth() + 2;
	var playWidth		= $('#play').innerWidth() + 2;
	
	//-- Calculate new width --
	var remainingWidth	= windowWidth - checkWidth - deleteWidth - playWidth;
	var stretchWidth	= Math.floor(remainingWidth / 3);
	var floorWidth		= remainingWidth - (stretchWidth * 3);
	
	//-- Set new width (- padding) --
	$('#artist').css('width', stretchWidth - 16);
	$('#title').css('width', stretchWidth - 16);
	$('#album').css('width', stretchWidth - 16 + floorWidth);
	
	//-- Get <tbody /> widths (+ borders) --
	var bCheckWidth		= $('.check').innerWidth() + 1;
	var bDeleteWidth	= $('.delete').innerWidth() + 1;
	var bPlayWidth		= $('.play').innerWidth() + 1;
	
	//-- Calculate new width --
	var bRemainingWidth	= windowWidth - bCheckWidth - bDeleteWidth - bPlayWidth - scrollWidth;
	var bStretchWidth	= Math.floor(bRemainingWidth / 3);
	var bFloorWidth		= bRemainingWidth - (bStretchWidth * 3);
	var offsetStretch	= stretchWidth - bStretchWidth;
	
	//-- Set new width (- padding) --
	$('.artist').css('width', bStretchWidth + offsetStretch - 16);
	$('.title').css('width', bStretchWidth + offsetStretch - 16);
	$('.album').css('width', bStretchWidth + offsetStretch - (offsetStretch * 3) - 16 + bFloorWidth);
}

/**
 *	Parse File for ID3 Tags and Load Song into Library
 *	
 *	@param {Object} file			- File (song)
 */
function loadSong(file){
	//-- Call to ID3 library --
	ID3.loadTags(file.name, function(){
		//-- List of tags --
		var tags	= ID3.getAllTags(file.name);
		
		//-- Create DOM objects with file data --
		var tr		= $('<tr></tr>').data('file', file);
		var check	= $('<td class="check"><input type="checkbox" /></td>');
		var del		= $('<td class="delete"><button title="Delete From List"></button></td>');
		var play	= $('<td class="play"><button></button></td>');
		var artist	= $('<td class="artist">'+ (tags.artist || 'n/a') +'</td>');
		var title	= $('<td class="title">'+ (tags.title || file.name) +'</td>');
		var album	= $('<td class="album">'+ (tags.album || 'n/a') +'</td>');
		/**var art		= $('<img src="data:' + tags.picture.format + ';base64,' + Base64.encodeBytes(tags.picture.data) + '" alt="Album Art" />');**/
		
		//-- Append DOM objects to song list --
		$('#songList tbody').append(tr);
		$(tr).append(check);
		$(tr).append(del);
		$(tr).append(play);
		$(tr).append(artist);
		$(tr).append(title);
		$(tr).append(album);
		
		//-- Set row width --
		setRowWidth();
		
		//-- Play first song if no songs were in list --
		if(emptyList == true){
			$('tbody :first-child').find('.play button').click();
			emptyList = false;
		}
	},
	{tags: ["artist", "title", "album", "picture"], dataReader: FileAPIReader(file)});
}

/**
 *	Read Files Into System
 *	
 *	@param {Object} files			- FileList of selected files
 */
function readFiles(files){
	if(!$('#prev').hasClass('bprev')){
		$('#prev').addClass('bprev');
		$('#rw').addClass('brw');
		$('#playToggle').addClass('bplay');
		$('#stop').addClass('bstop');
		$('#ff').addClass('bff');
		$('#next').addClass('bnext');
		$('#slider .slider').addClass('bslider');
		$('#handle').addClass('bhandle');
		$('#timer').addClass('btimer');
	}
	
	//-- Loop through list of files --
	for(var i = 0; i < files.length; i++){
		var file = files[i];
		
		switch(file.type){
			case 'audio/mpeg':
			case 'audio/mp3':
				if(mp3)
					loadSong(file);
				
				break;
			case 'audio/ogg':
			case 'application/ogg':
			case 'audio/oga':
				if(ogg)
					loadSong(file);
				
				break;
			case 'audio/wav':
				if(wav)
					loadSong(file);
				
				break;
		}
	}
}

/**
 *	Play Song From List
 *	
 *	@param {Object} tr				- Element Object with file attached
 */
function playSong(tr){
	var file = $(tr).data('file');
	var url;
	
	//-- Create URL from object (detect browser) --
	if(window.createObjectURL)
		url = window.createObjectURL(file);
	else if(window.createBlobURL)
		url = window.createBlobURL(file);
	else if(window.URL && window.URL.createObjectURL)
		url = window.URL.createObjectURL(file);
	else if(window.webkitURL && window.webkitURL.createObjectURL)
		url = window.webkitURL.createObjectURL(file);
	
	//-- If browser is capable, stylize song in list and send data to <audio /> --
	if(url){
		$('.playing').removeClass('playing');
		$(tr).addClass('playing');
		$($audio).attr('src', url);
		$audio.play();
	}
}

/**
 *	Document is Ready
 */
$(document).ready(function(){
	//== Initialize ==
	$audio	= $('#audio').get(0);
	$handle	= $('#handle');
	$timer	= $('#timer');
	$.event.props.push("dataTransfer");
	setSliderWidth();
	setDropLocation();
	setTableHeight();
	setRowWidth();
	
	//== Song progress ==
	$($audio).bind('timeupdate', function(){
		
		//-- Timer --
		var time = parseInt($audio.duration - $audio.currentTime, 10);
		var min;
		var sec;
		
		//-- If counting to zero --
		if(timeLeft){
			min = Math.floor(time / 60, 10);
			sec = time - (min * 60);
			
			if(sec < 10)
				sec = '0' + sec;
			
			$timer.text('-' + min + ':' + sec);
		}
		
		//-- Else count from zero --
		else{
			min = Math.floor($audio.currentTime / 60, 10);
			sec = Math.floor($audio.currentTime - (min * 60));
			
			if(sec < 10)
				sec = '0' + sec;
			
			$timer.text(min + ':' + sec);
		}
		
		//-- Handle --
		var pos = ($audio.currentTime / $audio.duration) * 100;
		
		//-- If not manually moving handle, set handle to duration % --
		if(!manualSeek){
			$handle.css({left: pos + '%'});
		}
		
		//-- Load audio loaded, turn on controls --
		if(!loaded){
			loaded = true;
			
			$('#slider').slider({
				value		: 0,
				step		: 0.01,
				orientation	: "horizontal",
				range		: "min",
				max			: $audio.duration,
				animate		: true,          
				slide		: function(){             
					manualSeek = true;
				},
				stop		: function(e,ui){
					manualSeek = false;         
					$audio.currentTime = ui.value;
				}
			});
		}
	});
	
	//== If playing, display pause button ==
	$($audio).bind('play', function(){
		$("#playToggle").addClass('bpause');
	})
	
	//== If paused or ended, display play button ==
	$($audio).bind('pause ended', function(){
		$("#playToggle").removeClass('bpause');
	});
	
	//== If ended, next song ==
	$($audio).bind('ended', function(){
		if(loaded){
			nextSong(shuffle);
		}
	});
	
	//== Audio UI - Back 1 Track ==
	$('#prev').click(function(){
		if(loaded)
			prevSong();
	});
	
	//== Audio UI - Rewind Track ==
	$('#rw').mousehold(function(){
		if(loaded)
			$audio.currentTime -= 1;
	});
	
	//== Audio UI - Play Track ==
	$('#playToggle').click(function(){
		if(loaded){
			if(($audio.paused) || ($audio.ended))
				$audio.play();
			else
				$audio.pause();
		}
	});
	
	//== Audio UI - Stop Track ==
	$('#stop').click(function(){
		if(loaded){
			$audio.pause();
			$audio.currentTime = 0;
		}
	});
	
	//== Audio UI - Fast Forward Track ==
	$('#ff').mousehold(function(){
		if(loaded)
			$audio.currentTime += 1;
	});
	
	//== Audio UI - Next 1 Track ==
	$('#next').click(function(){
		if(loaded)
			nextSong(shuffle);
	});
	
	//== Audio UI - Shuffle Tracks ==
	$('#shuffle').click(function(){
		if(loaded){
			if(shuffle){
				shuffle = false;
				$(this).removeClass('bshuffle');
			}
			else{
				shuffle = true;
				$(this).addClass('bshuffle');
			}
		}
	});
	
	//== Audio UI - Toggle Time Display ==
	$($timer).click(function(){
		if(loaded){
			if(timeLeft)
				timeLeft = false;
			else
				timeLeft = true;
			
			$($audio).trigger('timeupdate');
		}
	});
	
	//== Generic Button Click ==
	$('#controller button').mousedown(function(){
		$(this).addClass('click');
	});
	
	$(document).mouseup(function(){
		$('.click').removeClass('click');
	});
	
	//== Resize slider with window ==
	$(window).resize(function(){
		setSliderWidth();
	});
	
	//== Recalculate when windows is resized ==
	$(window).resize(function(){
		if(overlay)
			setDropLocation();
		
		setTableHeight();
		setRowWidth();
	});
	
	//== Drag files ==
	$('.drop').bind('dragover', function(event){
		dndPrep(event);
	});
	
	//== Support IE ==
	$('.drop').bind('dragenter', function(event){
		dndPrep(event);
	});
	
	//== Drop files ==
	$('.drop').bind('drop', function(event){
		dndPrep(event);
		
		if(overlay)
			removeOverlay();
		
		readFiles(event.dataTransfer.files);
	});
	
	//== Select files ==
	$('.fileInput').click(function(){
		$('input[type=file]').click();
	});
	
	//== Triggered by select files ==
	$('input[type=file]').change(function(event){
		if(overlay)
			removeOverlay();
		
		readFiles(event.target.files);
	});
	
	//== Check/uncheck all ==
	$('#check input[type=checkbox]').click(function(){
		if($(this).is(':checked'))
			$('.check input[type=checkbox]').prop('checked', true);
		else
			$('.check input[type=checkbox]').prop('checked', false);
	});
	
	//== Delete selected ==
	$('#delete button').live('click', function(){
		$('.check :checked').parent().parent().remove();
		$('#check :checked').prop('checked', false);
		checkList();
	});
	
	//== Delete single song ==
	$('.delete button').live('click', function(){
		$(this).parent().parent().remove();
		checkList();
	});
	
	//== Play song from list ==
	$('.play button').live('click', function(){
		playSong($(this).parent().parent());
	});
});