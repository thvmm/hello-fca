/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

var multer  = require('multer');
var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
var vcap = JSON.parse(process.env.VCAP_SERVICES);

var speech_to_text = new SpeechToTextV1({
    "username": "{username}",
    "password": "{password}"
});

var params = {
    model: 'en-US_BroadbandModel',
    content_type: 'audio/wav',
    continuous: true,
    'interim_results': false,
    'max_alternatives': 3,
    'word_confidence': false,
    timestamps: false,
    keywords: ['colorado', 'tornado', 'tornadoes'],
    'keywords_threshold': 0.5
};

var recognizeStream = speech_to_text.createRecognizeStream(params);


var fs = require('fs');

// create a new express server
var app = express();
var upload = multer({ dest: './public/images'});
//app.use(multer({ dest: './public/images'}).single('singleInputFileName'));
// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

/*app.use(bodyParser.urlencoded({
    extended: true,
    limit: '5mb'
}));
 app.use(bodyParser.json({
 limit: '5mb'
 }));
*/

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();


app.post('/api/stt', upload.single('upl') , function(req, res) {
    console.log(req.body); // form fields
    console.log(req.file); // form files
    fs.createReadStream(req.file.path).pipe(recognizeStream);
    recognizeStream.pipe(fs.createWriteStream('transcription.txt'));
    recognizeStream.setEncoding('utf8');
    // Listen for events.
    recognizeStream.on('results', function(event) { onEvent('Results:', event); });
    recognizeStream.on('data', function(event) { onEvent('Data:', event); });
    recognizeStream.on('error', function(event) { onEvent('Error:', event); });
    recognizeStream.on('close', function(event) { onEvent('Close:', event); });
    recognizeStream.on('speaker_labels', function(event) { onEvent('Speaker_Labels:', event); });
});

function onEvent(name, event) {
    console.log(name, JSON.stringify(event, null, 2));
};
// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
  //console.log('Limit file size: ' + limit);
});
