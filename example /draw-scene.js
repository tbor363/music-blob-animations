function drawScene(gl, programInfo, buffers, cubeRotation) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0); // clear everything 
  gl.enable(gl.DEPTH_TEST); // enable depth testing 
  gl.depthFunc(gl.LEQUAL); // near things obscure far things 

  // clear the canvas before we start drawing on it 
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // create a perspective matrix, a special matrix that is used to simulate the 
  // distortion of perspective in a camera 
  // our field of view is 45 degrees, with a width/height ration that matches the 
  // display size of the vancas and we only want to see obejcts between 0.1 units 
  // and 100 units away from the camera 
  const fieldOfView = (45 * Math.PI) / 180; // in radians 
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glMatrix always ahs the first argument as the destination to which to 
  // receive the result
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // set the drawing position to the 'identity' point, which is the center of the scene 
  const modelViewMatrix = mat4.create();

  // now moce the drawing position a bit to where we want to start drawing the square 
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]); // amount to translate 
  mat4.rotate(
  modelViewMatrix, // destination matrix
  modelViewMatrix, // matrix to rotate
  cubeRotation, // amount to rotate in radians
  [0, 0, 1],
  ); // axis to rotate around (Z)
  mat4.rotate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to rotate
    cubeRotation * 0.7, // amount to rotate in radians
    [0, 1, 0],
  ); // axis to rotate around (Y)
  mat4.rotate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to rotate
    cubeRotation * 0.3, // amount to rotate in radians
    [1, 0, 0],
  ); // axis to rotate around (X)

  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);


  // tell WebGL how to pull out the positions from the positionBuffer into the
  // vertexPosition attribute
  setPositionAttribute(gl, buffers, programInfo);
  setColorAttribute(gl, buffers, programInfo);

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  setNormalAttribute(gl, buffers, programInfo);

  // tell WebGL to use our program when drawing 
  gl.useProgram(programInfo.program);

  // set the shader uniforms 
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);


  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

}


// tell WebGL how to pull out the positions from the positionBuffer into the
// vertexPosition attribute
function setPositionAttribute(gl, buffers, programInfo) {
  const numComponents = 3; // pull out 2 values per iteration 
  const type = gl.FLOAT; // the data in the buffer is 32bit floats 
  const normalize = false; // don't normalize 
  const stride = 0; // how many bytes to get from one set of values to the next 
  const offset = 0; // how many bytes inside the buffer to start from 
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    numComponents,
    type, 
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

// Tell WebGL how to pull out the colors from the color buffer
// into the vertexColor attribute.
function setColorAttribute(gl, buffers, programInfo) {
  const numComponents = 4;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    numComponents,
    type,
    normalize,
    stride,
    offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

// Tell WebGL how to pull out the normals from
// the normal buffer into the vertexNormal attribute.
function setNormalAttribute(gl, buffers, programInfo) {
  const numComponents = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexNormal,
    numComponents,
    type,
    normalize,
    stride,
    offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
}


export { drawScene };