const canvasSketch = require("canvas-sketch");
const { mapRange } = require("canvas-sketch-util/math");
const math = require("canvas-sketch-util/math");
const random = require("canvas-sketch-util/random");
const eases = require("eases");

// canvas-sketch settings
const settings = {
  dimensions: [1080, 1080],
  animate: true,
};

// global variables
let audio;
let audioContext, audioData, sourceNode, analyserNode;
let manager;
let minDb, maxDb;

// the drawing function
const sketch = () => {
  // audio.play();

  // establishing the number of concentric circles and slices
  const numCircles = 5;
  const numSlices = 9;
  const slice = (Math.PI * 2) / numSlices;
  const radius = 200;

  // array of FFT audio info
  const bins = [];
  // array for base line widths of each slice
  const lineWidths = [];

  let lineWidth, bin, mapped;

  // assigning random base values for each FFT bin
  for (i = 0; i < numCircles * numSlices; i++) {
    bin = random.rangeFloor(4, 64);
    if (random.value() > 0.5) bin = 0;
    bins.push(bin);
  }

  // uses easing functions to draw growing line widths for each concentric circle
  for (i = 0; i < numCircles; i++) {
    const easeT = i / (numCircles - 1);
    // uses a quadratic scale
    lineWidth = eases.quadIn(easeT) * 200 + 20;
    lineWidths.push(lineWidth);
  }

  // the actual canvas drawing elements
  return ({ context, width, height }) => {
    // sets background
    context.fillStyle = "#eeeaE0";
    context.fillRect(0, 0, width, height);

    // if no mouseClick, there's no audiocontext, so do nothing
    if (!audioContext) return;

    // get frequency data
    analyserNode.getFloatFrequencyData(audioData);
    // set drawing context to centre of canvas
    context.save();
    context.translate(width * 0.5, height * 0.5);

    // variable for each concentric circle's radius
    let cRadius = radius;

    // loops through each circle and each slice
    for (i = 0; i < numCircles; i++) {
      context.save();
      for (j = 0; j < numSlices; j++) {
        // rotates each slice arc
        context.rotate(slice);
        context.lineWidth = lineWidths[i];

        // set bin value for current slice
        bin = bins[i * numSlices + j];
        // bin is 0, stop current loop and continue the next iteration
        if (!bin) continue;

        // maprange proporationally maps a range of values to another
        // here we take FFT audio data to a value between 0 and 1
        mapped = math.mapRange(audioData[bin], minDb, maxDb, 0, 1, true);

        // use mapped value to determine line widths
        lineWidth = lineWidths[i] * mapped;
        if (lineWidth < 1) continue;

        // line width for drawing below
        context.lineWidth = lineWidth;

        // drawing each arc
        context.beginPath();
        context.arc(0, 0, cRadius + context.lineWidth * 0.5, 0, slice);
        context.stroke();
      }

      // establishing radius for growing circles (thicker as getting bigger)
      cRadius += lineWidths[i];

      // restores default context translation
      context.restore();
    }

    context.restore();

    // for (i = 0; i < bins.length; i++) {
    //   // console.log(audioData);
    //   const bin = bins[i];

    //   let mapped = math.mapRange(
    //     audioData[bin],
    //     analyserNode.minDecibels,
    //     analyserNode.maxDecibels,
    //     0,
    //     1,
    //     true
    //   );
    //   const radius = mapped * 300;

    //   // console.log(mapped);

    // }
  };
};

// listening for mouse clicks to start / stop audio and drawing
const addListeners = () => {
  window.addEventListener("mouseup", () => {
    if (!audioContext) createAudio();

    if (audio.paused) {
      audio.play();
      manager.play();
    } else {
      audio.pause();
      manager.pause();
    }
  });
};

// audio context for playing back audio
const createAudio = () => {
  audio = document.createElement("audio");
  audio.src = "cctown.mp3";

  audioContext = new AudioContext();

  sourceNode = audioContext.createMediaElementSource(audio);
  sourceNode.connect(audioContext.destination);

  // freq analyzer
  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 512;
  analyserNode.smoothingTimeConstant = 0.9;

  sourceNode.connect(analyserNode);

  minDb = analyserNode.minDecibels;
  maxDb = analyserNode.maxDecibels;

  // stores audio FFT info as a specific type of array
  audioData = new Float32Array(analyserNode.frequencyBinCount);

  // console.log(audioData.length);
};

// const getAverage = (data) => {
//   let sum = 0;

//   for (let i = 0; i < data.length; i++) {
//     sum += data[i];
//   }
//   return sum / data.length;
// };

// async; uses canvas-sketch util 'sketch manager' to pause drawing with audio
const start = async () => {
  addListeners();
  manager = await canvasSketch(sketch, settings);
  manager.pause();
};

start();
