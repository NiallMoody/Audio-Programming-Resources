//Get canvas for setting internal resolution.
var canvas;
//Our main div.
var mainDiv;

//Get our on-screen controls.
var bitDepthSlider;
var digitalToggle;
var ditherToggle;
var shapingToggle;

var frequency = 3.0;

//True if audio is running.
var audioRunning = false;

var aliasingGenNode;

window.addEventListener('load', (event) => {
	canvas = document.getElementById('responsive-canvas');
	mainDiv = document.getElementById('mainControls');

	bitDepthSlider = document.getElementById("BitDepthSlider");
	digitalToggle = document.getElementById("DigitalToggle");
	ditherToggle = document.getElementById("DitherToggle");
	shapingToggle = document.getElementById("ShapingToggle");

	bitDepthSlider.oninput = bitDepthSliderChange;
	digitalToggle.onchange = digitalToggleChange;
	ditherToggle.onchange = ditherToggleChange;
	shapingToggle.onchange = shapingToggleChange;

	window.onresize = resize;
	resize();
	draw();
});

//Helper function for getting a URL for a string/code.
function getURLFromInlineCode(code) {
  const codeBlob = new Blob(code, {type: 'application/javascript'});
  
  return URL.createObjectURL(codeBlob);
}

//Our custom audio processor, encapsulated in a URL.
const bitDepthGenURL = getURLFromInlineCode`
class BitDepthGenerator extends AudioWorkletProcessor {

  static get parameterDescriptors () {
	return [{
	  name: 'bitDepth',
	  defaultValue: 16,
	  minValue: 1,
	  maxValue: 16,
	  automationRate: 'a-rate'
	},
	{
	  name: 'noiseShaping',
	  defaultValue: 0,
	  minValue: 0,
	  maxValue: 1,
	  automationRate: 'k-rate'
	},
	{
	  name: 'dither',
	  defaultValue: 0,
	  minValue: 0,
	  maxValue: 1,
	  automationRate: 'k-rate'
	},
	{
	  name: 'amplitude',
	  defaultValue: 1,
	  minValue: 0,
	  maxValue: 1,
	  automationRate: 'a-rate'
	}]
  }

  constructor() {
	super();

	this.sinIndex = 0.0;
	this.lastErr = 0.0;
  }

  //Generate our audio.
  process(inputs, outputs, parameters) {
	const sinInc = (440.0/sampleRate) * 2.0 * Math.PI;
	var noiseShaping = parameters['noiseShaping'][0];
	var dither = parameters['dither'][0];

	for(let i=0;i<outputs[0].length;++i) {
	  const buffer = outputs[0][i];

	  if(i == 0) {
		for(let j=0;j<buffer.length;++j) {
		  var bitDepth = (parameters['bitDepth'].length > 1) ? parameters['bitDepth'][i] : parameters['bitDepth'][0];
		  var amp = (parameters['amplitude'].length > 1) ? parameters['amplitude'][i] : parameters['amplitude'][0];

		  var maxVal = Math.floor(Math.pow(2.0, bitDepth)) - 1;

		  var sampleVal = Math.sin(this.sinIndex);
		  this.sinIndex += sinInc;
		  this.sinIndex %= (2.0 * Math.PI);

		  //sampleVal now 0 -> 1.
			  sampleVal = (sampleVal + 1.0) * 0.5;

		  //sampleVal now 0 -> 2^bitDepth.
			  sampleVal *= maxVal;

		  //Add dither if necessary.
		  if(dither) {
			var randInt = Math.floor(Math.random() * Math.floor(3));
			switch(randInt) {
			  case 0:
				sampleVal += 1.0;
				break;
			  case 1:
				sampleVal -= 1.0;
				break;
			}

			if(sampleVal < 0.0)
			  sampleVal = 0.0;
			else if(sampleVal >= maxVal)
			  sampleVal = maxVal;
		  }
 
		  //Add noise shaping if necessary.
		  if(noiseShaping)
			sampleVal += this.lastErr * 0.99;

		  //Quantise sampleVal.
		  var unquantisedVal = sampleVal;
		  sampleVal = Math.round(sampleVal);

		  //Update last quantisation error.
		  this.lastErr = unquantisedVal - sampleVal;

		  //sampleVal now 0 -> 1 again.
		  sampleVal /= maxVal;

		  //sampleVal now -1 -> +1 again.
		  sampleVal = (sampleVal * 2.0) - 1.0;

		  sampleVal *= amp;
		  buffer[j] = sampleVal;
		}
	  }
	  else {
		//We're mono, but if we find ourselves working in stereo, just copy channel 0.
		buffer[0][i] = buffer[0][0].slice();
	  }
	}

	return true;
  }
}

registerProcessor('BitDepthGen', BitDepthGenerator);
`

