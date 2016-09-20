    // button is attaced to pin 17, led to 18
    var GPIO = require('onoff').Gpio,
        motion = new GPIO(18, 'in', 'both');
     
    setInterval(function(){
      var value = motion.readSync();
      console.log(value);
    }, 1000);
