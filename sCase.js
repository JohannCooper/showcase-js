"use strict";

var $,
	sCase = $ = function() {
/** 
 * sCase (Showcase) is a small javascript library for svg manipulation 
 * written for the Tull Family Theater Showcase project
 **/
	window.requestAnimationFrame =
		window.requestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		window.oRequestAnimationFrame;

	Date.prototype.toTimeString = function() {
		var current_hour = (this.getHours() % 12 == 0 ? 12 : this.getHours() % 12),
			current_ampm = (this.getHours() < 12 ? "AM" : "PM"),
			current_minute = (this.getMinutes() < 10 ? "0" : "") + this.getMinutes(),
			timeString = current_hour + ":" + current_minute + " " + current_ampm;
		return timeString;
	};

	String.prototype.reverse = function() {
		var s = "", i;
		for (i = this.length - 1; i >= 0; i--) {
			s += this[i];
		}
		return s;
	};

	var // stores any library already using $ identifier
		collisionLibrary = $;

	function releaseAlias() {
	/// sets $ identifier to previously defined library
		$ = collisionLibrary;
	}


	var mod_display = function() {
		var // the root SVG.js element
			frame,
			// frame width and frame height
			fW, fH,
			// grid width and grid height
			gW, gH,
			// stores any library already using $ identifier
			collisionLibrary = $,
			active = false,
			currentSlide,
			currentSlideIndex,
			cueSlideID;

		function init(id, width, height) {
		/// initializes sCase
		/// returns root SVG.js element
			frame = SVG(id);
			if (width && height) {
				gW = gH = util.gcf(width, height);
				fW = width;
				fH = height;
				frame.size(fW, fH);
			}
			frame.rect(width - 20,  height - 20).fill(assets.colors.teal).move(10, 10);
			return frame;
		}
		function grid(width, height) {
		/// sets or gets grid values
			if (width) {
				gW = width;
				gH = height || width;
			} else { 
				return [gW, gH];
			}
		}



		function Template(name, duration, populate) {
		/// Template constructor
		/// populate is a callback function with arguments svg (SVG.js SVGElement Object) and data (Object specified as necessary for template)
		/// all templates are stored in the directory
			if (Template.dir[name]) {
				throw new TypeError("Template naming collision: " + name);
			}
			this.name = name;
			this.duration = duration;
			this.populate = populate;
			Template.dir[name] = this;
		}
		Template.dir = {};
		Template.createSlides = function(templateName, data, filmsListing, itemsPerSlide, subname) {
			var slides = [],
				firstItemIndex = 0,
				lastItemIndex = itemsPerSlide[0],
				len = itemsPerSlide.length,
				i;

			if (subname) {
				subname = ": " + subname;
			} else {
				subname = "";
			}

			for (i = 0; i < len; i++) {
				data.films = filmsListing.slice(firstItemIndex, lastItemIndex);
				// data.page = (i + 1) + " of " + len;
				firstItemIndex = lastItemIndex;
				lastItemIndex += itemsPerSlide[i + 1];

				slides.push(
					Template.dir[templateName].createSlide(templateName + subname + " " + i, data)
				);
			}
			return new Slides(slides);
		}
		Template.prototype.createSlide = function(name, data) {
		/// creates a slide through template's populate function
		/// note that the teal background is automatically created for all slides
			if (Slide.dir[name]) {
				throw new TypeError("Slide naming collision: " + name);
			}

			// create SVG.js object and paint background
			var svg = frame.group();

			this.populate(svg, data);
			svg.opacity(0);

			return new Slide(name, this.name, data, svg);
		}



		function Slides(items) {
			this.items = items;
			this.length = items.length;
		}
		Slides.prototype.addToQueue = function() {
			Array.prototype.push.apply(Slide.queue, this.items);
			Slide.queueLen += this.length;
		}
		Slides.prototype.delete = function() {
			var len = this.items.length,
				i;
			for (i = 0; i < len; i++) {
				this.items[i].delete();
			}
		}



		function Slide(name, tempName, data, svg) {
		/// Slide constructor
		/// all slides are stored in slide directory
			this.name = name;
			this.type = tempName;
			this.duration = Template.dir[tempName].duration;
			this.data = data;
			this.svg = svg;
			Slide.dir[name] = this;
		}
		Slide.requestSlideshowRefresh = false;
		Slide.dir = {};
		Slide.queue = [];
		Slide.queueLen = 0;
		Slide.clear = function() {
			var slideName,
				currentSlideName = currentSlide ? currentSlide.name : null;
			for (slideName in Slide.dir) {
				if (!Slide.dir.hasOwnProperty(slideName) ||
						slideName === currentSlideName) {
					continue;
				}

				Slide.dir[slideName].svg.remove();
			}
			Slide.dir = {};
			Slide.queue = [];
			Slide.queueLen = 0;
		};
		Slide.beginSlideshow = function() {
			currentSlideIndex = 0;
			currentSlide = Slide.queue[currentSlideIndex];
			Slide.displayNextSlide();
		};
		Slide.displayNextSlide = function() {
			currentSlide.svg.opacity(0);
			if (Slide.requestSlideshowRefresh) {
				Slide.requestSlideshowRefresh = false;
				currentSlide.svg.remove();
			}

			// move to next slide
			currentSlideIndex = (currentSlideIndex + 1) % Slide.queueLen;
			currentSlide = Slide.queue[currentSlideIndex];
			currentSlide.svg.opacity(1);

			setTimeout(Slide.displayNextSlide, currentSlide.duration);
		};
		Slide.prototype.addToQueue = function() {
			Slide.queue.push(this);
			Slide.queueLen++;
		}
		Slide.prototype.delete = function() {
		/// removes a slide from directory and shifts all other slides' indecies down
			var i = 0;
			while (i < Slide.queueLen) {
				if (Slide.queue[i] === this) {
					Slide.queue.splice(i, 1);
					Slide.queueLen--;
				} else {
					i++;
				}
			}
			this.svg.remove();
			delete Slide.dir[this.name];
		};



		var assets = {};
		// assets.logo contains the SVG.js Element and can be rendered with SVG.use();
		assets.fonts = {
		// used for headers
			header1 : {
				family : "arcon"
			,	size : 108
			,	anchor : "middle"
			}
		,	header1Left : {
				family : "arcon"
			,	size : 108
			}
		,	header2Left : {
				family : "arcon"
			,	size : 72
			}
		,	showtimes : {
				family : "groteskBold"
			,	size : 60
			,	anchor : "middle"
			}		
		,	copy : {
				family : "grotesk"
			,	size : 60
			,	leading : 1.15
			,	anchor : "middle"
			}	
		};
		assets.colors = {
			// teal : "#07A7AD"
			teal : "#05767a"
		,	white : "#FFFFFF"
		,	transparent : "none"
		};
		assets.strokes = {
			showtimes : {
				width: 5
			,	color: assets.colors.white
			}
		};


		function splitIntoLines(s) {
			// splits string s into lines with maximum character length of indexAdvance
			var string = "",
				indexAdvance = 25,
				lastIndex = 0,
				lineLength,
				snippet,
				lines = 1;

			while (s.length - lastIndex > indexAdvance) {
				snippet = s.substr(lastIndex, indexAdvance).reverse();
				lineLength = snippet.length - snippet.search(/\s+/) - 1;
				string += s.substr(lastIndex, lineLength) + '\n';
				lastIndex += lineLength;
				lines++;
			}
			string += s.substr(lastIndex);
			return { 
				text : string,
				lines : lines
			};
		}

		return /* mod_display = */ {
			init : init
		,	grid : grid
		,	Template : Template
		,	Slide : Slide
		,	Slides : Slides
		,	assets : assets
		,	active : active
		,	splitIntoLines : splitIntoLines
		};
	}();



	var mod_data = function() {
		var filmsToday = [],
			filmsComingSoon = [],
			XMLRequests = [
				{
					callback : getFilmsToday,
					url : "https://api.us.veezi.com/v1/session"
				},
				
				{
					callback : getFilmPosters,
					url : "https://api.us.veezi.com/v1/film"
				},

				{
					callback : getFilmsComingSoon,
					url : "https://api.us.veezi.com/v1/film"
				}
			],
			brandingQuips,
			brandingSlogans,
			featureSlides,
			itemsPerSlideMap = [
				[1], [2], [3], [4],
				[3, 2], [3, 3], [4, 3], [4, 4],
				[3, 3, 3], [4, 3, 3], [4, 4, 3], [4, 4, 4]
			];

		function getRandomIndex(array) {
			return array[Math.floor(Math.random() * array.length)];
		}
		function setBrandingSlogans(bS) {
			brandingSlogans = bS;
		}
		function setBrandingQuips(bQ) {
			brandingQuips = bQ;
		}
		function setFeatureSlides(fS) {
			featureSlides = fS;
		}

		function constructSlides() {
			mod_display.Slide.clear();

			var showtimesID = 1,
				itemsPerSlide,
				itemCount,
				len, i;


			var slides,
				slideSets = {};

			itemCount = filmsToday.length;
			if (itemCount) {
				// create multiple showtimes set
				itemsPerSlide = itemsPerSlideMap[itemCount - 1];
				slideSets.multipleShowtimes = 
					mod_display.Template.createSlides("Multiple Showtimes", {}, filmsToday, itemsPerSlide);

				// create playing films set
				slides = [];
				for (i = 0; i < itemCount; i++) {
					slides.push(
						mod_display.Template.dir["Playing Film"].createSlide(filmsToday[i].title, filmsToday[i])
					);
				}
				slideSets.playingFilms = new mod_display.Slides(slides);
			}

			// create coming soon slides
			itemCount = filmsComingSoon.length;
			if (itemCount) {
				itemsPerSlide = itemsPerSlideMap[itemCount - 1];
				slideSets.comingSoon =
					mod_display.Template.createSlides("Film Listings", { title : "Coming Soon" }, filmsComingSoon, itemsPerSlide, "CS");
			}

			// create feature slides
			itemCount = featureSlides.length;
			if (itemCount) {
				slides = [];
				for (i = 0; i < itemCount; i++) {
					slides.push(
						mod_display.Template.dir["Feature"].createSlide("Feature " + (i + 1), featureSlides[i])
					);
				}
				slideSets.featureSlides = new mod_display.Slides(slides);
			}

			// create branding slogans slide
			if (brandingSlogans.length) {
				slideSets.brandingSlogans = mod_display.Template.dir["Branding Slogan"].createSlide("Slogan",
					{ text : getRandomIndex(brandingSlogans) }
				);
			}

			// create branding quips slide
			if (brandingQuips.length) {
				slideSets.brandingQuips = mod_display.Template.dir["Branding Quips"].createSlide("Quips",
					{ text : getRandomIndex(brandingQuips) }
				);
			}


			// construct slide order
			// ugly code to test existance of slideSets member before adding slides to queue
			slideSets.brandingSlogans 	&& (slideSets.multipleShowtimes.addToQueue(), slideSets.brandingSlogans.addToQueue());
			slideSets.playingFilms 		&& (slideSets.multipleShowtimes.addToQueue(), slideSets.playingFilms.addToQueue());
			slideSets.brandingQuips 	&& (slideSets.multipleShowtimes.addToQueue(), slideSets.brandingQuips.addToQueue());
			slideSets.comingSoon 		&& (slideSets.multipleShowtimes.addToQueue(), slideSets.comingSoon.addToQueue());
			slideSets.featureSlides 	&& (slideSets.multipleShowtimes.addToQueue(), slideSets.featureSlides.addToQueue());


			if (mod_display.active) {
				mod_display.Slide.requestSlideshowRefresh = true;
			} else {
				mod_display.active = true;
				mod_display.Slide.beginSlideshow();
			}
			// scheduleUpdate(1,0,constructSlides);
			scheduleUpdate(15, 7.5, constructSlides);
		}

		function scheduleUpdate(minutesToRefresh, minutesToLag, callback) {
			var millisPerInterval = 1000 * 60 * minutesToRefresh,
				padInterval = 1000 * 60 * minutesToLag,
				millisPastInterval = getCurrentTime().getTime() % millisPerInterval,
				millisUntilInterval = millisPerInterval - millisPastInterval + padInterval;

			setTimeout(callback, millisUntilInterval);
		}

		// function scheduleListingsUpdate() {
		// 	var // number of minutes the system should take to refresh
		// 		minutesToRefresh = 60 * 24,
		// 		// minutes to lag behind the interval
		// 		minutesToLag = 1,
		// 		millisPerInterval = 1000 * 60 * minutesToRefresh,
		// 		padInterval = 1000 * 60 * minutesToLag,
		// 		millisPastInterval = getCurrentTime() % millisPerInterval,
		// 		millisUntilInterval = millisPerInterval - millisPastInterval + padInterval;

		// 	setTimeout(requestFilmListings, millisUntilInterval);
		// }

		function requestFilmListings(step) {
			step = step || 0;
			if (step >= XMLRequests.length) {
				constructSlides();
				// scheduleUpdate(5,0,requestFilmListings);
				scheduleUpdate(24 * 60, 5 * 60 + 1, requestFilmListings);
				return;
			}
			jQuery.ajax({
				url : XMLRequests[step].url,
				dataType : "json",
				headers : { "VeeziAccessToken" : "insert Veezi key here" },
				success : XMLRequests[step].callback,
				complete : function() { requestFilmListings(step + 1); }
			});
		}

		function getFilmsToday(showings) {
			var filmsTodayDir = {},
				today = getCurrentTime(),
				todayString,
				title,
				film,
				filmTime,
				len = showings.length,
				i;

			today.setHours(2);
			todayString = today.toDateString();

			filmsToday = [];
			for (i = 0; i < len; i++) {
				if (showings[i].Status === "Planned" ||
						showings[i].Staus === "Closed")
					continue;
				filmTime = new Date(showings[i].PreShowStartTime);
				if (filmTime.toDateString() === todayString) {
					title = showings[i].Title;
					if (filmsTodayDir[title]) {
						// film already exists in directory 
						// because film members are objects on filmsTodayDir,
						// the array filmsToday will be affected by these changes too.
						filmsTodayDir[title].showtimes.push(filmTime);
					} else {
						film = {
							title : showings[i].Title,
							showtimes : [filmTime],
							image : null
						};
						filmsTodayDir[title] = film;
						filmsToday.push(film);
					}
				}
			}

			len = filmsToday.length;
			for (i = 0; i < len; i++) {
				filmsToday[i].showtimes.sort();
			}
		}

		function getFilmPosters(films) {
			var filmsLen = films.length,
				filmsTodayLen = filmsToday.length,
				title,
				signageText,
				i,
				j;
			for (i = 0; i < filmsTodayLen; i++) {
				title = filmsToday[i].title;
				for (j = 0; j < filmsLen; j++) {
					if (films[j].Title === title) {
						signageText = films[j].SignageText;
						if (title.indexOf(signageText) !== -1) {
							// use low res thumbnail
							filmsToday[i].image = films[j].FilmPosterThumbnailUrl;

						} else {
							// use high res imgur link
							filmsToday[i].image = "http://i.imgur.com/" + films[j].SignageText + ".jpg"
						}
						// filmsToday[i].posterURL = films[j].FilmPosterUrl;
						break;
					}
				}
			}
		}

		function getFilmsComingSoon(films) {
			var film,
				len = films.length,
				i;
			for (i = 0; i < len; i++) {
				// films coming soon are denoted with national code === "Coming Soon" in Veezi
				if (films[i].NationalCode === "Coming Soon" &&
					films[i].Status !== "Deleted") {
					film = {
						title : films[i].Title,
						image : "http://i.imgur.com/" + films[i].SignageText + ".jpg"
						// posterURL : films[i].FilmPosterUrl;
					};
					filmsComingSoon.push(film);
					console.log(films[i]);
				}
			}
		}



		function getCurrentTime() {
			var now = new Date(),
				hours = now.getHours(),
				min = now.getMinutes();
			// New York time is four hours behind GTC
			// now.setHours(hours);
			// now.setMinutes(min - 2);
			now.setHours(hours - 5);

			return now;
		}

		function getNextShowtime(showtimes) {
			var currentTime = getCurrentTime(),
				len = showtimes.length,
				i;
			for (i = 0; i < len; i++) {
				if (showtimes[i] > currentTime) {
					break;
				}
			}
			return i;
		}

		return /* mod_data = */ {
			filmsToday : filmsToday
		,	filmsComingSoon : filmsComingSoon
		,	requestFilmListings : requestFilmListings
		,	constructSlides : constructSlides
		,	setBrandingSlogans : setBrandingSlogans
		,	setBrandingQuips : setBrandingQuips
		,	setFeatureSlides : setFeatureSlides
		,	getCurrentTime : getCurrentTime
		,	getNextShowtime : getNextShowtime
		};
	}();

	var util = function() {
	// some utility functions only accessible within sCase
		function gcf(a, b) {
		//greatest common factor
			if (a === 0) return b;
			if (b === 0) return a;
			while (true) {
				a %= b;
				if (a === 0) return Math.abs(b);
				b %= a;
				if (b === 0) return Math.abs(a);
			}
		}
		return /* util = */ {
			gcf : gcf
		};
	}();

	return /* sCase = */ {
		display : mod_display,
		data : mod_data,
		releaseAlias : releaseAlias
	};

}();



