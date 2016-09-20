// const MPR121 = require('adafruit-mpr121'),
//       mpr121  = new MPR121(0x29, 1);

// // listen for touch events
// mpr121.on('touch', (pin) => console.log(`pin ${pin} touched`));

// // listen for release events
// mpr121.on('release', (pin) => console.log(`pin ${pin} released`));

// // listen for changes to the state of a specific pin
// mpr121.on(3, (state) => console.log(`pin 3 is ${state ? 'touched' : 'released'}`));

// // check the current state of a specific pin synchronously
// const state = mpr121.isTouched(2);
// console.log(`pin 2 is ${state ? 'touched' : 'released'}`);

// var raspi = require('raspi');
// var I2C = require('raspi-i2c').I2C;
 
// raspi.init(function() {
//   var i2c = new I2C();
//   // Read one byte from the device at address 18

//   setInterval(function() {
//   	console.log(i2c.readByteSync(0x29)); 
//   }, 2000);
// });


var i2c = require('i2c-bus'),
  i2c1 = i2c.openSync(1);
 
var DS1621_ADDR = 0x29,
	CMD_ACCESS_CONFIG = 0xac,
	CMD_READ_TEMP = 0xaa,
	CMD_START_CONVERT = 0xee;


(function () {
  var rawTemp;
 
  // Enter one shot mode (this is a non volatile setting) 
  i2c1.writeByteSync(DS1621_ADDR, CMD_ACCESS_CONFIG, 0x01);
 
  // Wait while non volatile memory busy 
  while (i2c1.readByteSync(DS1621_ADDR, CMD_ACCESS_CONFIG) & 0x10) {
  }
 
  // Start temperature conversion 
  i2c1.sendByteSync(DS1621_ADDR, CMD_START_CONVERT);
 
  // // Wait for temperature conversion to complete 
  // while ((i2c1.readByteSync(DS1621_ADDR, CMD_ACCESS_CONFIG) & 0x80) === 0) {
  // }
 
  // Display temperature 
  rawTemp = i2c1.readWordSync(DS1621_ADDR, CMD_READ_TEMP);
  console.log('temp: ' + rawTemp);
 
  i2c1.closeSync();
}());


