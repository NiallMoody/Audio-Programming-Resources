//Get canvas for setting internal resolution.
var canvas;

//Get on-screen controls.
var frequencySlider;
var logarithmicToggle;
var audioToggleButton;
var animateButton;

var visualFrequency = 4.0;
var audioFrequency = 110.0;

var logarithmic = false;

//True if audio is running.
var audioRunning = false;

var oscillator = null;

//True if we're animating the slider.
var animating = false;
var animateIntervalId = null;
var animateIndex = 0.0;
var animateDirection = true; //true: +ve; false: -ve

window.addEventListener("load", () => {
	//Get canvas for setting internal resolution.
	canvas = document.getElementById('responsive-canvas');

	//Get on-screen controls.
	frequencySlider = document.getElementById('frequencySlider');
	logarithmicToggle = document.getElementById('logarithmicToggle');
	audioToggleButton = document.getElementById('audioToggleButton');
	animateButton = document.getElementById('animateButton');

	frequencySlider.addEventListener('input', updateFreq);

	logarithmicToggle.addEventListener('change', (event) => {
		logarithmic = logarithmicToggle.checked;
		updateFreq(frequencySlider.value);
	});

	audioToggleButton.addEventListener('mouseup', audioToggle);

	animateButton.addEventListener('mouseup', (event) => {
		if(animating) {
			animating = false;
		
			clearInterval(animateIntervalId);
			animateIntervalId = null;
		
			document.getElementById('animateButton').innerHTML = "<span class='material-icons'>play_circle</span>";
		}
		else {
			animating = true;
		
			animateIndex = parseFloat(frequencySlider.value);
			animateDirection = true;
		
			animateIntervalId = setInterval(() => {
				if(animateDirection) {
					animateIndex += 0.002;
					if(animateIndex >= 1.0) {
						animateIndex = 1.0;
						animateDirection = false;
					}
				}
				else {
					animateIndex -= 0.002;
					if(animateIndex <= 0.0) {
						animateIndex = 0.0;
						animateDirection = true;
					}
				}
			
				frequencySlider.value = animateIndex;
				updateFreq(animateIndex);
			}, 10);
		
			document.getElementById('animateButton').innerHTML = "<span class='material-icons'>stop_circle</span>";
		}
	});

	window.addEventListener('resize', resize);
	resize();
	draw();
});

//Used to resize our canvas when the window's resized.
function resize() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
	canvas.height = (window.innerHeight - 168) * window.devicePixelRatio;
  
  draw();
}

//Used to redraw the canvas when necessary.
function draw() {
  //Start drawing.
  const canvasContext = canvas.getContext('2d');
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  
	const centreY = canvas.height/2;
  const sinHeight = centreY - 8;

  canvasContext.strokeStyle = 'rgb(68, 84, 106)';
  canvasContext.lineWidth = 4;
  
  var numPeriods = visualFrequency;
  var periodLength = (canvas.width/numPeriods);
  var halfLength = (periodLength * 0.5);
  
  canvasContext.translate(-(0.5 * halfLength), 0);
  
  canvasContext.beginPath();
  canvasContext.moveTo(0, centreY + sinHeight);
  
  for(let i=0;i<(numPeriods + 1);++i) {
	var x = (i * periodLength);
	
	canvasContext.bezierCurveTo(x + (halfLength * 0.3634),
								centreY + sinHeight,
								x + (halfLength * 0.6366),
								centreY - sinHeight,
								x + halfLength,
								centreY - sinHeight);
	x += halfLength;
	canvasContext.bezierCurveTo(x + (halfLength * 0.3634),
								centreY - sinHeight,
								x + (halfLength * 0.6366),
								centreY + sinHeight,
								x + halfLength,
								centreY + sinHeight);
  }
  canvasContext.stroke();
  
  canvasContext.translate((0.5 * halfLength), 0);
}

function fakeLog(value) {
	let logCoeff = 1.0 - (1/0.75);
	
	return value/(value + (logCoeff * (value - 1.0)));
}

function updateFreq(evemt) {
	let value = parseFloat(frequencySlider.value);
	
	if(logarithmic) {
		visualFrequency = 4.0 + (fakeLog(value) * 28.0);
		audioFrequency = 110.0 * Math.pow(2.0, (value * 48.0)/12.0);
	}
	else {
		visualFrequency = 4.0 + (value * 28.0);
		audioFrequency = 110.0 + (value * (1760.0 - 110.0));
	}
	
	if(audioRunning) {
		oscillator.frequency.linearRampToValueAtTime(audioFrequency, audioContext.currentTime + 0.01);
	}
	
	draw();
}

//Used to toggle our audio on and off.
function audioToggle() {
  if(!audioRunning) {
	//Create web audio api context.
	audioContext = new (window.AudioContext || window.webkitAudioContext)();
		
		oscillator = audioContext.createOscillator();
		
		oscillator.type = 'sine';
		oscillator.frequency.setValueAtTime(audioFrequency, audioContext.currentTime);
		
		let attenuation = audioContext.createGain();
		
		oscillator.connect(attenuation);
		attenuation.connect(audioContext.destination);
		
		attenuation.gain.setValueAtTime(0.5, audioContext.currentTime);
		oscillator.start();
	
	audioRunning = true;
	
	//Update audio button.
	document.getElementById('audioToggleButton').innerHTML = "<span class='material-icons'>volume_up</span>";
  }
	else {
	//Stops the audio, releases any audio resources used.
		audioContext.close();
		
		oscillator = null;
		
		audioRunning = false;
	
	//Update audio button.
	document.getElementById('audioToggleButton').innerHTML = "<span class='material-icons'>volume_off</span>";
	}
}