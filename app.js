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

var bodyParser = require('body-parser');

var watson = require('watson-developer-cloud');
var Cloudant = require('cloudant');
var vcap = JSON.parse(process.env.VCAP_SERVICES);
var cloudant = Cloudant({vcapServices: vcap});

cloudant.db.list(function(err, allDbs) {
  console.log('All my databases: %s', allDbs.join(', '))
});

var fs = require('fs');
var watsonCredentials = vcap.conversation[0].credentials;

var conversation = watson.conversation({
  username: watsonCredentials.username,
  password: watsonCredentials.password,
  version: 'v1',
  version_date: '2016-09-20'
});


// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
    extended: true,
    limit: '5mb'
}));

app.use(bodyParser.json({
    limit: '5mb'
}));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();


app.post('/chat', function(req, res) {

	var msg = {};
	if(req.body) {
		msg = req.body;
	}

	msg.workspace_id = '6d255038-3089-4195-994f-2e0c1389388f';
	
	console.log(JSON.stringify(msg, null, 2));
	
	conversation.message(msg, function(err, response) {
	  if (err) {
	    console.log('error:', err);
	    res.send(err);
	  } else {
	    console.log(JSON.stringify(response, null, 2));
	    res.send(response);
      }
	});
});

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
  //console.log('Limit file size: ' + limit);
});
