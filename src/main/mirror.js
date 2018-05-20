const WEATHER_API_KEY = '70b5674ba55c47e1b4f1f12569624225';

const city = 'Washington';

const UPDATES_PER_SECOND = 1;

$(document).on('ready', () => {
	
	var date = $('#date');
	var time = $('#time');
	
	var weather = $('#weather');
	
	updateTime();
	
	setInterval(() => {
		updateTime();
		getWeather();
	}, 1000 / UPDATES_PER_SECOND);
	
	function updateTime() {
		date.text(moment().format('dddd, MMMM Do YYYY'));
		time.text(moment().format('h:mm a'));
	}
	
	function getWeather() {
		var query = "https://api.openweathermap.org/data/2.5/weather?" +
      "q=" + city + "&units=imperial&appid=" + WEATHER_API_KEY;
		
		$.ajax({
			url: query,
			method: "GET"
    }).done(data => {
			if (!data || !data.main) return;
			
			let temp = data.main.temp;
			if (temp) {
				weather.text(temp.toFixed(1) + '\xB0' + 'F');
			}
		});
	}
	
});