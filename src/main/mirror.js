// Google API stuff (for Calendar)
const GOOGLE_CLIENT_ID = '886368316284-kk0d6tcnupooiacnhts3bbj5igd8vri3.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyBn4GZL3ykf8_qt1tEvF-yyINb8RPvZLmk';
const GOOGLE_DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

// OpenWeatherMap API stuff
const OWM_API_KEY = '70b5674ba55c47e1b4f1f12569624225';
const city = 'Washington';
const state = 'DC';

// Dark Sky API Weather stuff
const DARK_SKY_API_KEY = 'a02966f9f5e7bbe9cf6a385b474944d3';

// Google login and logout buttons 
var authorizeButton;
var signoutButton;

$(document).on('ready', () => {
	
	// date and time elements
	var date = $('#date');
	var time = $('#time');
	
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
	
	// get the current time and update the display
	function updateTime() {
		let prevDay = date.text();
		let currentDay = moment().format('dddd, MMMM Do YYYY');
		
		date.text(currentDay);
		time.text(moment().format('h:mm a'));
		
		if (prevDay !== currentDay) {
			/*let query = 'https://holidayapi.com/v1/holidays?key=' + HOLIDAY_API_KEY +
				'&country=US&year=' + moment().get('year') +
				'&month=' + (moment().get('month') + 1) +
				'&day=' + moment().get('date');
			$.ajax({
				url: query,
				method: "GET"
			}).done(res => {
				if (res.holidays.length > 0) {
					let holidays = res.holidays.map(holiday => {
						return holiday.public ? '<strong>' + holiday.name + '</strong>' : holiday.name;
					}).join(', ');
					$('#holiday-holder').html('<h5>' + holidays + '</h5>');
				} else {
					$('#holiday-holder').empty();
				}
			});*/
		}
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
			
			$('#weather-weekly').empty();
			for (let i = 1; i < 6 && i < forecast.length; i++) {
				let col = $('<div>').addClass('col');
				let panel = $('<div>').addClass('panel daily-forecast');
				let dayWeather = forecast[i];
				
				panel.append($('<p>').addClass('day').text(dayWeather.day.toUpperCase()));
				panel.append($('<i>').addClass('wi wi-yahoo-' + dayWeather.code));
				panel.append($('<p>').addClass('daily-high').text(dayWeather.high + '\xB0' + 'F'));
				panel.append($('<p>').addClass('daily-low').text(dayWeather.low + '\xB0' + 'F'));
				
				col.append(panel);
				$('#weather-weekly').append(col);
			}
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
		var content = $('#content');
		content.empty();
		
		if (events.length > 0) {
			content.prepend('<h5>Upcoming events:</h5>');
			var list = $('<ul>');
			
			for (i = 0; i < events.length; i++) {
				let event = events[i];
				
				let when = event.start.dateTime;
				if (!when) {
					when = event.start.date;
				}
				let date = moment(when).format("dddd, M/D/YY, h:mm a");
				var listItem = $('<li>').text(event.summary + ' (' + date + ')');
				list.append(listItem);
			}
			
			content.append(list);
		} else {
			content.prepend('<h5>No upcoming events found</h5>');
		}
	});
}

function titleCase(str) {
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
