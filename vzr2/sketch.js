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
var globalAcceleration = 0.997;

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
  background(0,0,0,0.001);
  fill(255,100,40,2);
  stroke(10,20,30);  
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
// Points & Shapes
///////////////////

// motion points (takes vectors as arguments)
function MotionPoint(point, motion, acceleration){
  this.point = point;
  this.motion = motion;
  this.acceleration = acceleration;
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
  centerLocked : function(shape, v1, v2){
    var notMoving = staticPoints(shape.mPts);

  },
  multipoint : function(shape, v1, acc){
    // var notMoving = staticPoints(shape.mPts);
    // stopAll(shape);
    var moveThis = shape.mPts[Math.floor(random(0, shape.mPts.length))];
    moveThis.motion = v1;
    moveThis.acceleration = acc;
  },
  fromMid : function(){}
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


function FromMid(startPoints, motion){
  this.points = startPoints;
  this.motionPoint = this.motionPoint || whichPoint();

  var otherPts = [0,1,2];
  otherPts.splice(this.motionPoint, 1);
  var sum = this.points[otherPts[0]].add(this.points[otherPts[1]]);
  this.points[this.motionPoint] = sum.div(2);

  console.log(this.motionPoint, this.points);

  this.increment = function(motion){
      // var p = this.points;
      function newPoint(point, motion){
        var m = motion;
        var pt = point.add(motion);
         if(pt.x > width || pt.x < 0 || pt.y > height || pt.y < 0){
          m = m.rotate(180);
         }
         return pt.add(m);
      }
      // console.log(this.motionPoint);
      this.points[this.motionPoint]  = newPoint(this.points[this.motionPoint], motion);
      triangle(this.points[0].x, this.points[0].y, this.points[1].x, this.points[1].y, this.points[2].x, this.points[2].y);
  };
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
        // function(){blendMode(OVERLAY);},
        function(){blendMode(EXCLUSION);}, 
        function(){blendMode(DIFFERENCE);},
        function(){blendMode(DODGE);},
        function(){blendMode(ADD);}
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


////////////////////
// Audio Processing & Triggers
///////////////////

var freqTriggers = {};
// trigger object constructor
function FreqTrigger(name, frequency, thresh, action){
  this.key = name;
  this.freq = frequency;
  this.thresh = thresh;
  this.action = debounce(action, 200);

  freqTriggers[name] = {freq: frequency, thresh: thresh, action: action};
}
// remove trigger
FreqTrigger.prototype.remove = function(){
  delete freqTriggers[this.name];
};
// fire trigger
FreqTrigger.prototype.shoot = function(){
  console.log('condition met');
};

// fire active frequency triggers (in draw loop)
var globalThreshModifier = 1;
function freqUpdate(){
  for (var t in freqTriggers) {
    var energy = fft.getEnergy(freqTriggers[t].freq);
    if ( energy > freqTriggers[t].thresh * globalThreshModifier){
       console.log(freqTriggers[t].freq, fft.getEnergy(freqTriggers[t].freq));
       freqTriggers[t].action(energy);
    }
  }
}

// TRIGGERS
var bass1 = new FreqTrigger('bass1', 'bass', 180, function(energy){
  blender();
  if (freqTriggers.bass1.hasOwnProperty('counter1')){
    freqTriggers.bass1.counter1++;
  } else {
    freqTriggers.bass1.counter1 = 0;
  }
  if (freqTriggers.bass1.counter1 > 50 ){
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
  // console.log('motion2');
  if (freqTriggers.highMid.hasOwnProperty('counter1')){
    freqTriggers.highMid.counter1++;
  } else {
    freqTriggers.highMid.counter1 = 0;
  }
  
  if (freqTriggers.highMid.counter1 > 5 ){
    // var diff = 255 - freqTriggers.bass.thresh;
    // var speed = map(energy, 0, diff, -1,1.5);
    var newMotion = p5.Vector.random2D();
    currentShapes[0].changeMotion(motions.singlePoint, newMotion);
  }
});




///////////////////////
// USER CONTROLS
///////////////////////
// mouse
function mouseClicked(){
    var newMotion = p5.Vector.random2D();
    currentShapes[0].changeMotion(motions.singlePoint, newMotion);
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
    if (key == '1') {
      blender();
    }
    if (key == '2') {
      
    }
    if (key == '3') {
      
    }
    if (key == '4') {
      
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

