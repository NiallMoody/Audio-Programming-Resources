//Get canvas for setting internal resolution.
var canvas = null;
//Our main div.
var mainDiv = null;

//Get our on-screen controls.
var threshSlider = null;
var ratioSlider = null;
var loadFileInput = null;
var loadFileButton = null;
var soundFile = null;
var playLabel = null;
var playButton = null;
var makeUpSlider = null;

var threshold = -24.0;
var ratio = 12.0;
var makeUp = 1.0;

//True if audio is running.
var audioRunning = false;
//Our sound file playback node.
var soundFileNode = null;
//Our analyser running on the sound file input.
var inputAnalyser = null;
//Our analyser running on the compressor output.
var outputAnalyser = null;
///	Our compressor node.
var compressor = null;
///	Output gain for our compressor.
var makeUpGain = null;

//Array storing our input analyser time domain data.
var inputAnalyserArray;
//Array storing our output analyser time domain data.
var outputAnalyserArray;

//Used to filter our input analyser level.
var inputFilter = 0.0;
//Used to filter our output analyser level.
var outputFilter = 0.0;

window.addEventListener('load', (event) => {
    canvas = document.getElementById('responsive-canvas');
    mainDiv = document.getElementById('main');

    threshSlider = document.getElementById("ThreshSlider");
    ratioSlider = document.getElementById("RatioSlider");
    loadFileInput = document.getElementById("LoadFile");
    loadFileButton = document.getElementById("LoadFileButton");
    soundFile = document.getElementById("SoundFile");
    playLabel = document.getElementById("PlayLabel");
    playButton = document.getElementById("PlayButton");
    makeUpSlider = document.getElementById("MakeUpSlider");

    threshSlider.oninput = threshSliderChange;
    ratioSlider.oninput = ratioSliderChange;
    loadFileInput.onchange = loadFileChange;
    loadFileButton.onclick = loadFileButtonClick;
    playButton.onclick = audioToggle;
    makeUpSlider.oninput = makeUpSliderChange;

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
    let centreX = canvas.width / 2;
    const centreY = canvas.height / 2;

    canvasContext.fillStyle = 'white';
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);

    //Draw threshold/ratio graph.
    canvasContext.lineWidth = 4;
    canvasContext.strokeStyle = 'rgb(68, 84, 106)';
    canvasContext.fillStyle = '#44546A';
    canvasContext.font = '18px Open Sans';
    canvasContext.textAlign = 'center';

    let marginY = 24.0;
    let graphHeight = canvas.height - (marginY * 2.0);
    let graphBottom = graphHeight + marginY;
    let graphWidth = graphHeight;

    //A bit hacky, but it works with the code I've already written, so...
    centreX = graphWidth + (marginY * 3.0);

    let x = (centreX - graphWidth) * 0.5;

    canvasContext.translate(x - 8, marginY + (graphWidth / 2));
    canvasContext.rotate(-Math.PI / 2);
    canvasContext.fillText("Output",
        0,
        0,
        graphWidth);
    canvasContext.rotate((Math.PI / 2));
    canvasContext.translate(-(x - 8), -(marginY + (graphWidth / 2)));

    canvasContext.fillText("Input",
        x + (graphWidth / 2),
        canvas.height - 4,
        graphWidth);

    //Draw graph.
    canvasContext.strokeStyle = '#DD7D3B';
    canvasContext.beginPath();

    canvasContext.moveTo(x, graphBottom);

    let threshAmt = (threshold / 100.0) + 1;

    let y = (threshAmt * graphWidth);
    canvasContext.lineTo(x + (threshAmt * graphWidth), graphBottom - y);

    y += (graphWidth - y) / ratio;
    canvasContext.lineTo(x + graphWidth, graphBottom - y);

    canvasContext.stroke();

    //Draw axes.
    canvasContext.strokeStyle = '#44546A';
    canvasContext.beginPath();

    canvasContext.moveTo(x, marginY);
    canvasContext.lineTo(x, graphBottom);
    canvasContext.lineTo(x + graphWidth, graphBottom);

    canvasContext.stroke();

    let inputLevel = 0.0;
    let outputLevel = 0.0;

    centreX += marginY * 3.0;

    if (inputAnalyser && outputAnalyser) {
        inputAnalyser.getFloatTimeDomainData(inputAnalyserArray);
        outputAnalyser.getFloatTimeDomainData(outputAnalyserArray);

        //Calc input level.		
        for (let i = 0; i < inputAnalyserArray.length; ++i) {
            if (Math.abs(inputAnalyserArray[i]) > inputLevel)
                inputLevel = Math.abs(inputAnalyserArray[i]);
        }
        inputFilter += (inputLevel - inputFilter) * 0.15;
        inputLevel = 20 * Math.log10(inputFilter);
        if (inputLevel < -100.0)
            inputLevel = -100.0;
        inputLevel = (inputLevel / 100.0) + 1.0;

        //Calc overall output level.
        for (let i = 0; i < outputAnalyserArray.length; ++i) {
            if (Math.abs(outputAnalyserArray[i]) > outputLevel)
                outputLevel = Math.abs(outputAnalyserArray[i]);
        }
        outputFilter += (outputLevel - outputFilter) * 0.15;
        outputLevel = 20 * Math.log10(outputFilter);
        if (outputLevel < -100.0)
            outputLevel = -100.0;
        outputLevel = (outputLevel / 100.0) + 1.0;

        //Draw time domain graph.
        canvasContext.lineWidth = 2;
        canvasContext.beginPath();

        var step = (canvas.width - centreX) / outputAnalyserArray.length;
        for (var i = 0; i < outputAnalyserArray.length; ++i) {
            if (i == 0)
                canvasContext.moveTo(centreX, centreY - (outputAnalyserArray[i] * centreY));
            else {
                canvasContext.lineTo(centreX + (i * step),
                    centreY - (outputAnalyserArray[i] * centreY));
            }
        }

        canvasContext.stroke();
    }
    else {
        inputFilter += (0.0 - inputFilter) * 0.15;
        inputLevel = 20 * Math.log10(inputFilter);
        if (inputLevel < -100.0)
            inputLevel = -100.0;
        inputLevel = (inputLevel / 100.0) + 1.0;

        outputFilter += (0.0 - outputFilter) * 0.15;
        outputLevel = 20 * Math.log10(outputFilter);
        if (outputLevel < -100.0)
            outputLevel = -100.0;
        outputLevel = (outputLevel / 100.0) + 1.0;
    }

    //Draw input & output VU meters.
    centreX -= marginY * 3.0;

    canvasContext.fillStyle = '#44546A';
    canvasContext.beginPath();
    canvasContext.rect(centreX,
        graphBottom - (inputLevel * (graphBottom - marginY)),
        marginY,
        inputLevel * (graphBottom - marginY));
    canvasContext.fill();

    canvasContext.fillStyle = '#FFFFFF';
    canvasContext.translate(centreX + marginY - 8, marginY + (graphWidth / 2));
    canvasContext.rotate(-Math.PI / 2);
    canvasContext.fillText("Input",
        0,
        0,
        graphWidth);
    canvasContext.rotate((Math.PI / 2));
    canvasContext.translate(-(centreX + marginY - 8), -(marginY + (graphWidth / 2)));

    canvasContext.fillStyle = '#DD7D3B';
    canvasContext.beginPath();
    canvasContext.rect(centreX + marginY,
        graphBottom - (outputLevel * (graphBottom - marginY)),
        marginY,
        outputLevel * (graphBottom - marginY));
    canvasContext.fill();

    canvasContext.fillStyle = '#FFFFFF';
    canvasContext.translate(centreX + (marginY * 2.0) - 8, marginY + (graphWidth / 2));
    canvasContext.rotate(-Math.PI / 2);
    canvasContext.fillText("Output",
        0,
        0,
        graphWidth);
    canvasContext.rotate((Math.PI / 2));
    canvasContext.translate(-(centreX + (marginY * 2.0) - 8), -(marginY + (graphWidth / 2)));

    //Animate our canvas.
    requestAnimationFrame(draw);
}

