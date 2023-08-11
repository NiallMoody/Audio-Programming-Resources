var canvas;

var freqSlider;
var samplesCheckbox;
var aliasedCheckbox;

var frequency = 2.0;

//True if audio is running.
var audioRunning = false;

var aliasingGenNode;

window.addEventListener('load', (event) => {
	//Get canvas for setting internal resolution.
	canvas = document.getElementById('responsive-canvas');

	//Get our on-screen controls.
	freqSlider = document.getElementById("FreqSlider");
	samplesCheckbox = document.getElementById("SamplesToggle");
	aliasedCheckbox = document.getElementById("AliasedToggle");

	freqSlider.oninput = freqSliderChange;
	samplesCheckbox.onchange = samplesCheckboxChange;
	aliasedCheckbox.onchange = aliasedCheckboxChange;

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
const aliasingGenURL = getURLFromInlineCode`
class AliasingGenerator extends AudioWorkletProcessor {

  static get parameterDescriptors () {
	return [{
	  name: 'frequency',
	  defaultValue: 1,
	  minValue: 1,
	  maxValue: 8,
	  automationRate: 'a-rate'
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
	/*this.frequency = 1.0;
	this.amplitude = 0.0;*/

	this.sinCounter = 0.0;
	this.sinVal = [0, 0, 0, 0];

	//Used to fake the nyquist cancellation.
	this.ampVal = [0, 0, 0, 0];

	//Our artificially-lowered samplerate.
	this.fakeSamplerate = 1660.0;
  }

  //Generate our audio.
  process(inputs, outputs, parameters) {
	for(let i=0;i<outputs[0].length;++i) {
	  const buffer = outputs[0][i];

	  if(i == 0) {
		for(let j=0;j<buffer.length;++j) {
		  this.sinCounter += this.fakeSamplerate/sampleRate;

		  var freq = (parameters['frequency'].length > 1) ? parameters['frequency'][i] : parameters['frequency'][0];
		  var amp = (parameters['amplitude'].length > 1) ? parameters['amplitude'][i] : parameters['amplitude'][0];

		  if(this.sinCounter >= 1.0)
		  {
			this.sinVal[0] = this.sinVal[1];
			this.sinVal[1] = this.sinVal[2];
			this.sinVal[2] = this.sinVal[3];

			this.sinVal[3] = Math.sin(this.sinIndex);
			this.sinIndex += ((freq * 220.0)/this.fakeSamplerate) * 2.0 * Math.PI;
			this.sinIndex %= (2.0 * Math.PI);

			this.ampVal[0] = this.ampVal[1];
			this.ampVal[1] = this.ampVal[2];
			this.ampVal[2] = this.ampVal[3];

			if((freq > 3.9) && (freq < 4.0))
			  this.ampVal[3] = 1.0 - ((freq - 3.9)/0.1);
			else if((freq >= 4.0) && (freq < 4.1))
			  this.ampVal[3] = (freq - 4.0)/0.1;
			else
			  this.ampVal[3] = 1.0;

			this.sinCounter -= 1.0;
		  }

		  //B-spline interpolation to get our aliased sine wave.
		  var ym1py1 = this.sinVal[0] + this.sinVal[2];
		  var c0 = (1.0/6.0) * ym1py1 + (2.0/3.0) * this.sinVal[1];
		  var c1 = (1.0/2.0) * (this.sinVal[2]-this.sinVal[0]);
		  var c2 = (1.0/2.0) * ym1py1 - this.sinVal[1];
		  var c3 = (1.0/2.0) * (this.sinVal[1]-this.sinVal[2]) + (1.0/6.0) * (this.sinVal[3]-this.sinVal[0]);
		  buffer[j] = ((c3*this.sinCounter+c2)*this.sinCounter+c1)*this.sinCounter+c0;

		  buffer[j] *= amp;

		  //B-spline interpolation of our amplitude hitting zero at nyquist.
		  ym1py1 = this.ampVal[0] + this.ampVal[2];
		  c0 = (1.0/6.0) * ym1py1 + (2.0/3.0) * this.ampVal[1];
		  c1 = (1.0/2.0) * (this.ampVal[2]-this.ampVal[0]);
		  c2 = (1.0/2.0) * ym1py1 - this.ampVal[1];
		  c3 = (1.0/2.0) * (this.ampVal[1]-this.ampVal[2]) + (1.0/6.0) * (this.ampVal[3]-this.ampVal[0]);
		  buffer[j] *= ((c3*this.sinCounter+c2)*this.sinCounter+c1)*this.sinCounter+c0;
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

registerProcessor('AliasingGen', AliasingGenerator);
`

//Node for our audio processor.
class AliasingGenNode extends AudioWorkletNode {
  constructor(context) {
	super(context, 'AliasingGen');
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
  
  draw();
}

//Used to redraw the canvas when necessary.
function draw() {
  //Start drawing.
  const canvasContext = canvas.getContext('2d');
  const centreY = canvas.height/2;
  const sinHeight = centreY - 8;
  
  /*canvasContext.fillStyle = 'white';
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);*/

  if(samplesCheckbox.checked)
	canvasContext.strokeStyle = 'rgb(132, 150, 176)';
  else
	canvasContext.strokeStyle = 'rgb(68, 84, 106)';
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
  var sampleDist = canvas.width/16.0;
  var samples = new Array(19);
  
  for(let i=0;i<19;++i) {
	//Calculate y position.
	samples[i] = centreY;
	samples[i] -= Math.sin((i/16) * frequency * 2 * Math.PI) * sinHeight;
  }
  
  //Draw aliased line.
  if(aliasedCheckbox.checked) {
	let points = [[-sampleDist, centreY - Math.sin((-1/16) * frequency * 2 * Math.PI) * sinHeight], [0, samples[0]], [sampleDist, samples[1]], [sampleDist * 2, samples[2]]];
	
	canvasContext.strokeStyle = 'rgb(221, 125, 59)';
	
	canvasContext.beginPath();
	canvasContext.moveTo(0, centreY);
	
	var x = 0;
	var xInc = canvas.width/1024;
	var lastX = 0;
	for(let i=1;i<1024;++i) {
	  var samplesX = (x/canvas.width) * 16;
	  var fraction = samplesX - Math.floor(samplesX);
	  samplesX = Math.floor(samplesX);
	  
	  if(samplesX != lastX) {
		//x-axis.
		points[0][0] = sampleDist * (i-1);
		points[1][0] = sampleDist * i;
		points[2][0] = sampleDist * (i+1);
		points[3][0] = sampleDist * (i+1);
		
		//y-axis.
		points[0][1] = points[1][1];
		points[1][1] = points[2][1];
		points[2][1] = points[3][1];
		points[3][1] = samples[samplesX + 2];
		
		lastX = samplesX;
	  }
	  
	  var temp = thirdInterp(fraction, points[0][1], points[1][1], points[2][1], points[3][1]);
	  canvasContext.lineTo(x, temp);
	  
	  x += xInc;
	}
	canvasContext.stroke();
  }
  
  //Draw samples.
  if(samplesCheckbox.checked) {
	var x = 0;

	for(let i=0;i<17;++i) {
	  //Set draw colours.
	  canvasContext.fillStyle = 'rgb(255, 255, 255)';
	  canvasContext.strokeStyle = 'rgb(68, 84, 106)';
	  
	  //Draw vertical line.
	  canvasContext.beginPath();
	  canvasContext.moveTo(x, centreY);
	  canvasContext.lineTo(x, samples[i]);
	  canvasContext.stroke();
	  
	  //Draw sample circle.
	  
	  canvasContext.beginPath();
	  canvasContext.arc(x, samples[i], 5, 0, 2 * Math.PI, false);
	  canvasContext.fill();
	  canvasContext.stroke();
	  
	  x += sampleDist;
	}
  }
}

function freqSliderChange() {
  frequency = freqSlider.value;
  
  if((frequency > 8) && (frequency < 8.05)) {
	frequency = 8;
	freqSlider.value = frequency;
  }
  
  if(audioRunning) {
	aliasingGenNode.parameters.get('frequency').linearRampToValueAtTime(frequency * 0.5, audioContext.currentTime + 0.05);
  }

  const canvasContext = canvas.getContext('2d');
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  draw();
}

function samplesCheckboxChange() {
  const canvasContext = canvas.getContext('2d');
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  draw();
}

function aliasedCheckboxChange() {
  const canvasContext = canvas.getContext('2d');
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  draw();
}

//Used to toggle our audio on and off.
//Function must be async in order to use await on audioWorklet.addModule().
async function audioToggle() {
  if(!audioRunning) {
	//Create web audio api context.
	audioContext = new (window.AudioContext || window.webkitAudioContext)();

	//Add our custom audio processor class.
	//addModule() returns a promise, so we have to await until it's fulfilled.
	await audioContext.audioWorklet.addModule(aliasingGenURL);

	//Create an instance of our custom audio processor class.
	aliasingGenNode = new AliasingGenNode(audioContext);
	
	aliasingGenNode.parameters.get('amplitude').setValueAtTime(0.0, audioContext.currentTime);
	aliasingGenNode.parameters.get('amplitude').linearRampToValueAtTime(1.0, audioContext.currentTime + 0.25);

	//Connect our nodes to the audio context.
	aliasingGenNode.connect(audioContext.destination);
	
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

//Interpolation function used in drawing the aliased line.
function thirdInterp(x, L1, L0, H0,H1) {
	return L0 + 0.5 *
	x*(H0-L1 +
	   x*(H0 + L0*(-2) + L1 +
		  x*( (H0 - L0)*9 + (L1 - H1)*3 +
			 x*((L0 - H0)*15 + (H1 -  L1)*5 +
				x*((H0 - L0)*6 + (L1 - H1)*2 )))));
}
