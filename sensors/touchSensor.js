var raspi = require('raspi');
var I2C = require('raspi-i2c').I2C;
 
raspi.init(function() {
  var i2c = new I2C();
  setInterval(function() {
  	console.log(i2c.readByteSync(0x29));// Read one byte from the device at address 18
  }, 2000);
});