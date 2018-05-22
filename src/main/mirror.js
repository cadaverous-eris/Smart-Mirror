// Google API stuff (for Calendar)
const GOOGLE_CLIENT_ID = '886368316284-kk0d6tcnupooiacnhts3bbj5igd8vri3.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyBn4GZL3ykf8_qt1tEvF-yyINb8RPvZLmk';
const GOOGLE_DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

// Weather API stuff
const OWM_API_KEY = '70b5674ba55c47e1b4f1f12569624225';
const city = 'Washington';
const state = 'DC';

// Google login and logout buttons 
var authorizeButton;
var signoutButton;

$(document).on('ready', () => {
	
	// date and time elements
	var date = $('#date');
	var time = $('#time');
	var clock = document.getElementById('clock');
	var ctx = clock.getContext('2d');
	
	// init Google login and logout buttons
	authorizeButton = $('#authorize-button');
  signoutButton = $('#signout-button');
	
	// get initial time and weather
	updateTime();
	getWeather();
	
	// update time every second
	setInterval(updateTime, 1000);
	
	// update weather every 15 minutes
	setInterval(getWeather, 900000);
	
	// draw the clock with the current time
	function drawClock() {
		$('#clock-col').height($('#date-time').height());
		
		let dim = $(clock).width();
		
		clock.width = dim;
		clock.height = dim;
		clock.style.width = dim;
		clock.style.height = dim;
		
		let now = new Date();
		let hour = now.getHours();
		hour = hour % 12;
    let minute = now.getMinutes();
		let second = now.getSeconds();
		
		ctx.strokeStyle = '#FFFFFF';
		ctx.fillStyle = '#FFFFFF';
		ctx.lineWidth = 4;
		ctx.beginPath();
		let radius = (dim / 2) - ctx.lineWidth;
		ctx.arc(dim / 2, dim / 2, radius, 0, 2 * Math.PI);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.arc(dim / 2, dim / 2, 3, 0, 2 * Math.PI);
		ctx.fill();
		
		hour = (hour * Math.PI / 6) + (minute * Math.PI / (6 * 60)) + (second * Math.PI / (360 * 60));
		drawHand(hour, radius * 0.5, 4);
		minute = (minute * Math.PI / 30) + (second * Math.PI / (30 * 60));
		drawHand(minute, radius * 0.8, 3);
		
		function drawHand(t, length, width) {
			ctx.lineWidth = width;
			
			ctx.beginPath();
			ctx.translate(dim / 2, dim / 2);
			ctx.moveTo(0, 0);
			ctx.rotate(t);
			ctx.lineTo(0, -length);
			ctx.stroke();
			ctx.rotate(-t);
			ctx.translate(-dim / 2, -dim / 2);
		}
	}
	
	// get the current time and update the display
	function updateTime() {
		date.text(moment().format('dddd, MMMM Do YYYY'));
		time.text(moment().format('h:mm a'));
		
		drawClock();
	}
	
});

// get the current weather and update the display
function getWeather() {
	let query = "https://api.openweathermap.org/data/2.5/weather?" +
		"q=" + city + "&units=imperial&appid=" + OWM_API_KEY;
	
	$.ajax({
		url: query,
		method: "GET"
	}).done(data => {
		if (!data) return;
		
		if (data.main && data.main.temp && data.weather && data.weather.length > 0) {
			$('#temp').text(data.main.temp.toFixed(1) + '\xB0' + 'F');
			
			$('#weather-main > i').remove();
			
			let weatherData = data.weather[0];
			
			let icon = $('<i>');
			let time = weatherData.icon.endsWith('d') ? 'day-' : weatherData.icon.endsWith('n') ? 'night-' : '';
			let iconClass = 'wi wi-owm-' + time + weatherData.id;
			icon.addClass(iconClass);
			$('#weather-main').prepend(icon);
			
			let conditions = weatherData.description;
			$('#weather-conditions').text(titleCase(conditions));
			
			//console.log(data);
		}
	});
	
	query = 'https://query.yahooapis.com/v1/public/yql?q=select * from weather.forecast where woeid in (select woeid from geo.places(1) where text="' + city.toLowerCase() + ', ' + state.toLowerCase() + '")&format=json';
	$.ajax({
		url: query,
		method: "GET"
	}).done(data => {
		if (!data || !data.query || !data.query.results || !data.query.results.channel) return;
		
		console.log(data.query.results.channel);
		
		if (!data.query.results.channel.item || !data.query.results.channel.item.forecast) return;
		
		let forecast = data.query.results.channel.item.forecast;
		
		if (forecast.length > 0) {
			$('#temp-high').text(forecast[0].high + '\xB0' + 'F');
			$('#temp-low').text(forecast[0].low + '\xB0' + 'F');
		}
		
	});
}

// on load, called to load the auth2 library and Google API client library
function handleClientLoad() {
	gapi.load('client:auth2', initClient);
}

// initializes the Google API client library and sets up sign-in state listeners
function initClient() {
	gapi.client.init({
		apiKey: GOOGLE_API_KEY,
		clientId: GOOGLE_CLIENT_ID,
		discoveryDocs: GOOGLE_DISCOVERY_DOCS,
		scope: GOOGLE_SCOPES
	}).then(function () {
		// listen for sign-in state changes.
		gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

		// handle the initial sign-in state.
		updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
		authorizeButton.on('click', handleAuthClick);
		signoutButton.on('click', handleSignoutClick);
	});
}

// called when the signed in status changes to update the UI appropriately
// after a sign-in, the API is called
function updateSigninStatus(isSignedIn) {
	if (isSignedIn) {
		authorizeButton.css('display', 'none');
		signoutButton.css('display', 'block');
		listUpcomingEvents();
	} else {
		authorizeButton.css('display', 'block');
		signoutButton.css('display', 'none');
	}
}

// sign in the user upon button click
function handleAuthClick(event) {
	gapi.auth2.getAuthInstance().signIn();
}

// sign out the user upon button click
function handleSignoutClick(event) {
	gapi.auth2.getAuthInstance().signOut();
}

/**
 * append a pre element to the body containing the given message
 * as its text node
 * used to display the results of the API call
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
	var pre = $('#content');
	pre.append(document.createTextNode(message + '\n'));
}

/**
 * Print the summary and start datetime/date of the next ten events in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
function listUpcomingEvents() {
	gapi.client.calendar.events.list({
		'calendarId': 'primary',
		'timeMin': (new Date()).toISOString(),
		'showDeleted': false,
		'singleEvents': true,
		'maxResults': 10,
		'orderBy': 'startTime'
	}).then(function(response) {
		var events = response.result.items;
		appendPre('Upcoming events:');

		if (events.length > 0) {
			for (i = 0; i < events.length; i++) {
				var event = events[i];
				var when = event.start.dateTime;
				if (!when) {
					when = event.start.date;
				}
				appendPre(event.summary + ' (' + when + ')')
			}
		} else {
			appendPre('No upcoming events found.');
		}
	});
}

function titleCase(str) {
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