//Used to toggle our audio on and off.
async function audioToggle() {
    if (!audioRunning) {
        try {
            //Create web audio api context.
            audioContext = new (window.AudioContext || window.webkitAudioContext)();

            soundFileNode = audioContext.createMediaElementSource(soundFile);

            inputAnalyser = audioContext.createAnalyser();
            inputAnalyser.fftSize = 2048;

            if (inputAnalyserArray == null)
                inputAnalyserArray = new Float32Array(inputAnalyser.fftSize);

            outputAnalyser = audioContext.createAnalyser();
            outputAnalyser.fftSize = 2048;

            if (outputAnalyserArray == null)
                outputAnalyserArray = new Float32Array(outputAnalyser.fftSize);

            compressor = audioContext.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(threshold, audioContext.currentTime);
            compressor.ratio.setValueAtTime(ratio, audioContext.currentTime);

            makeUpGain = audioContext.createGain();
            makeUpGain.gain.setValueAtTime(makeUp, audioContext.currentTime);

            soundFileNode.connect(inputAnalyser);
            inputAnalyser.connect(compressor);
            compressor.connect(makeUpGain);
            makeUpGain.connect(outputAnalyser);
            outputAnalyser.connect(audioContext.destination);

            audioRunning = true;

            soundFile.loop = true;
            soundFile.play();

            //Update audio button.
            playLabel.innerHTML = "<strong>Pause:</strong>";
            playButton.innerHTML = "<span class='material-icons'>pause_circle_outline</span>";
        }
        catch (err) {
            console.log("audioToggle() error: ", err);
        }
    }
    else {
        inputAnalyser = null;
        outputAnalyser = null;
        compressor = null;
        makeUpGain = null;

        //Stops the audio, releases any audio resources used.
        audioContext.close();

        audioRunning = false;

        //Update audio button.
        playLabel.innerHTML = "<strong>Play:</strong>";
        playButton.innerHTML = "<span class='material-icons'>play_circle_outline</span>";
    }
}

function threshSliderChange() {
    threshold = threshSlider.value;

    if (audioRunning) {
        compressor.threshold.linearRampToValueAtTime(threshold, audioContext.currentTime + 0.05);
    }
}

function ratioSliderChange() {
    ratio = ratioSlider.value;

    if (audioRunning) {
        compressor.ratio.linearRampToValueAtTime(ratio, audioContext.currentTime + 0.05);
    }
}

function loadFileChange() {
    soundFile.src = URL.createObjectURL(loadFileInput.files[0]);
    soundFile.load();
}

function loadFileButtonClick() {
    loadFileInput.click();
}

function makeUpSliderChange() {
    makeUp = makeUpSlider.value;

    if (audioRunning) {
        makeUpGain.gain.linearRampToValueAtTime(makeUp, audioContext.currentTime + 0.05);
    }
}
