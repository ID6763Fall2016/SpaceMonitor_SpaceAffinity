// Sensors 
var GPIO = require('onoff').Gpio,
	motion_sensor = new GPIO(18, 'in', 'both'),
	button1 = new GPIO(17, 'in', 'both'),
	button2 = new GPIO(27, 'in', 'both');

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

http.listen(4200, function () {
  console.log('listening on *:4200');
});

var prevTotal = 0;
var currentMood;
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
	},10000);

	var sendLatestMotion = setInterval(function() {
		getLatestMotion(2, function(results) {
			var totalMotion = 0;
			var result = "Quiet";
			for (var i = 0; i < results.length; i++) {
				if (results[i].motion == 1) {
					totalMotion++;
				}
			}

			if (totalMotion >1 ){
				result = "Busy";
			}

			socket.emit('latestMotion', result);
			
			console.log("===== Latest Motion =====");
			console.log(result);
			console.log("=========================");
		});
	}, 200);

	var sendTodayMood = setInterval(function() {
		getHappyDay();
		getTodayMood(1000, function(results) {
			if (results) {
				var totalEntries = results.length;
				console.log("===== prevTotal =====");
				console.log(prevTotal + "; "+ totalEntries);
				console.log("=========================");
				if (prevTotal != totalEntries) {
					currentMood = results[0].mood;
					socket.emit('newEntry', currentMood);
					prevTotal = totalEntries;
				}
				var totalHappy = 0;
				var happyRate = 0;
				var values = [];
				for (var i = 0; i < results.length; i++) {
					if (results[i].mood == 1) {
						totalHappy++;
					}
				}

				happyRate = Math.round(totalHappy / totalEntries * 100);
				values.push(totalEntries);
				values.push(happyRate + '%');

				socket.emit('todayMood', values);
				
				console.log("===== Today Mood =====");
				console.log(values);
				console.log("=========================");
			}
			
		});
	}, 1000);

	var sendHappyDay = setInterval(function() {

	}, 1000);

	socket.on('disconnect', function(){
		console.log("user disconnected from socket");
		clearInterval(sendLatestSamples);
	});
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

var insertMotion = function(theDate, theMotion, theDay)
{
	 var motionCollection = db.collection('motion_data');
	 motionCollection.insert({
	 "datetime" : theDate,
	 "motion" : theMotion,
	 "day" : theDay
	 },
	 function(err, docResult) {
	 assert.equal(err, null);
	 console.log("Inserted an entry into the motion_data collection.");
	 //db.close();
	 });
};

var insertMood = function(theDate, theMood, theDay)
{
	 var moodCollection = db.collection('mood_data');
	 moodCollection.insert({
	 "datetime" : theDate,
	 "mood" : theMood,
	 "day" : theDay
	 },
	 function(err, docResult) {
	 assert.equal(err, null);
	 console.log("Inserted an entry into the mood_data collection.");
	 //db.close();
	 });
};

var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
setInterval(function(){
 var makeValue = Math.random() * 100;
 var motionValue = motion_sensor.readSync();
 // var motionValue = Math.round(Math.random() );

 var getDate = new Date();
 var day = getDate.getDay();
 var getDay = days[day];

 insertSample(makeValue,getDate);
 insertMotion(getDate,motionValue,getDay);
},200);

// setInterval(function() {
// 	var moodValue = Math.round(Math.random());
//  	var getDate = new Date();
//  	var day = getDate.getDay();
//  	var getDay = days[day];	
// 	insertMood(getDate, moodValue,getDay);
// 	// var isHappy = button1.readSync();
// 	// var isUnhappy = button2.readSync();

// }, 200);

button1.watch(function() {
	var getDate = new Date();
 	var day = getDate.getDay();
 	var getDay = days[day];	
	var moodValue = button1.readSync();
	console.log("============ button 1 ==========");

	console.log(moodValue);
	console.log("============ ==========");
	if (moodValue === 1) {
		insertMood(getDate, 1, getDay);
	}
});

button2.watch(function() {
	var getDate = new Date();
 	var day = getDate.getDay();
 	var getDay = days[day];	
	var moodValue = button2.readSync();
	if (moodValue === 1) {
		insertMood(getDate, 0, getDay);
	}
});

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

var getLatestMotion = function(theCount, callback) {
	var motionCollection = db.collection('motion_data');
	motionCollection
	.find()
	.sort({"datetime":-1})
	.limit(theCount)
	.toArray(function(err,docList){
		callback(docList);
	});
};

var getTodayMood = function(theCount, callback) {
	var moodCollection = db.collection('mood_data');
	moodCollection
	.find({
		"datetime" : {
			// TODO 
			// auto fetch today's date
			'$gte': new Date("2016-09-19T00:00:00.000Z"),
			'$lte': new Date("2016-09-22T07:00:00.000Z")
		}
	})
	.sort({"datetime":-1})
	.limit(theCount)
	.toArray(function(err,docList){
		callback(docList);
	});
};

var getHappyDay = function() {
	var moodCollection = db.collection('mood_data');
	var count = moodCollection
	.find({
		"mood" : 1
	});
	console.log(count);
}
