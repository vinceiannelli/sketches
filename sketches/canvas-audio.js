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

  //
  for (i = 0; i < numCircles * numSlices; i++) {
    bin = random.rangeFloor(4, 64);
    if (random.value() > 0.5) bin = 0;
    bins.push(bin);
  }

  for (i = 0; i < numCircles; i++) {
    const easeT = i / (numCircles - 1);
    lineWidth = eases.quadIn(easeT) * 200 + 20;
    lineWidths.push(lineWidth);
  }

  return ({ context, width, height }) => {
    context.fillStyle = "#eeeaE0";
    context.fillRect(0, 0, width, height);

    if (!audioContext) return;

    analyserNode.getFloatFrequencyData(audioData);
    context.save();
    context.translate(width * 0.5, height * 0.5);

    let cRadius = radius;

    for (i = 0; i < numCircles; i++) {
      context.save();
      for (j = 0; j < numSlices; j++) {
        context.rotate(slice);
        context.lineWidth = lineWidths[i];

        bin = bins[i * numSlices + j];
        if (!bin) continue;

        mapped = math.mapRange(audioData[bin], minDb, maxDb, 0, 1, true);

        lineWidth = lineWidths[i] * mapped;
        if (lineWidth < 1) continue;

        context.lineWidth = lineWidth;

        context.beginPath();
        context.arc(0, 0, cRadius + context.lineWidth * 0.5, 0, slice);
        context.stroke();
      }

      cRadius += lineWidths[i];

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

const createAudio = () => {
  audio = document.createElement("audio");
  audio.src = "cctown.mp3";

  audioContext = new AudioContext();

  sourceNode = audioContext.createMediaElementSource(audio);
  sourceNode.connect(audioContext.destination);

  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 512;
  analyserNode.smoothingTimeConstant = 0.9;

  sourceNode.connect(analyserNode);

  minDb = analyserNode.minDecibels;
  maxDb = analyserNode.maxDecibels;

  audioData = new Float32Array(analyserNode.frequencyBinCount);

  // console.log(audioData.length);
};

const getAverage = (data) => {
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  return sum / data.length;
};

const start = async () => {
  addListeners();
  manager = await canvasSketch(sketch, settings);
  manager.pause();
};

start();
