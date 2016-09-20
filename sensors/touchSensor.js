const MPR121 = require('adafruit-mpr121'),
      mpr121  = new MPR121(0x29, 1);

// listen for touch events
mpr121.on('touch', (pin) => console.log(`pin ${pin} touched`));

// listen for release events
mpr121.on('release', (pin) => console.log(`pin ${pin} released`));

// listen for changes to the state of a specific pin
mpr121.on(3, (state) => console.log(`pin 3 is ${state ? 'touched' : 'released'}`));

// check the current state of a specific pin synchronously
const state = mpr121.isTouched(2);
console.log(`pin 2 is ${state ? 'touched' : 'released'}`);

// var raspi = require('raspi');
// var I2C = require('raspi-i2c').I2C;
 
// raspi.init(function() {
//   var i2c = new I2C();
//   // Read one byte from the device at address 18

//   setInterval(function() {
//   	console.log(i2c.readByteSync(0x29)); 
//   }, 2000);
// });