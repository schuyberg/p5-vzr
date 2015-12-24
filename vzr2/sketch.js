// vzr2 (music vizualization experiment / p5js toy)
// @schuyberg 12.2015

////////////////////
// INIT
///////////////////

// setup vars
var p1,p2,p3, motionPoints;
var currentTri, triCount = 0, triangles = [];
var noMotion;
var globalSensitivity = 50;
var currentShapes = [];
var globalAcceleration = 0.9975;

var currentColors;

// get size of window vars
function getWindowProps(){
  var w = window,
      d = document,
      e = d.documentElement,
      g = d.getElementsByTagName('body')[0],
      x = w.innerWidth || e.clientWidth || g.clientWidth,
      y = w.innerHeight|| e.clientHeight|| g.clientHeight;
      return {x:x, y:y};
}
// reset on window resize
window.onresize = function(){
  setup();
  loop();
  looping = true;
};

// initialize audio p5 audio plugin
var soundIn = new p5.AudioIn();
var fft = new p5.FFT();

////////////////////
// P5 Setup
///////////////////

function setup() {
  var wSize = getWindowProps();
  // create canvas
  createCanvas(wSize.x, wSize.y);
  blender(0);
  background(0);
  // background('transparent');

 
  //colors
  colorProfiles = {
    sunset: {
      fill: color(255,100,40,2),
      stroke: color(10,20,45) 
    },
    whitestroke:{
      fill: color(0,0,0),
      stroke: color(255,255,255)
    },
    grayscale:{
      fill: color(0,0,0,20),
      stroke: color(255,255,255, 120)
    }
  };

  
  currentColors = colorProfiles.grayscale;


  // audio in 
  soundIn.start();
  fft.setInput(soundIn);

  fft.smooth(0.4); 
  noMotion = createVector(0,0); 
  p1 = p1 || new MotionPoint(createVector(width/2, height/2 + 30), p5.Vector.random2D());
  p2 = p2 || new MotionPoint(createVector(width/2 - 30, height/2 - 30), noMotion);
  p3 = p3 || new MotionPoint(createVector(width/2 + 30, height/2 - 30), noMotion);

  motionPoints = [p1, p2, p3];
  
  t1 = new Tri(motionPoints);
  currentShapes.push(t1);
}

////////////////////
// P5 Draw Loop
///////////////////

function draw() {
  // colors
  // background('transparent')
  // fill(255,100,40,2);
  // stroke(10,20,60);  
  fill(currentColors.fill);
  stroke(currentColors.stroke);
  //audio in
  fft.analyze();
  // activate frequency-based triggers
  freqUpdate();
  // animate
  increment();
}

// increment current shapes
function increment(){
  currentShapes.forEach(function(shape){
    shape.increment();
  });
}

////////////////////
// Blending & Colors
///////////////////

// blending
var currentBlend = 0;
function blender(input){
  // console.log(currentBlend, input);
  var modes = [
        // function(){blendMode(BLEND);},
        
        function(){blendMode(EXCLUSION);}, 
        function(){blendMode(DIFFERENCE);},
        function(){blendMode(DODGE);},
        function(){blendMode(ADD);},
        function(){blendMode(OVERLAY);}
      ];
  if(!input){
      currentBlend++;
      if (currentBlend > modes.length-1){
        currentBlend = 0;
      }
    modes[currentBlend]();
  } else {
    currentBlend = input;
    modes[currentBlend]();

  }
}

// color profiles
var colors = {

};


// color / blend actions
function wipeCanvas(color){
  // blendMode(BLEND);
  background(color);
}

////////////////////
// Points & Shapes
///////////////////

// motion points (takes vectors as arguments)
function MotionPoint(point, motion, acceleration){
  this.point = point;
  this.motion = motion;
  this.acceleration = acceleration;
  this.locked = false;
}
// add motion to point (without passing outside of canvas)
// takes simple vector as input
function addMotion(point, motion, acceleration){
  var acc = acceleration || globalAcceleration;
  var m = motion.mult(acc);
  var pt = point.add(motion);
   if(pt.x > width || pt.x < 0 || pt.y > height || pt.y < 0){
    m = m.rotate(180);
   }
   return pt.add(m);
}

// shapes
// base triangle
function Tri(motionPoints){
  this.mPts = motionPoints;
}

Tri.prototype.increment = function(){
  var p = [];
  for (var i = 0, l = this.mPts.length; i < l; i++){
    var location = addMotion(this.mPts[i].point, this.mPts[i].motion, this.mPts[i].acceleration);
    p.push(location);
  }
  triangle(p[0].x, p[0].y, p[1].x, p[1].y, p[2].x, p[2].y);
};

Tri.prototype.changeMotion = function(fn, input){
  fn(this, input);
};


