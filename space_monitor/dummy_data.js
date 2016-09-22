
var Engine = require('tingodb')(), assert = require('assert');
var db = new Engine.Db(__dirname + '/db',{});

var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

var motionCollection = db.collection('motion_data');
var moodCollection = db.collection('mood_data');

var date = new Date();
var day = days[4];
for (var i = 0; i < 3000; i++) {
	var motion;
	var p = Math.random() * 10;
	if (p < 5) {
		motion = 1;
	} else {
		motion = 0;
	}
	 motionCollection.insert({
		 "datetime" : date,
		 "motion" : motion,
		 "day" : day
	 },
	 function(err, docResult) {
		 assert.equal(err, null);
		 console.log("Inserted an entry into the motion_data collection.");
		 //db.close();
	 });
}

for (var i = 0; i < 800; i++) {
	var mood;
	var p = Math.random() * 10;
	if (p < 7) {
		mood = 0;
	} else {
		mood = 1;
	}
	 moodCollection.insert({
		 "datetime" : date,
		 "mood" : mood,
		 "day" : day
	 },
	 function(err, docResult) {
		 assert.equal(err, null);
		 console.log("Inserted an entry into the motion_data collection.");
		 //db.close();
	 });
}
