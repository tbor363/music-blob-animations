import { initBuffers, initDebugBuffers } from "./init-buffers.js";
import { drawScene, drawNormals } from "./draw-scene.js";
import { Node, Spring, createBlob } from "./blob-components.js";


const canvas = document.querySelector("#gl-canvas");

const latitudeBands = 30;
const longitudeBands = 30;
const radius = 1;
let k = 5.0;
let damping = 0.98;
let impulseStrength = 50.0;
let simulationRunning = false;
let animationFrameId;
let pushFrames = 0; // Flag to control impulse application

let gl, buffers, programInfo, nodes, springs;
let debugBuffers;
main();

// Create sliders dynamically
document.body.insertAdjacentHTML('beforeend', `
  <div style="position: absolute; top: 20px; left: 20px; background: white; padding: 10px; border-radius: 5px;">
    <label>Stiffness (k): <input type="range" id="stiffness-slider" min="0.1" max="20" step="0.1" value="5.0"> <span id="stiffness-value">5.0</span></label><br>
    <label>Damping: <input type="range" id="damping-slider" min="0.90" max="1.00" step="0.001" value="0.98"> <span id="damping-value">0.98</span></label><br>
    <label>Impulse Strength: <input type="range" id="impulse-slider" min="10" max="500" step="1" value="50.0"> <span id="impulse-value">50.0</span></label><br>
    <button id="start-button">Start Simulation</button>
    <button id="stop-button">Stop Simulation</button>
  </div>
`);

// Update values in real-time
document.getElementById('stiffness-slider').addEventListener('input', (e) => {
  k = parseFloat(e.target.value);
  document.getElementById('stiffness-value').textContent = k.toFixed(1);
});

document.getElementById('damping-slider').addEventListener('input', (e) => {
  damping = parseFloat(e.target.value);
  document.getElementById('damping-value').textContent = damping.toFixed(3);
});

document.getElementById('impulse-slider').addEventListener('input', (e) => {
  impulseStrength = parseFloat(e.target.value);
  document.getElementById('impulse-value').textContent = impulseStrength.toFixed(1);
});


// // Interactive force application with mouse click
// canvas.addEventListener('click', () => {
//   pushFrames = 10; // Apply the impulse over 10 frames when clicked
// });