new $.display.Template("Multiple Showtimes", 20 * 1000, function(svg, data) {
	var a = $.display.assets, 
		// get grid sizes
		grid = $.display.grid(),
		gW = grid[0],
		gH = grid[1],
		timeSVG,
		width,
		height,
		left,
		top,
		offsetX,
		offsetY,
		title,
		showtimes,
		timeString,
		nextShowtime,
		showtimeBoxFill,
		showtimeBoxStroke = a.strokes.showtimes,
		showtimeTextFill,
		showtimeTextFont = a.fonts.showtimes,
		filmsLen, showtimesLen, i, j;

	var updateTime = function() {
		var lastTS;
		return function(timeStamp) {
			if (!lastTS) {
				lastTS = timeStamp - 2000;
			}
			if (timeStamp - lastTS > 500) {
				// update whatever has time
				var currentTime = $.data.getCurrentTime()
				timeSVG.text(currentTime.toTimeString());

				lastTS = timeStamp;
			}
			requestAnimationFrame(updateTime);
		};
	}();

	//draw theater logo
	svg.image('logos\\fullLogo.svg', 656, 127).x(gW).y(gH / 2)

	//write current time
	timeSVG = svg.text("Current Time").cx(gW * 14).cy(gH / 4)
				 .font(a.fonts.header1).fill(a.colors.white);

	// paint showtimes
	filmsLen = data.films.length;
	width = 2 * gW;
	height = 0.75 * gH;

	for (i = 0; i < filmsLen; i++) {
		title = data.films[i].title;
		showtimes = data.films[i].showtimes;
		showtimesLen = showtimes.length;
		nextShowtime = $.data.getNextShowtime(showtimes);

		//draw titles
		left = gW;
		top = 2 * gH;
		offsetY = 1.75 * gH * i;
		svg.text(title).font(a.fonts.header2Left).fill(a.colors.white)
			.x(left).cy(top + offsetY);

		left = 2 * gW;
		top = 2.75 * gH;

		//draw movie showtimes
		for (j = 0; j < showtimesLen; j++) {
			timeString = showtimes[j].toTimeString();
			if (j === nextShowtime) {
				showtimeBoxFill = a.colors.white;
				showtimeTextFill = a.colors.teal;
			} else {
				showtimeBoxFill = a.colors.transparent;
				showtimeTextFill = a.colors.white;
			}

			offsetX = 3 * gW * j;

			svg.rect(width, height).stroke(showtimeBoxStroke).fill(showtimeBoxFill)
				.cx(left + offsetX).cy(top + offsetY);
			svg.text(timeString).font(showtimeTextFont).fill(showtimeTextFill)
				.x(left + offsetX).cy(top + offsetY);
							 
		}
	}

	// svg.text("Page " + data.page).font(a.fonts.page).fill(a.colors.white)
	// 	.x(13 * gW).y(8 * gH);

	requestAnimationFrame(updateTime);
});

