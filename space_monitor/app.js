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

var writeDuration = 1000;
var readDuration = 1000;
var readDurationS = 1000;

var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

http.listen(4200, function () {
  console.log('listening on *:4200');
});

var prevTotal = 0;
var currentMood;

// Setup socket events
io.on('connection', function(socket) {
	console.log('a user connected');

	socket.on('messageFromClientToServer', function(data){
		console.log(data);
	});

	/*	emit: latestMotion
	 *
	 *	1) read the latest motion data from db
	 *	2) process the data
	 *	3) send the result in string to the client
	 */
	var sendLatestMotion = setInterval(function() {
		getLatestMotion(1, function(results) {
			var totalMotion = 0;
			var result = "Quiet";
			for (var i = 0; i < results.length; i++) {
				if (results[i].motion == 1) {
					totalMotion++;
				}
			}

			if (totalMotion > (results.length - 1) ){
				result = "Busy";
			}

			socket.emit('latestMotion', result);
			
			console.log("===== Latest Motion =====");
			console.log(result);
			console.log("=========================");
		});
	}, readDuration);


	/*	emit: todayMood
	 *
	 *	1) read today's mood data from db
	 *	2) process the data
	 *	3) send the happiness rate in string to the client
	 */
	var sendTodayMood = setInterval(function() {
		getTodayMood(1000, function(results) {
			if (results) {
				var totalEntries = results.length;
				
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


	/*	emit: happyDay
	 *
	 *	1) read all mood data
	 *	2) process the data
	 *	3) send the happiest day to the client
	 */
	var sendHappyDay = setInterval(function() {
		var happyRate = [];
		var totalPerDay = {
			Sunday: 0,
			Monday: 0,
			Tuesday: 0,
			Wednesday: 0,
			Thursday: 0,
			Friday: 0,
			Saturday: 0
		};
		var happyPerDay = {
			Sunday: 0,
			Monday: 0,
			Tuesday: 0,
			Wednesday: 0,
			Thursday: 0,
			Friday: 0,
			Saturday: 0
		};

		getTotalMoodPerDay(function(results) {
			for(var i = 0; i < results.length; i++) {
				switch (results[i].day) {
					case 'Monday':
						totalPerDay.Monday = results[i].total;
						break;
					case 'Tuesday':
						totalPerDay.Tuesday = results[i].total;
						break;
					case 'Wednesday':
						totalPerDay.Wednesday = results[i].total;
						break;
					case 'Thursday':
						totalPerDay.Thursday = results[i].total;
						break;
					case 'Friday':
						totalPerDay.Friday = results[i].total;
						break;
					case 'Saturday':
						totalPerDay.Saturday = results[i].total;
						break;
					case 'Sunday':
						totalPerDay.Sunday = results[i].total;
						break;
				}
			}
			
			getHappyMoodPerDay(function(results) {
				for(var i = 0; i < results.length; i++) {
					switch (results[i].day) {
						case 'Monday':
							happyPerDay.Monday = results[i].total;
							break;
						case 'Tuesday':
							happyPerDay.Tuesday = results[i].total;
							break;
						case 'Wednesday':
							happyPerDay.Wednesday = results[i].total;
							break;
						case 'Thursday':
							happyPerDay.Thursday = results[i].total;
							break;
						case 'Friday':
							happyPerDay.Friday = results[i].total;
							break;
						case 'Saturday':
							happyPerDay.Saturday = results[i].total;
							break;
						case 'Sunday':
							happyPerDay.Sunday = results[i].total;
							break;
					}
				}
				
				for (var i = 0; i < days.length; i++) {
					var t = totalPerDay[Object.keys(totalPerDay)[i]];
					var d = happyPerDay[Object.keys(happyPerDay)[i]]
					if (t != 0) {
						happyRate.push(d/t);

					} else {
						happyRate.push(0);
					}
				}
				var max = Math.max.apply(null, happyRate);
				var result = [];
				result.push(days[happyRate.indexOf(max)]);
				result.push(happyRate);
				socket.emit('happyDay', result);
				console.log("===== Happy Day =====");
				console.log(result);
				console.log("=========================");
			});
		
		});
		
		
	}, readDurationS);


	/*	emit: busyDay
	 *
	 *	1) read all motion data
	 *	2) process the data
	 *	3) send the busiest day to the client
	 */
	
	var sendBusyDay = setInterval(function() {
		var busyRate = [];
		var totalPerDay = {
			Sunday: 0,
			Monday: 0,
			Tuesday: 0,
			Wednesday: 0,
			Thursday: 0,
			Friday: 0,
			Saturday: 0
		};
		var busyPerDay = {
			Sunday: 0,
			Monday: 0,
			Tuesday: 0,
			Wednesday: 0,
			Thursday: 0,
			Friday: 0,
			Saturday: 0
		};

		getTotalMotionPerDay(function(results) {
			for(var i = 0; i < results.length; i++) {
				switch (results[i].day) {
					case 'Monday':
						totalPerDay.Monday = results[i].total;
						break;
					case 'Tuesday':
						totalPerDay.Tuesday = results[i].total;
						break;
					case 'Wednesday':
						totalPerDay.Wednesday = results[i].total;
						break;
					case 'Thursday':
						totalPerDay.Thursday = results[i].total;
						break;
					case 'Friday':
						totalPerDay.Friday = results[i].total;
						break;
					case 'Saturday':
						totalPerDay.Saturday = results[i].total;
						break;
					case 'Sunday':
						totalPerDay.Sunday = results[i].total;
						break;
				}
			}
			
			getBusyPerDay(function(results) {
				for(var i = 0; i < results.length; i++) {
					switch (results[i].day) {
						case 'Monday':
							busyPerDay.Monday = results[i].total;
							break;
						case 'Tuesday':
							busyPerDay.Tuesday = results[i].total;
							break;
						case 'Wednesday':
							busyPerDay.Wednesday = results[i].total;
							break;
						case 'Thursday':
							busyPerDay.Thursday = results[i].total;
							break;
						case 'Friday':
							busyPerDay.Friday = results[i].total;
							break;
						case 'Saturday':
							busyPerDay.Saturday = results[i].total;
							break;
						case 'Sunday':
							busyPerDay.Sunday = results[i].total;
							break;
					}
				}
				
				for (var i = 0; i < days.length; i++) {
					var t = totalPerDay[Object.keys(totalPerDay)[i]];
					var d = busyPerDay[Object.keys(busyPerDay)[i]]
					if (t != 0) {
						busyRate.push(d/t);

					} else {
						busyRate.push(0);
					}
				}
				var max = Math.max.apply(null, busyRate);
				var result = [];
				result.push(days[busyRate.indexOf(max)]);
				result.push(busyRate);
				socket.emit('busyDay', result);
				console.log("===== Busy Day =====");
				console.log(result);
				console.log("=========================");
			});
		
		});
		
		
	}, readDurationS);

	socket.on('disconnect', function(){
		console.log("user disconnected from socket");
		clearInterval(sendHappyDay);
		clearInterval(sendBusyDay);
		clearInterval(sendTodayMood);
		clearInterval(sendLatestMotion);
	});
});

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


setInterval(function(){
 var makeValue = Math.random() * 100;
 var motionValue = motion_sensor.readSync();
 // var motionValue = Math.round(Math.random() );

 var getDate = new Date();
 var day = getDate.getDay();
 var getDay = days[day];

 insertMotion(getDate,motionValue,getDay);
},writeDuration);

// setInterval(function() {
// 	var moodValue = Math.round(Math.random());
//  	var getDate = new Date();
//  	var day = getDate.getDay();
//  	var getDay = days[day];	
// 	insertMood(getDate, moodValue,getDay);

// }, writeDuration);

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
			'$gte': new Date("2016-09-21T20:00:00.000Z"),
			'$lte': new Date("2016-09-22T20:00:00.000Z")
		}
	})
	.sort({"datetime":-1})
	.toArray(function(err,docList){
		callback(docList);
	});
};

var getTotalMoodPerDay = function(callback) {
	var moodCollection = db.collection('mood_data');
	moodCollection.group(
			['day'],
			{'mood': {$or: [0, 1]}},
			{'total': 0},
			"function(curr, result) { result.total++; }",
			function(err, result) {
		        assert.equal(err, null);
		        callback(result);
		    }
	);

}

var getHappyMoodPerDay = function(callback) {
	var moodCollection = db.collection('mood_data');
	moodCollection.group(
			['day'],
			{'mood': 1},
			{'total': 0},
			"function(curr, result) { result.total++; }",
			function(err, result) {
		        assert.equal(err, null);
		        callback(result);
		    }
	);

}

var getTotalMotionPerDay = function(callback) {
	var moodCollection = db.collection('motion_data');
	moodCollection.group(
			['day'],
			{'motion': {$or: [0, 1]}},
			{'total': 0},
			"function(curr, result) { result.total++; }",
			function(err, result) {
		        assert.equal(err, null);
		        callback(result);
		    }
	);

}

var getBusyPerDay = function(callback) {
	var moodCollection = db.collection('motion_data');
	moodCollection.group(
			['day'],
			{'motion': 1},
			{'total': 0},
			"function(curr, result) { result.total++; }",
			function(err, result) {
		        assert.equal(err, null);
		        callback(result);
		    }
	);

}