//Node for our audio processor.
class BitDepthGenNode extends AudioWorkletNode {
  constructor(context) {
	super(context, 'BitDepthGen');
  }
}

//Used to resize our canvas when the window's resized.
function resize() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  //console.log("window.innerWidth: ", window.innerWidth * window.devicePixelRatio);

  //Set canvas height as a proportion of width.
  /*var height = canvas.width * 0.5;
  if(height > 320)
	height = 320;
  canvas.height = height;*/
  canvas.height = 320;
	
	var h = window.innerHeight - (canvas.height / window.devicePixelRatio);
	h += "px";
	mainDiv.style.height = h;
  
  draw();
}

//Used to redraw the canvas when necessary.
function draw() {
  //Start drawing.
  const canvasContext = canvas.getContext('2d');
  const centreY = canvas.height/2;
  const sinHeight = centreY - 8;
  
  canvasContext.fillStyle = 'white';
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);

  canvasContext.strokeStyle = '#44546A';
  canvasContext.lineWidth = 4;
  
  var numPeriods = frequency;
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
  
  //Calculate samples.
  if(digitalToggle.checked) {
	var numSamples = 128;
	var bitDepth = bitDepthSlider.value;
	
	if((bitDepth > 5) && (bitDepth < 10))
		numSamples = 512;

	var sampleDist = canvas.width/numSamples;

	var pos = {x: 0.0, y: centreY};
	var sinInc = (frequency * 2.0 * Math.PI)/numSamples;
	var sinIndex = 0.0;
	var lastErr = 0.0;
	
	//Bit of a cheat to ensure the v. quantised signal is centred on the original sine wave.
	if(bitDepth < 9)
	  sinIndex = sinInc * 0.5;
	
	var lastY;

	canvasContext.strokeStyle = '#DD7D3B';
	canvasContext.beginPath();

	var noiseShaping = shapingToggle.checked;
	var dither = ditherToggle.checked;

	var maxVal = Math.floor(Math.pow(2.0, bitDepth)) - 1;

	for(var i=0;i<(numSamples + 2);++i) {

	  var sampleVal = -Math.sin(sinIndex);
	  sinIndex += sinInc;
	  sinIndex %= (2.0 * Math.PI);

	  //sampleVal now 0 -> 1.
	  sampleVal = (sampleVal + 1.0) * 0.5;

	  //sampleVal now 0 -> 2^bitDepth.
	  sampleVal *= maxVal;

	  //Add dither if necessary.
	  if(dither) {
		var randInt = Math.floor(Math.random() * Math.floor(3));
		switch(randInt) {
		  case 0:
			sampleVal += 1.0;
			break;
		  case 1:
			sampleVal -= 1.0;
			break;
		}

		if(sampleVal < 0.0)
		  sampleVal = 0.0;
		else if(sampleVal >= maxVal)
		  sampleVal = maxVal;
	  }

	  //Add noise shaping if necessary.
	  if(noiseShaping)
		sampleVal += lastErr * 0.99;

	  //Quantise sampleVal.
	  var unquantisedVal = sampleVal;
	  sampleVal = Math.round(sampleVal);

	  //Update last quantisation error.
	  lastErr = unquantisedVal - sampleVal;

	  //sampleVal now 0 -> 1 again.
	  sampleVal /= maxVal;

	  //sampleVal now -1 -> +1 again.
	  sampleVal = (sampleVal * 2.0) - 1.0;
	  
	  //console.log(sampleVal);

	  pos.y = centreY + (sampleVal * sinHeight);
	  
	  if(i == 0)
		canvasContext.moveTo(pos.x, pos.y);
	  else {
		if((bitDepth < 9) && (Math.abs(pos.y - lastY) > 0.01))
		  canvasContext.lineTo(pos.x, lastY);

		canvasContext.lineTo(pos.x, pos.y);
	  }
	  
	  lastY = pos.y;
	  pos.x += sampleDist;
	}
	canvasContext.stroke();
  }
}