new $.display.Template("Film Listings", 5 * 1000, function(svg, data) {
/* 	data = {
		title : STRING of slide title ("Now Showing" or "Coming Soon")
		films : ARRAY of film objects taking the form {
			title : STRING of film title
			image : STRING of link to film poster images
			showtimes : ARRAY of strings of showtimes
		}
	}
*/

	var a = $.display.assets,
		// get grid sizes
		grid = $.display.grid(),
		gW = grid[0],
		gH = grid[1],
		width = 3 * gW,
		height = 4.5 * gH,
		borderWidth = width + 20,
		borderHeight = height + 20,
		len = data.films.length,
		sectionWidth = 3.75 * len * gW - gW,
		frameWidth = 16 * gW,
		left,
		top,
		offsetX,
		i;

	//write slide title
	left = 8 * gW;
	top = gH;
	svg.text(data.title).font(a.fonts.header1).fill(a.colors.white).x(left).cy(top);

	// add logo
	left = 8 * gW;
	top = 8 * gH;
	svg.image("logos\\fullLogo.svg", 656, 127).cx(left).cy(top);

	// paint movie posters
	left = (frameWidth - sectionWidth) / 2,
	top = 2.25 * gH;
	for (i = 0; i < len; i++) {
	
		svg.image(data.films[i].image).loaded(function(xPos) {
			return function(loader) {
				// height = 4 * gW / loader.width * loader.height;
				// this.size(width).move(1.5 * gW, 1.5 * gH);
				offsetX = 3.75 * gW * xPos;
				this.size(width, height).move(left + offsetX, top);

				// place border around image
				svg.rect(width + 20, height + 20).after(this).move(left + offsetX- 10, top - 10)
					.fill(a.colors.white);

			};
		}(i))

	}

	//write page number
	// svg.text("Page " + data.page).font(a.fonts.page).fill(a.colors.white)
	// 	.x(13 * gW).y(8 * gH);
});

