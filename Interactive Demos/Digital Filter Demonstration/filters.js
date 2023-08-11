//Get canvas for setting internal resolution.
var canvas;
//Our main div.
var mainDiv;

//Get our on-screen controls.
var freqSlider;
var typeCombo;

var frequency = 22050.0;
var filterType = "lowpass";

//True if audio is running.
var audioRunning = false;
//Our noise buffer.
var noiseBuffer = null;
//Our noise source.
var noiseSource = null;
//Our filter node.
var filter = null;
//Our analyser running on our microphone input.
var analyser = null;

//Array storing our analyser FFT data.
var frequencyArray;
//Array storing our analyser time domain data.
var timeArray;

window.addEventListener("load", () => {
	//Get canvas for setting internal resolution.
	canvas = document.getElementById('responsive-canvas');
	//Our main div.
	mainDiv = document.getElementById('main');

	//Get our on-screen controls.
	freqSlider = document.getElementById("FreqSlider");
	typeCombo = document.getElementById("FilterType");

	freqSlider.oninput = freqSliderChange;
	typeCombo.onchange = typeComboChange;

	window.onresize = resize;
	resize();
});

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

//Draw our canvas.
function draw() {
  //Start drawing.
  const canvasContext = canvas.getContext('2d');
	const centreX = canvas.width/2;
	const centreY = canvas.height/2;
  
	canvasContext.fillStyle = 'white';
	canvasContext.fillRect(0, 0, canvas.width, canvas.height);
	
	if(analyser) {
		//Draw time domain graph.
		analyser.getFloatTimeDomainData(timeArray);
		
		canvasContext.lineWidth = 2;
		canvasContext.strokeStyle = 'rgb(68, 84, 106)';
		
		canvasContext.beginPath();
		
		var step = centreX/timeArray.length;
		for(var i=0;i<timeArray.length;++i) {
			if(i == 0)
				canvasContext.moveTo(0, centreY - (timeArray[i] * centreY));
			else
				canvasContext.lineTo(i * step, centreY - (timeArray[i] * centreY));
		}
		
		canvasContext.stroke();
		
		//Draw frequency domain graph.
		analyser.getFloatFrequencyData(frequencyArray);

		canvasContext.strokeStyle = 'rgb(221, 125, 59)';
		
		canvasContext.beginPath();
		
		step = centreX/frequencyArray.length;
		for(var i=0;i<frequencyArray.length;++i) {
			var yVal = Math.max(-90.0, Math.min(frequencyArray[i], 0.0));
			
			yVal = ((yVal + 90.0)/90.0) * 1.5;
			
			yVal = (yVal * canvas.height);
			
			if(i == 0) {
				canvasContext.moveTo(centreX,
														 canvas.height - yVal);
			}
			else {
				canvasContext.lineTo(centreX + (i * step),
														 canvas.height - yVal);
			}
		}
			
		canvasContext.stroke();
	}
	
	//Animate our canvas.
	requestAnimationFrame(draw);
}

//Used to toggle our audio on and off.
async function audioToggle() {
  if(!audioRunning) {
		try {
			//Create web audio api context.
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
			
			//Create our noise source (we're going to chear a bit and just loop through a buffer filled with noise).
			const noiseLength = audioContext.sampleRate * 2.0;
			noiseBuffer = audioContext.createBuffer(1, noiseLength, audioContext.sampleRate);
			
			let noiseData = noiseBuffer.getChannelData(0);
			for(let i=0;i<noiseLength;++i) {
				noiseData[i] = (Math.random() * 1.0) - 0.5;
			}
			
			noiseSource = audioContext.createBufferSource();
			noiseSource.buffer = noiseBuffer;
			noiseSource.loop = true;
			
			//Create our filter node.
			filter = audioContext.createBiquadFilter();
			filter.type = filterType;
			filter.frequency.setValueAtTime(22050.0, audioContext.currentTime);
			
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 2048;
			
			if(frequencyArray == null)
				frequencyArray = new Float32Array(analyser.frequencyBinCount);
			if(timeArray == null)
				timeArray = new Float32Array(analyser.fftSize);

			noiseSource.connect(filter);
			filter.connect(analyser);
			filter.connect(audioContext.destination);
			
			noiseSource.start();

			audioRunning = true;

			//Update audio button.
			document.getElementById("AudioToggle").innerHTML = "<span class='material-icons'>volume_up</span>";
		}
		catch (err) {
			console.log("audioToggle() error: ", err);
		}
  }
	else {
		noiseBuffer = null;
		noiseSource = null;
		filter = null;
		analyser = null;
		
	//Stops the audio, releases any audio resources used.
		audioContext.close();
		
		audioRunning = false;
	
	//Update audio button.
	document.getElementById("AudioToggle").innerHTML = "<span class='material-icons'>volume_off</span>";
	}
}

function freqSliderChange() {
	frequency = freqSlider.value;
	
	if(audioRunning) {
		filter.frequency.linearRampToValueAtTime(frequency, audioContext.currentTime + 0.05);
	}
}

function typeComboChange() {
	if(typeCombo.value == "low pass")
		filterType = "lowpass";
	else if(typeCombo.value == "high pass")
		filterType = "highpass";
	else if(typeCombo.value == "band pass")
		filterType = "bandpass";
	
	console.log(typeCombo.value, " : ", filterType);
	
	if(audioRunning) {
		filter.type = filterType;
	}
}
