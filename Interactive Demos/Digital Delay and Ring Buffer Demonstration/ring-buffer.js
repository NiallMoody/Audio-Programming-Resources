const BufferSize = 128;
const Delay = BufferSize/2;

var buffer = Array(BufferSize).fill(0.0);
var writePos = 0;
var readPos = Delay;

var UpdateFrames = 1;
var frameIndex = UpdateFrames;

var drawAsPoints = false;
var dragging = false;

var displayPointerMovesCanvas = false;

//Hook up event listeners.
window.addEventListener('resize', resize);

window.addEventListener('load', () => {
	let dataMovesCanvas = document.getElementById('dataMovesCanvas');
	dataMovesCanvas.addEventListener('mousedown', (event) => {
		dragging = true;
		buffer[writePos] = ((((event.offsetY * window.devicePixelRatio)/dataMovesCanvas.height) * 2) - 1);
	});
	document.addEventListener('mouseup', (event) => {
		dragging = false;
	});
	dataMovesCanvas.addEventListener('mousemove', dragCanvas);

	let pointerMovesCanvas = document.getElementById('pointerMovesCanvas');
	pointerMovesCanvas.addEventListener('mousedown', (event) => {
		dragging = true;
		buffer[writePos] = ((((event.offsetY * window.devicePixelRatio)/pointerMovesCanvas.height) * 2) - 1);
		
		displayPointerMovesCanvas = true;
	});
	pointerMovesCanvas.addEventListener('mousemove', dragCanvas);
	
	let pointsToggle = document.getElementById('pointsToggle');
	pointsToggle.addEventListener('change', (event) => {
		drawAsPoints = pointsToggle.checked;
	});
	
	let speedSlider = document.getElementById('speedSlider');
	speedSlider.addEventListener('input', (event) => {
		UpdateFrames = 17 - speedSlider.value;
	});
	
	resize();
	draw();
});

//Called when the user drags either of the 2 canvases.
function dragCanvas(event) {
	if(dragging) {
			buffer[writePos] = ((((event.offsetY * window.devicePixelRatio)/dataMovesCanvas.height) * 2) - 1);
			if(buffer[writePos] < -1)
				buffer[writePos] = -1;
			else if(buffer[writePos] > 1)
				buffer[writePos] = 1;
		}
}

//Copied from: https://stackoverflow.com/a/5354536
function checkVisible(elm) {
  var rect = elm.getBoundingClientRect();
  var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
  return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}

//Used to resize our canvas when the window's resized.
function resize() {
	let mainDiv = document.getElementById('mainDiv');
	let boundingRect = mainDiv.getBoundingClientRect();

	let dataMovesCanvas = document.getElementById('dataMovesCanvas');
  dataMovesCanvas.width = Math.floor(boundingRect.width) * window.devicePixelRatio;
  dataMovesCanvas.height = 256 * window.devicePixelRatio;

	let pointerMovesCanvas = document.getElementById('pointerMovesCanvas');
  pointerMovesCanvas.width = Math.floor(boundingRect.width) * window.devicePixelRatio;
  pointerMovesCanvas.height = 256 * window.devicePixelRatio;
}