new $.display.Template("Playing Film", 3 * 1000, function(svg, data) {
/* {
	title : STRING of film title
	image : STRING of link to film poster images
	showtimes : ARRAY of strings of showtimes
} */
	var a = $.display.assets, 
		// get grid sizes
		grid = $.display.grid(),
		titleData = $.display.splitIntoLines(data.title),
		gW = grid[0],
		gH = grid[1],
		width,
		height,
		left,
		top,
		offsetY,
		nextShowtime,
		timeString,
		showtimeBoxFill,
		showtimeBoxStroke = a.strokes.showtimes,
		showtimeTextFill,
		showtimeTextFont = a.fonts.showtimes,
		len, i;

	// paint movie poster
	svg.image(data.image).loaded(function(loader) {
		var width = 4 * gW,
			height = 6 * gH,
			left = 1.5 * gW,
			top = 1.5 * gH;
		// height = 4 * gW / loader.width * loader.height;
		this.size(width, height).move(left, top);

		// add border
		svg.rect(width + 20, height + 20).after(this).move(left - 10, top - 10)
			.fill(a.colors.white);
	})

	// write movie title
	svg.text(titleData.text).font(a.fonts.header1).fill(a.colors.white).move(10.5 * gW, gH);

	// paint showtimes
	len = data.showtimes.length;
	nextShowtime = $.data.getNextShowtime(data.showtimes);
	width = 2 * gW;
	height = gH;
	left = 10.5 * gW;
	top = 3 * gH + (titleData.lines - 1) * 1.25 * gH;

	for (i = 0; i < len; i++) {
		timeString = data.showtimes[i].toTimeString();
		if (i === nextShowtime) {
			showtimeBoxFill = a.colors.white;
			showtimeTextFill = a.colors.teal;
		} else {
			showtimeBoxFill = a.colors.transparent;
			showtimeTextFill = a.colors.white;
		}
		offsetY = 1.25 * gH * i;

		svg.rect(width, height).stroke(showtimeBoxStroke).fill(showtimeBoxFill)
			.cx(left).cy(top + offsetY);
		svg.text(timeString).font(showtimeTextFont).fill(showtimeTextFill)
			.x(left).cy(top + offsetY);
	}

	// draw logo
	svg.image("logos\\fullLogo.svg", 656, 127).cx(10.5 * gW).cy(8.125 * gH)

	// svg.text("Film " + data.page).font(a.fonts.page).fill(a.colors.white)
	// 	.x(1.5 * gW).y(8 * gH);
});

