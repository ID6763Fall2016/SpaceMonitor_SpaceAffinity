var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var path = require('path');

var Engine = require('tingodb')(), assert = require('assert');
var db = new Engine.Db(__dirname + '/db',{});
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket) {
	console.log('a user connected');

	socket.on('messageFromClientToServer', function(data){
	console.log(data);
	});

	var sendLatestSamples = setInterval(function(){
		getLatestSamples(100,function(results){
			var values = [];
			for(var i=0; i<results.length; i++)
			{
				values.push(results[i].value);
			}
			socket.emit('latestSamples', values);
			console.log(values);
		});
	},1000);

	socket.on('disconnect', function(){
		console.log("user disconnected from socket");
		clearInterval(sendLatestSamples);
	});
});

http.listen(4200, function () {
  console.log('listening on *:4200');
});

var insertSample = function(theValue, theDate)
{
 var sampleCollection = db.collection('chartStuff');
 sampleCollection.insert({
 "value" : theValue,
 "datetime" : theDate
 },
 function(err, docResult) {
 assert.equal(err, null);
 console.log("Inserted a sample into the chartStuff collection.");
 //db.close();
 });
};

setInterval(function(){
 var makeValue = Math.random() * 100;
 var getDate = new Date();
 insertSample(makeValue,getDate);
},1000);

var getLatestSamples = function(theCount,callback){
 
 var sampleCollection = db.collection('chartStuff');
 sampleCollection
 .find()
 .sort({"datetime":-1})
 .limit(theCount)
 .toArray(function(err,docList){
 callback(docList);
 });
};