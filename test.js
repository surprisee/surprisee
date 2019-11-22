/*
Everybody say Happy Birthday! This gift is a compound of various pens plus some other things I added
- gift 
https://codepen.io/ElaineXu/pen/EWvGWX
- neon 
https://codepen.io/markheggan/pen/LjrVYN
- fireworks 
https://codepen.io/chuongdang/pen/yzpDG
- moon 
https://codepen.io/agelber/pen/sjIKp
*/
window.requestAnimFrame = function () {
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };
  }();
  
  // now we will setup our basic variables for the demo
  var canvass = document.getElementById('canvas'),
  ctxx = canvass.getContext('2d'),
  // full screen dimensions
  cw = window.innerWidth,
  ch = window.innerHeight,
  // Fireworks collection
  fireworks = [],
  // particle collection
  particles = [],
  // starting hue
  hue = 120,
  // when launching fireworks with a click, too many get launched at once without a limiter, one launch per 5 loop ticks
  limiterTotal = 5,
  limiterTick = 0,
  // this will time the auto launches of fireworks, one launch per 80 loop ticks
  timerTotal = 80,
  timerTick = 0,
  mousedown = false,
  // mouse x coordinate,
  mx,
  // mouse y coordinate
  my;
  
  // set canvass dimensions
  canvass.width = cw;
  canvass.height = ch;
  
  // now we are going to setup our function placeholders for the entire demo
  
  // get a randomm number within a range
  function randomm(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  // calculate the distance between two points
  function calculateDistance(p1x, p1y, p2x, p2y) {
    var xDistance = p1x - p2x,
    yDistance = p1y - p2y;
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
  }
  
  // create Fireworks
  function Fireworks(sx, sy, tx, ty) {
    // actual coordinates
    this.x = sx;
    this.y = sy;
    // starting coordinates
    this.sx = sx;
    this.sy = sy;
    // target coordinates
    this.tx = tx;
    this.ty = ty;
    // distance from starting point to target
    this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
    this.distanceTraveled = 0;
    // track the past coordinates of each Fireworks to create a trail effect, increase the coordinate count to create more prominent trails
    this.coordinates = [];
    this.coordinateCount = 3;
    // populate initial coordinate collection with the current coordinates
    while (this.coordinateCount--) {
      this.coordinates.push([this.x, this.y]);
    }
    this.angle = Math.atan2(ty - sy, tx - sx);
    this.speed = 2;
    this.acceleration = 1.05;
    this.brightness = randomm(50, 70);
    // circle target indicator radius
    this.targetRadius = 1;
  }
  
  // update Fireworks
  Fireworks.prototype.update = function (index) {
    // remove last item in coordinates array
    this.coordinates.pop();
    // add current coordinates to the start of the array
    this.coordinates.unshift([this.x, this.y]);
  
    // cycle the circle target indicator radius
    if (this.targetRadius < 8) {
      this.targetRadius += 0.3;
    } else {
      this.targetRadius = 1;
    }
  
    // speed up the Fireworks
    this.speed *= this.acceleration;
  
    // get the current velocities based on angle and speed
    var vx = Math.cos(this.angle) * this.speed,
    vy = Math.sin(this.angle) * this.speed;
    // how far will the Fireworks have traveled with velocities applied?
    this.distanceTraveled = calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy);
  
    // if the distance traveled, including velocities, is greater than the initial distance to the target, then the target has been reached
    if (this.distanceTraveled >= this.distanceToTarget) {
      createParticles(this.tx, this.ty);
      // remove the Fireworks, use the index passed into the update function to determine which to remove
      fireworks.splice(index, 1);
    } else {
      // target not reached, keep traveling
      this.x += vx;
      this.y += vy;
    }
  };
  
  // draw Fireworks
  Fireworks.prototype.draw = function () {
    ctxx.beginPath();
    // move to the last tracked coordinate in the set, then draw a line to the current x and y
    ctxx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    ctxx.lineTo(this.x, this.y);
    ctxx.strokeStyle = 'hsl(' + hue + ', 100%, ' + this.brightness + '%)';
    ctxx.stroke();
  
    ctxx.beginPath();
    // draw the target for this Fireworks with a pulsing circle
    ctxx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2);
    ctxx.stroke();
  };
  
  // create particle
  function Particle(x, y) {
    this.x = x;
    this.y = y;
    // track the past coordinates of each particle to create a trail effect, increase the coordinate count to create more prominent trails
    this.coordinates = [];
    this.coordinateCount = 5;
    while (this.coordinateCount--) {
      this.coordinates.push([this.x, this.y]);
    }
    // set a randomm angle in all possible directions, in radians
    this.angle = randomm(0, Math.PI * 2);
    this.speed = randomm(1, 10);
    // friction will slow the particle down
    this.friction = 0.95;
    // gravity will be applied and pull the particle down
    this.gravity = 1;
    // set the hue to a randomm number +-20 of the overall hue variable
    this.hue = randomm(hue - 20, hue + 20);
    this.brightness = randomm(50, 80);
    this.alpha = 1;
    // set how fast the particle fades out
    this.decay = randomm(0.015, 0.03);
  }
  
  // update particle
  Particle.prototype.update = function (index) {
    // remove last item in coordinates array
    this.coordinates.pop();
    // add current coordinates to the start of the array
    this.coordinates.unshift([this.x, this.y]);
    // slow down the particle
    this.speed *= this.friction;
    // apply velocity
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed + this.gravity;
    // fade out the particle
    this.alpha -= this.decay;
  
    // remove the particle once the alpha is low enough, based on the passed in index
    if (this.alpha <= this.decay) {
      particles.splice(index, 1);
    }
  };
  
  // draw particle
  Particle.prototype.draw = function () {
    ctxx.beginPath();
    // move to the last tracked coordinates in the set, then draw a line to the current x and y
    ctxx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    ctxx.lineTo(this.x, this.y);
    ctxx.strokeStyle = 'hsla(' + this.hue + ', 100%, ' + this.brightness + '%, ' + this.alpha + ')';
    ctxx.stroke();
  };
  
  // create particle group/explosion
  function createParticles(x, y) {
    // increase the particle count for a bigger explosion, beware of the canvass performance hit with the increased particles though
    var particleCount = 30;
    while (particleCount--) {
      particles.push(new Particle(x, y));
    }
  }
  
  // main demo loop
  function loop() {
    // this function will run endlessly with requestAnimationFrame
    requestAnimFrame(loop);
  
    // increase the hue to get different colored fireworks over time
    hue += 0.5;
  
    // normally, clearRect() would be used to clear the canvass
    // we want to create a trailing effect though
    // setting the composite operation to destination-out will allow us to clear the canvass at a specific opacity, rather than wiping it entirely
    ctxx.globalCompositeOperation = 'destination-out';
    // decrease the alpha property to create more prominent trails
    ctxx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctxx.fillRect(0, 0, cw, ch);
    // change the composite operation back to our main mode
    // lighter creates bright highlight points as the fireworks and particles overlap each other
    ctxx.globalCompositeOperation = 'lighter';
  
    // loop over each Fireworks, draw it, update it
    var i = fireworks.length;
    while (i--) {
      fireworks[i].draw();
      fireworks[i].update(i);
    }
  
    // loop over each particle, draw it, update it
    var i = particles.length;
    while (i--) {
      particles[i].draw();
      particles[i].update(i);
    }
  
    // launch fireworks automatically to randomm coordinates, when the mouse isn't down
    if (timerTick >= timerTotal) {
      if (!mousedown) {
        // start the Fireworks at the bottom middle of the screen, then set the randomm target coordinates, the randomm y coordinates will be set within the range of the top half of the screen
        fireworks.push(new Fireworks(cw / 2, ch, randomm(0, cw), randomm(0, ch / 2)));
        timerTick = 0;
      }
    } else {
      timerTick++;
    }
  
    // limit the rate at which fireworks get launched when mouse is down
    if (limiterTick >= limiterTotal) {
      if (mousedown) {
        // start the Fireworks at the bottom middle of the screen, then set the current mouse coordinates as the target
        fireworks.push(new Fireworks(cw / 2, ch, mx, my));
        limiterTick = 0;
      }
    } else {
      limiterTick++;
    }
  }
  
  window.onload = function () {
    var merrywrap = document.getElementById("merrywrap");
    var box = merrywrap.getElementsByClassName("giftbox")[0];
    var step = 1;
    var stepMinutes = [2000, 2000, 1000, 1000];
    function init() {
      box.addEventListener("click", openBox, false);
    }
    function stepClass(step) {
      merrywrap.className = 'merrywrap';
      merrywrap.className = 'merrywrap step-' + step;
    }
    function openBox() {
      if (step === 1) {
        box.removeEventListener("click", openBox, false);
      }
      stepClass(step);
      if (step === 3) {
      }
      if (step === 4) {
        reveal();
        return;
      }
      setTimeout(openBox, stepMinutes[step - 1]);
      step++;
    }
  
    init();
  
  };
  
  function reveal() {
    document.querySelector('.merrywrap').style.backgroundColor = 'transparent';
  
    loop();
  
    var w, h;
    if (window.innerWidth >= 1000) {
      w = 495;h = 285;
    } else
    {
      w = 455;h = 255;
    }
  
    var ifrm = document.createElement("iframe");
    ifrm.setAttribute("src", "https://s3.amazonaws.com/embed.animoto.com/play.html?w=swf/production/vp1&e=1574452248&f=efSSbhXeP1T2jwfOWIMQiw&d=0&m=p&r=360p+480p+720p&volume=100&start_res=undefined&i=m&asset_domain=s3-p.animoto.com&animoto_domain=animoto.com&options=autostart");
    ifrm.style.width = `${w}px`;
    ifrm.style.height = `${h}px`;
    ifrm.style.border = 'none';
    document.querySelector('#video').appendChild(ifrm);
  }




  