new $.display.Template("Branding Slogan", 3 * 1000, function(svg, data) {
	var grid = $.display.grid(),
		a = $.display.assets,
		gW = grid[0],
		gH = grid[1],
		left = 586, // pixels
		top = 240; // pixels

	svg.image('logos\\logoIcon.svg', 656, 480).x(left).y(top);

	left = 8 * gW;
	top = 7 * gH;
	svg.text(data.text).font(a.fonts.header1).fill(a.colors.white).x(left).cy(top);
});

new $.display.Template("Branding Quips", 3 * 1000, function(svg, data) {
	var grid = $.display.grid(),
		a = $.display.assets,
		gW = grid[0],
		gH = grid[1],
		left = 940, // pixels
		top = 270; // pixels

	svg.image('logos\\logoIcon.svg', 656, 480).x(left).y(top);

	left = 2 * gW;
	top = 4.5 * gH;
	svg.text(data.text).font(a.fonts.header1Left).fill(a.colors.white).x(left).cy(top);
});

new $.display.Template("Feature", 3 * 1000, function(svg, data) {
	var grid = $.display.grid(),
		a = $.display.assets,
		gW = grid[0],
		gH = grid[1],
		greaterDimension,
		imgWidth,
		imgHeight,
		width,
		height,
		margin,
		left, // pixels
		top; // pixels

	svg.image("images\\" + data.image).loaded(function(loader) {
		// greater dimension will take up 6 gridwidths
		greaterDimension = Math.max(loader.width, loader.height);
		imgWidth = 6 * gW * loader.width / greaterDimension;
		imgHeight = 6 * gH * loader.height / greaterDimension;
		left = 1.5 * gW;
		top = 1.5 * gH;
		this.size(imgWidth, imgHeight).move(top, left);

		// add border
		svg.rect(imgWidth + 20, imgHeight + 20).after(this).move(left - 10, top - 10)
			.fill(a.colors.white);

		// center text over remaining portion of slide
		margin = 4 * gW;
		width = 16 * gW - margin - imgWidth;
		left = 2.5 * gW + imgWidth + width / 2;


		svg.text(data.title).font(a.fonts.header1).fill(a.colors.white)
			.move(left, top);

		top = 3 * gH;
		svg.text(data.text).font(a.fonts.copy).fill(a.colors.white)
			.move(left, top);

		svg.image("logos\\fullLogo.svg", 656, 127).cx(left).cy(8.125 * gH);
	});
});

