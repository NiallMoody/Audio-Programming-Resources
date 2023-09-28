//Get on-screen controls.
var audioToggleButton;
var leftSlider;
var leftOutput;
var rightSlider;
var rightOutput;

//True if audio is running.
var audioRunning = false;

var attenuation = null;
var leftDelay = null;
var rightDelay = null;

//Scheduler variables.
const lookahead = 25.0;
const scheduleAheadTime = 0.1;
const tempo = 140.0;
var nextTriggerTime = 0.0;
var schedulerId = -1;

window.addEventListener('load', (event) => {
	audioToggleButton = document.getElementById('audioToggleButton');
	leftSlider = document.getElementById('leftSlider');
	leftOutput = document.getElementById('leftOutput');
	rightSlider = document.getElementById('rightSlider');
	rightOutput = document.getElementById('rightOutput');

	leftSlider.addEventListener('input', (event) => {
		let value = parseFloat(leftSlider.value);
		
		if(leftDelay != null) {
			leftDelay.delayTime.linearRampToValueAtTime(value/1000.0, audioContext.currentTime + 0.03);
		}

		leftOutput.innerHTML = `${value.toFixed(2)} ms`;
	});

	rightSlider.addEventListener('input', (event) => {
		let value = parseFloat(rightSlider.value);
		
		if(rightDelay != null) {
			rightDelay.delayTime.linearRampToValueAtTime(value/1000.0, audioContext.currentTime + 0.03);
		}

		rightOutput.innerHTML = `${value.toFixed(2)} ms`;
	});

	audioToggleButton.addEventListener('mouseup', audioToggle);
});

//Used to toggle our audio on and off.
function audioToggle() {
  if(!audioRunning) {
	//Create web audio api context.
	audioContext = new (window.AudioContext || window.webkitAudioContext)();
		
		let oscillator = audioContext.createOscillator();
		
		oscillator.type = 'sine';
		oscillator.frequency.setValueAtTime(880.0, audioContext.currentTime);
		
		attenuation = audioContext.createGain();
		attenuation.gain.setValueAtTime(0.0, audioContext.currentTime);
		oscillator.connect(attenuation);


		leftDelay = audioContext.createDelay(1.0);
		leftDelay.delayTime.setValueAtTime(0.0, audioContext.currentTime+0.01);
		
		let leftPan = audioContext.createStereoPanner();
		leftPan.pan.setValueAtTime(-1.0, audioContext.currentTime);

		attenuation.connect(leftDelay);
		leftDelay.connect(leftPan);
		leftPan.connect(audioContext.destination);
		
		rightDelay = audioContext.createDelay(1.0);
		rightDelay.delayTime.setValueAtTime(0.0, audioContext.currentTime+0.01);
		
		let rightPan = audioContext.createStereoPanner();
		rightPan.pan.setValueAtTime(1.0, audioContext.currentTime);

		attenuation.connect(rightDelay);
		rightDelay.connect(rightPan);
		rightPan.connect(audioContext.destination);
		
		oscillator.start();
		
		scheduler();
	
	audioRunning = true;
	
	//Update audio button.
	document.getElementById('audioToggleButton').innerHTML = "<span class='material-icons'>volume_up</span>";
  }
	else {
		if(schedulerId > -1) {
			clearTimeout(schedulerId);
			schedulerId = -1;
		}
		
	//Stops the audio, releases any audio resources used.
		audioContext.close();
		
		nextTriggerTime = 0.0;
		
		attenuation = null;
		leftDelay = null;
		rightDelay = null;
		
		audioContext = null;
		
		audioRunning = false;
	
	//Update audio button.
	document.getElementById('audioToggleButton').innerHTML = "<span class='material-icons'>volume_off</span>";
	}
}

//We use this function to schedule a repeating envelope trigger on the oscillator.
function scheduler() {
	while(nextTriggerTime < (audioContext.currentTime + scheduleAheadTime)) {
		attenuation.gain.cancelScheduledValues(nextTriggerTime);
		attenuation.gain.setValueAtTime(0.0, nextTriggerTime);
		attenuation.gain.linearRampToValueAtTime(0.6, nextTriggerTime + 0.005);
		attenuation.gain.linearRampToValueAtTime(0.0, nextTriggerTime + 0.005 + 0.1);
		
		nextTriggerTime += 60.0/tempo;
	}
	
	schedulerId = setTimeout(scheduler, lookahead);
}