import { mat4, vec3 } from 'gl-matrix';

function drawScene(gl, programInfo, buffers) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);

  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  // Set up the vertex positions
  setPositionAttribute(gl, buffers, programInfo);
  setColorAttribute(gl, buffers, programInfo);
  setNormalAttribute(gl, buffers, programInfo);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

  {
    gl.drawElements(
      gl.TRIANGLES,
      buffers.indicesCount,
      gl.UNSIGNED_SHORT,
      0
    );
  }

  return {modelViewMatrix, projectionMatrix, normalMatrix};
}

function setPositionAttribute(gl, buffers, programInfo) {
  const numComponents = 3; // x, y, z
  const type = gl.FLOAT;
  const normalize = false;
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

function setColorAttribute(gl, buffers, programInfo) {
  const numComponents = 4; // r, g, b, a
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0; // how many bytes to get from one set of values to the next
  const offset = 0; // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

function setNormalAttribute(gl, buffers, programInfo) {
  const numComponents = 3; // x, y, z
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0; // how many bytes to get from one set of values to the next
  const offset = 0; // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexNormal,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
}

function drawNormals(gl, debugBuffers, programInfo, modelViewMatrix, projectionMatrix) {
  gl.useProgram(programInfo.program);

  const positionAttrib = programInfo.attribLocations.vertexPosition;

  gl.bindBuffer(gl.ARRAY_BUFFER, debugBuffers.normalLines);
  gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionAttrib);

  gl.disableVertexAttribArray(programInfo.attribLocations.vertexNormal);
  gl.disableVertexAttribArray(programInfo.attribLocations.vertexColor);

  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

  gl.drawArrays(gl.LINES, 0, debugBuffers.lineCount);
}

export { drawScene, drawNormals };