function bitDepthSliderChange() {
  var bitDepthText = document.getElementById("bitDepthText");
  var bitDepth = bitDepthSlider.value;
  
  if(bitDepthSlider.value < 2)
	bitDepthText.innerHTML = "<strong>" + bitDepthSlider.value.toString() + "</strong> bit";
  else
	bitDepthText.innerHTML = "<strong>" + bitDepthSlider.value.toString() + "</strong> bits";

  const canvasContext = canvas.getContext('2d');
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  draw();
  
  if(audioRunning) {
	bitDepthGenNode.parameters.get('bitDepth').setValueAtTime(bitDepth, audioContext.currentTime);
  }
}

function digitalToggleChange() {
  const canvasContext = canvas.getContext('2d');
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  draw();
}

function ditherToggleChange() {
  const canvasContext = canvas.getContext('2d');
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  draw();
  
  if(audioRunning) {
	if(ditherToggle.checked)
	  bitDepthGenNode.parameters.get('dither').setValueAtTime(1.0, audioContext.currentTime);
	else
	  bitDepthGenNode.parameters.get('dither').setValueAtTime(0.0, audioContext.currentTime);
  }
}

function shapingToggleChange() {
  const canvasContext = canvas.getContext('2d');
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  draw();
  
  if(audioRunning) {
	if(shapingToggle.checked)
	  bitDepthGenNode.parameters.get('noiseShaping').setValueAtTime(1.0, audioContext.currentTime);
	else
	  bitDepthGenNode.parameters.get('noiseShaping').setValueAtTime(0.0, audioContext.currentTime);
  }
}

//Used to toggle our audio on and off.
//Function must be async in order to use await on audioWorklet.addModule().
async function audioToggle() {
  if(!audioRunning) {
	//Create web audio api context.
	audioContext = new (window.AudioContext || window.webkitAudioContext)();

	//Add our custom audio processor class.
	//addModule() returns a promise, so we have to await until it's fulfilled.
	await audioContext.audioWorklet.addModule(bitDepthGenURL);

	//Create an instance of our custom audio processor class.
	bitDepthGenNode = new BitDepthGenNode(audioContext);
	
	bitDepthGenNode.parameters.get('amplitude').setValueAtTime(0.0, audioContext.currentTime);
	bitDepthGenNode.parameters.get('amplitude').linearRampToValueAtTime(0.66, audioContext.currentTime + 0.25);

	//Connect our nodes to the audio context.
	bitDepthGenNode.connect(audioContext.destination);
	
	audioRunning = true;
	
	//Update audio button.
	document.getElementById("AudioToggle").innerHTML = "<span class='material-icons'>volume_up</span>";
  }
	else {
	//Stops the audio, releases any audio resources used.
		audioContext.close();
		
		audioRunning = false;
	
	//Update audio button.
	document.getElementById("AudioToggle").innerHTML = "<span class='material-icons'>volume_off</span>";
	}
}
