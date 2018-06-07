var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');

var app = express();
var PORT = process.env.PORT || 3000;

/*const fs = require('fs');
const portAudio = require('naudiodon');
console.log(portAudio.getDevices());

var ai = new portAudio.AudioInput({
	channelCount: 2,
	sampleFormat: portAudio.SampleFormat16Bit,
	sampleRate: 44100,
	deviceId: 4
});
ai.on('error', err => console.error);

var ao = new portAudio.AudioOutput({
	channelCount: 2,
	sampleFormat: portAudio.SampleFormat16Bit,
	sampleRate: 44100,
	deviceId: 2
});
ao.on('error', err => console.error);

//var rs = fs.createReadStream('./test.wav');
//rs.on('end', () => ao.end());
var ws = fs.createWriteStream('./data.raw');

ai.pipe(ws);
ai.start();
//ao.start();

process.on('SIGINT', () => {
	console.log('quitting input');
	ai.quit();
});*/



app.use(express.static(path.join(__dirname, 'src')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "src/assets/html/index.html"));
});

app.listen(PORT, () => {
	console.log("Server listening on port " + PORT);
});