// new $.display.Template("Full Screen Feature", 12 * 1000, function(svg, data) {
// 	var grid = $.display.grid(),
// 		a = $.display.assets,
// 		gW = grid[0],
// 		gH = grid[1],
// 		leastDimension,
// 		imgWidth,
// 		imgHeight,
// 		width,
// 		height,
// 		margin,
// 		left, // pixels
// 		top; // pixels

// 	//load background image
// 	svg.image("images\\sample4.png").loaded(function(loader) {
// 		// greater dimension will take up 6 gridwidths
// 		leastDimension = Math.min(loader.width, loader.height);
// 		imgWidth = 6 * gW * loader.width / leastDimension;
// 		imgHeight = 6 * gH * loader.height / leastDimension;
// 		left = 1.5 * gW;
// 		top = 1.5 * gH;
// 		this.size(imgWidth, imgHeight).move(10, 10);

// 		// add border
// 		svg.rect(imgWidth + 20, imgHeight + 20).after(this).move(left - 10, top - 10)
// 			.fill(a.colors.white);

// 		// center text over remaining portion of slide
// 		margin = 4 * gW;
// 		width = 16 * gW - margin - imgWidth;
// 		left = 2.5 * gW + imgWidth + width / 2;


// 		svg.text("Your Title Here").font(a.fonts.header1).fill(a.colors.white)
// 			.move(left, top);

// 		top = 3 * gH;
// 		var text = "Lorem ipsum dolor sit amet,\nconsectetur adipiscing elit.\nCurabitur ac auctor felis.\nPhasellus a aliquet est.\nAliquam non pulvinar mi.\nMorbi lacus mi, tristique vel\nligula eget, auctor pulvinar sem."
// 		svg.text(text).font(a.fonts.copy).fill(a.colors.white)
// 			.move(left, top);


// 		svg.image("logos\\fullLogo.svg", 656, 127).cx(left).cy(8.125 * gH);
// 	});
// });