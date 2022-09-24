// libraries, mostly canvas-sketch

const canvasSketch = require('canvas-sketch');
const math = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');
const risoColors =  require('riso-colors');
const Color = require('canvas-sketch-util/color');

const seed = random.getRandomSeed();

// establish size of canvas and other settings

const settings = {
  dimensions: [ 1080, 1080 ]
};


const sketch = ({ context, width, height }) => {
  random.setSeed(seed);
  console.log(random.value());
  console.log(random.value());
  console.log(random.value());

  let x, y, w, h, fill, stroke, blend;

  // NUMBER OF RECTS
  const num = 37;
  // ANGLE OF RECTS
  const degrees = -45;

  const rects = [];
  // COLOR PALETTE FROM RISO-COLORS
  const rectColors = [
    random.pick(risoColors),
    random.pick(risoColors),
    // random.pick(risoColors), // choosing one less color
  ];
  // pick color and convert to hex
  const bgColor = random.pick(risoColors).hex;

  // the polygon mask const
  const mask = {
    radius: width * 0.4,
    sides: 3,
    x: width * 0.5,
    y: height * 0.58,
  };

  // rectangles size, etc
  for (let i = 0; i < num; i++) {
    x = random.range(0, width);
    y = random.range(0, height);
    w = random.range(400, width);
    h = random.range(60, 200);

    fill = random.pick(rectColors).hex;
    stroke = random.pick(rectColors).hex;

    // mix of overlay and source blends for rects
    blend = (random.value() > 0) ? 'overlay' : 'source-over';

    // arrays for rectangles
    rects.push({ x, y, w, h, fill, stroke, blend});
  }

  return ({ context, width, height }) => {
    context.fillStyle = bgColor;
    context.fillRect(0, 0, width, height);


    context.save();
    context.translate(mask.x, mask.y);

    // DRAW polygon
    drawPolygon({ context, radius: mask.radius, sides: mask.sides })

    context.clip();

    
    
    rects.forEach(rect => {
      
      const { x, y, w, h, fill, stroke, blend } = rect;
      let shadowColor;
      
      context.save();
      context.translate(-mask.x, -mask.y);
      context.translate(x, y);
      context.strokeStyle = stroke;
      context.fillStyle = fill;
      context.lineWidth = 12;
      
      context.globalCompositeOperation = blend;
      
      drawSkewedRect({ context, w, h, degrees});
      
      shadowColor = Color.offsetHSL(fill, 0, 0, -20);
      shadowColor.rgba[3] = 0.5;
      
      context.shadowColor = Color.style(shadowColor.rgba);
      context.shadowOffsetX = -10;
      context.shadowOffsetY = 20;
      
      context.fill();
      
      context.shadowColor = null;
      context.stroke();
      
      context.globalCompositeOperation = 'source-over';
      
      
      context.lineWidth = 2;
      context.strokeStyle = 'black';
      context.stroke();
      
      context.restore();
    });
    
    context.restore();
    // polygon outline

    context.save();

    context.translate(mask.x, mask.y);
    context.lineWidth = 22;

    drawPolygon({ context, radius: mask.radius - context.lineWidth, sides: mask.sides })

    context.globalCompositeOperation = 'color-burn';
    context.strokeStyle = rectColors[0].hex;
    context.stroke();

    context.restore();


  };
};

const drawSkewedRect = ({ context, w, h, degrees}) => {
  
  const angle = math.degToRad(degrees);
  const rx = Math.cos(angle) * w;
  const ry = Math.sin(angle) * w;
  
  context.save();
  context.translate(rx * -0.5, (ry + h) * -0.5);
  
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(rx, ry);
  context.lineTo(rx, ry + h);
  context.lineTo(0, h);
  context.closePath(); 
  
  context.stroke();
  context.restore();
}

const drawPolygon = ({ context, radius = 300, sides = 3 }) => {
  const slice = Math.PI * 2 / sides;

  context.beginPath();
  context.moveTo(0, -radius);

  for (let i = 1; i < sides; i++) {
    const theta = i * slice - Math.PI * 0.5;
    context.lineTo(Math.cos(theta) * radius, Math.sin(theta) * radius);
  }
  context.closePath();
};

canvasSketch(sketch, settings);