//Used to redraw the canvas when necessary.
function draw() {
	let dataMovesCanvas = document.getElementById('dataMovesCanvas');
	let pointerMovesCanvas = document.getElementById('pointerMovesCanvas');
	
	if(checkVisible(dataMovesCanvas) || checkVisible(pointerMovesCanvas)) {
		//Update buffer.
		--frameIndex;
		if(frameIndex < 1) {
			let val = buffer[writePos];
			++writePos;
			if(writePos >= buffer.length) {
				writePos -= BufferSize;
			}
			buffer[writePos] = val;

			++readPos;
			if(readPos >= buffer.length) {
				readPos -= BufferSize;
			}

			frameIndex = UpdateFrames;
		}
	}
	
	if(checkVisible(dataMovesCanvas)) {
  	let dataContext = dataMovesCanvas.getContext('2d');
		
		const actualWidth = dataMovesCanvas.width - 12;
		const centreY = dataMovesCanvas.height/2;
		const halfHeight = centreY - 3;
		const sampleDist = actualWidth/BufferSize;

		let x = actualWidth;
		let y = buffer[writePos];

		dataContext.fillStyle = 'white';
		dataContext.fillRect(0, 0, dataMovesCanvas.width, dataMovesCanvas.height);

		if(drawAsPoints) {
			dataContext.fillStyle = 'rgb(68, 84, 106)';

			for(let i=0;i<BufferSize;++i) {
				x -= sampleDist;

				let index = writePos - i;
				if(index < 0)
					index += BufferSize;
				y = buffer[index];

				dataContext.fillRect(x - 2, centreY + (y * halfHeight) - 2, 4, 4);
			}
		}
		else {
			dataContext.strokeStyle = 'rgb(68, 84, 106)';
			dataContext.lineWidth = 4;

			//Draw buffer contents.
			dataContext.beginPath();
			dataContext.moveTo(actualWidth, centreY + (y * halfHeight));

			for(let i=1;i<BufferSize;++i) {
				x -= sampleDist;

				let index = writePos - i;
				if(index < 0)
					index += BufferSize;
				y = buffer[index];

				dataContext.lineTo(x, centreY + (y * halfHeight));
			}
			dataContext.stroke();
		}

		//Draw input position.
		dataContext.strokeStyle = 'rgb(68, 84, 106)';
		dataContext.lineWidth = 4;
		dataContext.fillStyle = 'white';
		dataContext.beginPath();
		dataContext.ellipse(actualWidth,
												centreY + (buffer[writePos] * halfHeight),
												8,
												8,
												0,
												0,
												2 * Math.PI);
		dataContext.fill();
		dataContext.stroke();

		//Draw output position.
		dataContext.strokeStyle = '#DD7D3B';
		dataContext.beginPath();
		dataContext.ellipse(((BufferSize - Delay)/BufferSize) * actualWidth,
												centreY + (buffer[readPos] * halfHeight),
												8,
												8,
												0,
												0,
												2 * Math.PI);
		dataContext.fill();
		dataContext.stroke();
	}
	
	if(checkVisible(pointerMovesCanvas)) {
  	let pointerContext = pointerMovesCanvas.getContext('2d');
		const actualWidth = pointerMovesCanvas.width - 12;
		const centreY = pointerMovesCanvas.height/2;

		pointerContext.fillStyle = 'white';
		pointerContext.fillRect(0, 0, pointerMovesCanvas.width, pointerMovesCanvas.height);
		
		if(!displayPointerMovesCanvas) {
			pointerContext.font = '40px "Open Sans"';
			pointerContext.fillStyle = '#DD7D3B';
			pointerContext.textAlign = 'center';
			
			pointerContext.fillText('Click to view', actualWidth/2, centreY, actualWidth);
		}
		else {
			const halfHeight = centreY - 3;
			const sampleDist = actualWidth/BufferSize;

			let x = 0;
			let y = buffer[0];

			if(drawAsPoints) {
				pointerContext.fillStyle = 'rgb(68, 84, 106)';

				for(let i=0;i<BufferSize;++i) {
					y = buffer[i];

					pointerContext.fillRect(x - 2, centreY + (y * halfHeight) - 2, 4, 4);

					x += sampleDist;
				}
			}
			else {
				pointerContext.strokeStyle = 'rgb(68, 84, 106)';
				pointerContext.lineWidth = 4;

				//Draw buffer contents.
				pointerContext.beginPath();
				pointerContext.moveTo(0, centreY + (buffer[0] * halfHeight));

				for(let i=1;i<BufferSize;++i) {
					y = buffer[i];

					pointerContext.lineTo(x, centreY + (y * halfHeight));

					x += sampleDist;
				}
				pointerContext.stroke();
			}

			//Draw input position.
			pointerContext.strokeStyle = 'rgba(68, 84, 106, 0.5)';
			pointerContext.lineWidth = 4;

			pointerContext.beginPath();
			pointerContext.moveTo(writePos * sampleDist,
														0);
			pointerContext.lineTo(writePos * sampleDist,
														pointerMovesCanvas.height);
			pointerContext.stroke();

			pointerContext.strokeStyle = 'rgb(68, 84, 106)';
			pointerContext.fillStyle = 'white';
			pointerContext.beginPath();
			pointerContext.ellipse(writePos * sampleDist,
														 centreY + (buffer[writePos] * halfHeight),
														 8,
														 8,
														 0,
														 0,
														 2 * Math.PI);
			pointerContext.fill();
			pointerContext.stroke();

			//Draw output position.
			pointerContext.strokeStyle = 'rgba(221, 125, 59, 0.5)';
			pointerContext.lineWidth = 4;

			pointerContext.beginPath();
			pointerContext.moveTo(readPos * sampleDist,
														0);
			pointerContext.lineTo(readPos * sampleDist,
														pointerMovesCanvas.height);
			pointerContext.stroke();

			pointerContext.strokeStyle = '#DD7D3B';
			pointerContext.beginPath();
			pointerContext.ellipse(readPos * sampleDist,
														 centreY + (buffer[readPos] * halfHeight),
														 8,
														 8,
														 0,
														 0,
														 2 * Math.PI);
			pointerContext.fill();
			pointerContext.stroke();
		}
	}

	window.requestAnimationFrame(draw);
}