async function main() {
  const canvas = document.querySelector("#gl-canvas");
  gl = canvas.getContext("webgl");

  if (gl == null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const vsSource = await loadShaderSource("src/shaders/vertex.glsl");
  const fsSource = await loadShaderSource("src/shaders/fragment.glsl");
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  programInfo = {
    program: shaderProgram, 
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
      vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
    },
  };

  buffers = initBuffers(gl, latitudeBands, longitudeBands, radius);
  debugBuffers = initDebugBuffers(gl);

  // create the soft body blob 
  // console.log("origianl positions:", buffers.originalPositions);
  // console.log("buffers vertex count:", buffers.vertexCount);
  // console.log("buffers original positions length:", buffers.originalPositions.length);

  ({nodes, springs} = createBlob(latitudeBands, longitudeBands, buffers.originalPositions, k));


  drawScene(gl, programInfo, buffers);

  // Start the simulation
  // startSimulation(gl, buffers, programInfo, nodes, springs);
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

function applyTestForce(nodes, forceVector) {
  nodes[0].applyForce(forceVector[0], forceVector[1], forceVector[2]); 
}

function simulateStep(nodes, springs, deltaTime, mass, damping) {
  
  // Apply spring forces
  for (let spring of springs) {
      spring.applyForce();
  }

  // Apply a one-time test force (impulse)
  if (pushFrames > 0) {
      applyTestForce(nodes, [0, impulseStrength, 0]); // Strong downward push
      pushFrames--;
  }

  // Integrate all nodes
  for (let node of nodes) {
      node.integrate(deltaTime, mass, damping);
  }
}


function updatePositionBuffer(gl, buffers, nodes) {

  const updatePositions = [];

  for (let node of nodes) {
    updatePositions.push(...node.position);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  const positions = new Float32Array(updatePositions);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
  
}

function updateNormals(gl, buffers, nodes) {
  const vertexNormals = Array(nodes.length).fill().map(() => [0, 0, 0]);
  for (let i = 0; i < buffers.indicesCount; i += 3) {
    const ia = buffers.originalIndices[i];
    const ib = buffers.originalIndices[i + 1];
    const ic = buffers.originalIndices[i + 2];

    const a = nodes[ia].position;
    const b = nodes[ib].position;
    const c = nodes[ic].position;

    const e1 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const e2 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; 

    const no = [
      e1[1] * e2[2] - e1[2] * e2[1],
      e1[2] * e2[0] - e1[0] * e2[2],
      e1[0] * e2[1] - e1[1] * e2[0]
    ];

    // console.log("Triangle normal:", no);

    for (let d = 0; d < 3; d++) {
      vertexNormals[ia][d] += no[d];
      vertexNormals[ib][d] += no[d];
      vertexNormals[ic][d] += no[d];
    }
  }


  // Normalize
  const flatNormals = [];
  for (let i = 0; i < vertexNormals.length; i++) {
    const n = vertexNormals[i];
    const len = Math.sqrt(n[0]**2 + n[1]**2 + n[2]**2);
    if (len > 0) {
      flatNormals.push(n[0]/len, n[1]/len, n[2]/len);
    } else {
      flatNormals.push(0, 0, 0);
    }
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatNormals), gl.DYNAMIC_DRAW);

  return vertexNormals;
}




function startSimulation(gl, buffers, programInfo, nodes, springs) {
  if (simulationRunning) return;
  simulationRunning = true;

  const dt = 0.016; // 60 FPS
  const mass = 1.0; // mass of each node
  pushFrames = 10; // Apply the impulse over 10 frames
  console.log("Simulation started with parameters:", { k, damping, impulseStrength });

  console.log("buffers vertex count:", buffers.vertexCount);
  function step() {
    simulateStep(nodes, springs, dt, mass, damping);
    updatePositionBuffer(gl, buffers, nodes);
    const updatedNormals = updateNormals(gl, buffers, nodes);
    const {modelViewMatrix, projectionMatrix, normalMatrix} = drawScene(gl, programInfo, buffers);
    updateNormalLines(gl, debugBuffers, nodes, updatedNormals);
    drawNormals(gl, debugBuffers, programInfo, modelViewMatrix, projectionMatrix );

    if (simulationRunning) {
      animationFrameId = requestAnimationFrame(step);
    }
  }

  animationFrameId = requestAnimationFrame(step);
}

function stopSimulation() {
  simulationRunning = false;
  cancelAnimationFrame(animationFrameId);
  console.log("Simulation stopped.");
}

function resetSimulation(gl, buffers, nodes, springs) {
  for (let node of nodes) {
    node.resetNode();
  }
  for (let spring of springs) {
    spring.resetSpring();
  }
  updatePositionBuffer(gl, buffers, nodes);
  const updatedNormals = updateNormals(gl, buffers, nodes);
  drawScene(gl, programInfo, buffers);
  console.log("Simulation reset.");
}

// Attach event listeners to buttons
document.getElementById('start-button').addEventListener('click', () => {
  startSimulation(gl, buffers, programInfo, nodes, springs);
});

document.getElementById('stop-button').addEventListener('click', () => {
  stopSimulation();
  resetSimulation(gl, buffers, nodes, springs);
});

function updateNormalLines(gl, debugBuffers, nodes, normals, length = 1) {
  const lines = [];

  for (let i = 0; i < nodes.length; i++) {
    const p = nodes[i].position;
    const n = normals[i];

    lines.push(...p); // line start
    lines.push(p[0] + n[0] * length, p[1] + n[1] * length, p[2] + n[2] * length); // line end
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, debugBuffers.normalLines);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.DYNAMIC_DRAW);
  debugBuffers.lineCount = lines.length / 3;
}
