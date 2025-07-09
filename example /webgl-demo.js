import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

let cubeRotation = 0.0;
let deltaTime = 0;

main();

function main() {
  const canvas = document.querySelector("#gl-canvas");
  // initialize the GL context 
  const gl = canvas.getContext("webgl");

  // only continue if WebGL is available and working 
  if (gl == null) {
    alert("unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  // set clear color to black, fully opaque 
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // clear the color buffer with specified clear color 
  gl.clear(gl.COLOR_BUFFER_BIT);


  // vertex shader program 
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    attribute vec3 aVertexNormal;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uNormalMatrix;

    varying lowp vec4 vColor;
    varying highp vec3 vLighting;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;

      // apply lighting effect 
      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(vec3(0.86, 0.8, 0.75));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;


  // fragment shader program 
  const fsSource = `
    precision mediump float;

    varying lowp vec4 vColor;
    varying highp vec3 vLighting;

    void main() {
      gl_FragColor = vColor * vec4(vLighting, 1.0);
    }
  `;

  // intialize a shader program; this is where all the lighting for the vertices 
  // and so forth is established 
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // collect all the infor needed to use the shader program 
  // look up which attribute our shader program is using for aVertexPosition 
  // and look up uniform locations 
  const programInfo = {
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

  // here's where we call the routine that builds all the object's we'll be drawing 
  const buffers = initBuffers(gl);

  let then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001; // convert to seconds
    deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, cubeRotation);
    cubeRotation += deltaTime;

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

// 
// intiialize a shader program so WebGL knows how to draw our data 
//
  function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    
    // create the shader program 
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    
    // if creating the shader program failed, alert 
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(`unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
      return null;
    }
    return shaderProgram;
  }

  // 
  // creates a shader of teh given type, uploads the sourrce and compiles it
  //
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