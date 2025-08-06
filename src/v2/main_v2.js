import { initBuffers, initTFBuffers } from "./init-buffers_v2.js";
import { drawScene } from "./draw-scene_v2.js";
import { Node, Spring, createBlob, animateStep } from "./blob-components_v2.js";
import { setupAudio } from "./audio_v2.js";


const canvas = document.querySelector("#gl-canvas");

const latitudeBands = 30;
const longitudeBands = 30;
const radius = 1;
let k = 5.0;
let damping = 0.98;
let impulseStrength = 50.0;
let simulationRunning = false;
let animationFrameId;

let gl, buffers, programInfo, nodes, springs, tfBuffers;
let vaoIn, tfOut, vaoOut, tfIn;
let debugBuffers;
let blobInfo; 

main();


// event listeners for sliders and buttons 
function setEventListeners() {
  // Update values in real-time
  document.getElementById('stiffness-slider').addEventListener('input', (e) => {
    k = parseFloat(e.target.value);
    document.getElementById('stiffness-value').textContent = k.toFixed(1);
    blobInfo.k = k;
  });

  document.getElementById('damping-slider').addEventListener('input', (e) => {
    damping = parseFloat(e.target.value);
    document.getElementById('damping-value').textContent = damping.toFixed(3);
    blobInfo.damping = damping;
  });

  document.getElementById('impulse-slider').addEventListener('input', (e) => {
    impulseStrength = parseFloat(e.target.value);
    document.getElementById('impulse-value').textContent = impulseStrength.toFixed(1);
    blobInfo.impulseStrength = impulseStrength; 
  });

  // Attach event listeners to buttons
  // document.getElementById('start-button').addEventListener('click', () => {
  //   startSimulation(gl, buffers, programInfo, nodes, springs);
  // });

  // document.getElementById('stop-button').addEventListener('click', () => {
  //   stopSimulation();
  //   resetSimulation(gl, buffers, nodes, springs);
  // });
}

async function main() {
  const canvas = document.querySelector("#gl-canvas");
  gl = canvas.getContext("webgl2");
  if (gl == null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  setEventListeners();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const vsSource = await loadShaderSource("src/v2/shaders/vertex_v2.glsl");
  const fsSource = await loadShaderSource("src/v2/shaders/fragment_v2.glsl");
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  
  programInfo = {
    program: shaderProgram, 
    attribLocations: {
      nodePosition: gl.getAttribLocation(shaderProgram, "aNodePosition"),
      nodeColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
      nodeNormal: gl.getAttribLocation(shaderProgram, "aNodeNormal"),
      nodeVelocity: gl.getAttribLocation(shaderProgram, "aNodeVelocity"),
      nodeForce: gl.getAttribLocation(shaderProgram, "aNodeForce"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
      timeStep: gl.getUniformLocation(shaderProgram, "uTimeStep"),
      stiffness: gl.getUniformLocation(shaderProgram, "uStiffness"),
      damping: gl.getUniformLocation(shaderProgram, "uDamping"),
    },
  };



  buffers = initBuffers(gl, latitudeBands, longitudeBands, radius);
  tfBuffers = initTFBuffers(gl, buffers.originalPositions);

  vaoIn = tfBuffers.vao1;
  tfOut = tfBuffers.tf2;
  vaoOut = tfBuffers.vao2;
  tfIn = tfBuffers.tf1;

  ({nodes, springs} = createBlob(latitudeBands, longitudeBands, buffers.originalPositions, k));

  blobInfo = { nodes: nodes, 
    springs: springs, 
    normals: buffers.normals, 
    k: k, 
    damping: damping, 
    impulseStrength: impulseStrength
  };

  drawScene(gl, programInfo, buffers);
  
  setupAudio(blobInfo, buffers, gl, programInfo);
}

async function loadShaderSource(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load shader source from ${url}: ${response.statusText}`);
  }
  return response.text();
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.transformFeedbackVaryings(shaderProgram, ["newPosition", "newVelocity"], gl.SEPARATE_ATTRIBS);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // send the source to the shader object 
  gl.shaderSource(shader, source);

  // compile the shader program 
  gl.compileShader(shader);

  // see if it compiled successfully 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(`an error occured compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}