// MOTIONS
var motions = {
  singlePoint : function(shape, v1, acc){
    var notMoving = staticPoints(shape.mPts);
    stopAll(shape);
    var moveThis = shape.mPts[notMoving[Math.floor(random(0,notMoving.length))]];
    moveThis.motion = v1;
    moveThis.acceleration = acc;
  },
  centerLocked : function(shape, v1){
    var notMoving = staticPoints(shape.mPts);
    // stopAll(shape);
    var locked = notMoving[0];
    moveRand();
    function moveRand(){
      var i = Math.floor(random(0,shape.mPts.length));
      // console.log(locked, i);
      if (i !== locked) {
        shape.mPts[i].motion = v1;
      } else {
        moveRand();
      }
    }
  },
  multipoint : function(shape, v1, acc){
    // var notMoving = staticPoints(shape.mPts);
    // stopAll(shape);
    var moveThis = shape.mPts[Math.floor(random(0, shape.mPts.length))];
    moveThis.motion = v1;
    moveThis.acceleration = acc;
  },
  fromMid : function(shape, v1){
    var notMoving = staticPoints(shape.mPts);
    stopAll(shape);
    var moveThis = shape.mPts[notMoving[Math.floor(random(0,notMoving.length))]];

  }
};


// motion utility functions
// which points aren't moving (takes array of MotionPoints, returns keys)
function staticPoints(input){
  var notMoving = [];
  for (var i = 0, l = input.length; i < l; i++){
    if (input[i].motion.equals(noMotion)) {
      notMoving.push(i);
    }
  }
  if(notMoving.length < 1){
    var r = Math.floor(random(0,input.length));
    notMoving.push(r);
  }
  return notMoving;
}
function stopAll(shape){
  for (var i = 0, l = shape.mPts.length; i < l; i++){
    shape.mPts[i].motion = noMotion;
  }
}



////////////////////
// Audio Processing & Triggers
///////////////////

var freqTriggers = {};
// add trigger
function FreqTrigger(name, frequency, thresh, action){
  freqTriggers[name] = {freq: frequency, thresh: thresh, action: debounce(action, 100)};
}
// add counter
function freqCounter(key, maxCount){

}
// fire active frequency triggers (in draw loop)
var globalThreshModifier = 1;
function freqUpdate(){
  for (var t in freqTriggers) {
    var energy = fft.getEnergy(freqTriggers[t].freq);
    if ( energy > freqTriggers[t].thresh * globalThreshModifier) {
       freqTriggers[t].action(energy);
    }
  }
}

// TRIGGERS
var bass1 = new FreqTrigger('bass1', 'bass', 180, function(energy){
  console.log('bass1', energy)
  blender();
  if (freqTriggers.bass1.hasOwnProperty('counter1')){
    freqTriggers.bass1.counter1++;
  } else {
    freqTriggers.bass1.counter1 = 0;
  }
  if (freqTriggers.bass1.counter1 > 20){
    // var diff = 255 - freqTriggers.bass.thresh;
    // var speed = map(energy, 0, diff, -1,1.5);
    var newMotion = p5.Vector.random2D();
    currentShapes[0].changeMotion(motions.multipoint, newMotion);
  }
});
var treb1 = new FreqTrigger('treble', 'treble', 120, function(energy){
  // console.log('motion2');
  if (freqTriggers.treble.hasOwnProperty('counter1')){
    freqTriggers.treble.counter1++;
  } else {
    freqTriggers.treble.counter1 = 0;
  }
  
  if (freqTriggers.treble.counter1 > 5 ){
    // var diff = 255 - freqTriggers.bass.thresh;
    // var speed = map(energy, 0, diff, -1,1.5);
    var newMotion = p5.Vector.random2D();
    currentShapes[0].changeMotion(motions.singlePoint, newMotion);
  }
});
var hm1 = new FreqTrigger('highMid', 'highMid', 120, function(energy){
    var newMotion = p5.Vector.random2D();
    currentShapes[0].changeMotion(motions.centerLocked, newMotion);
});




///////////////////////
// USER CONTROLS
///////////////////////
// mouse
function mouseClicked(){
    var newMotion = p5.Vector.random2D();
    currentShapes[0].changeMotion(motions.centerLocked, newMotion);
}

// keyboard
var looping = true;
function keyTyped() {
    console.log(key);
    // loop ctrl
    if (key == ' '){
        if (looping) {
            noLoop();
            looping = false;
        } else {
            loop();
            looping = true;
        }
    }
    // blend ctrl
    if (key == 'b') {
      blender();
    }
    if (key == 'w') {
      wipeCanvas(0);
    }
    if (key == 'e') {
      wipeCanvas(255);
    }
    if (key == '1') {
      currentColors=colorProfiles.sunset;
    }
    if (key == '2') {
      currentColors=colorProfiles.whitestroke;
    }
    if (key == '3') {
      currentColors=colorProfiles.grayscale;
    }
    if (key == '4') {
      // currentColors=colorProfiles.
    }
    if (key == '5') {
      // currentColors=colorProfiles.
    }
    if (key == '6') {
      // currentColors=colorProfiles.
    }
    // global input sensitivity
    if (key == '=') {
      globalSensitivity++;
    }
    if (key == '-') {
      globalSensitivity--;
    }

}





// UTILITIES
// pick a random property from an object
function pickRandomProperty(obj) {
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1/++count)
           result = prop;
    return result;
}

// Debounce by David Walsh:
function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

