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
  // position buffer 
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.enableVertexAttribArray(programInfo.attribLocations.nodePosition);
  gl.vertexAttribPointer(programInfo.attribLocations.nodePosition, 3, gl.FLOAT, false, 0, 0);
  // velocity buffer at 1 
  // color buffer 
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.enableVertexAttribArray(programInfo.attribLocations.nodeColor);
  gl.vertexAttribPointer(programInfo.attribLocations.nodeColor, 4, gl.FLOAT, false, 0, 0);
  // normal buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.enableVertexAttribArray(programInfo.attribLocations.nodeNormal);
  gl.vertexAttribPointer(programInfo.attribLocations.nodeNormal, 3, gl.FLOAT, false, 0, 0); 
  // index buffer 
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

  gl.uniform1f(programInfo.uniformLocations.timeStep, 0.016); // assuming ~60fps
  gl.uniform1f(programInfo.uniformLocations.stiffness, 1000.0);
  gl.uniform1f(programInfo.uniformLocations.damping, 0.8);
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

export { drawScene };