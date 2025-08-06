function initBuffers(gl, latitudeBands = 30, longitudeBands = 30, radius = 1) {
  const { position: positionBuffer, indices: indexBuffer, vertexCount: count, indicesCount: iCount, color: colorBuffer, normal: normalBuffer, originalPositions: positions, originalIndices: indices, normals: normals} = initAllBuffers(gl, latitudeBands, longitudeBands, radius);

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer, 
    vertexCount: count,
    indicesCount: iCount,
    normal: normalBuffer,
    originalPositions: positions,
    originalIndices: indices,
    normals: normals,
  };
}

function initAllBuffers(gl, latitudeBands, longitudeBands, radius) {
  const positionBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  const colorBuffer = gl.createBuffer();
  const normalBuffer = gl.createBuffer();

  const positions = []; 
  const indices = [];
  const colors = [];
  const normals = [];

  for (let lat = 0; lat <= latitudeBands; lat++) {
    const theta = lat * Math.PI / latitudeBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= longitudeBands; lon++) {
      const phi = lon * 2 * Math.PI / longitudeBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = radius * sinTheta * cosPhi;
      const y = radius * cosTheta;
      const z = radius * sinTheta * sinPhi;

      positions.push(x, y, z);

      if (lat < latitudeBands && lon < longitudeBands) {
        const first = (lat * (longitudeBands + 1)) + lon;
        const second = first + longitudeBands + 1;

        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }

      // Normalized y to [0, 1]
      const t = (y + radius) / (2 * radius);

      // gradient from blue (bottom) to green (top)
      const r = 0.5 * (1 - t);
      const g = t;
      const b = 1.0 - t;

      colors.push(r, g, b, 1.0);  // Full alpha

      // Normals
      const normal = [x / radius, y / radius, z / radius];
      normals.push(...normal);
    }
  }

  console.log("Positions:", positions.length, "Indices:", indices.length, "Colors:", colors.length, "Normals:", normals.length, "nodes:");


  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    indices: indexBuffer,
    vertexCount: positions.length / 3,
    indicesCount: indices.length,
    color: colorBuffer,
    normal: normalBuffer,
    originalPositions: positions,
    originalIndices: indices,
    normals: normals,
  };
}

function initDebugBuffers(gl) {
  const debugNormalBuffer = gl.createBuffer();
  return {
    normalLines: debugNormalBuffer,
    lineCount: 0,
  };
}

function initTFBuffers(gl, positions) {
  const numVertices = positions.length / 3;
  const velocities = new Float32Array(numVertices * 3).fill(0); // init to 0 

  // position 
  const position1 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, position1);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_COPY);

  const position2 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, position2);
  gl.bufferData(gl.ARRAY_BUFFER, positions.length * 4, gl.DYNAMIC_COPY);

  // velocity 
  const velocity1 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, velocity1);
  gl.bufferData(gl.ARRAY_BUFFER, velocities, gl.DYNAMIC_COPY);

  const velocity2 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, velocity2);
  gl.bufferData(gl.ARRAY_BUFFER, velocities.length * 4, gl.DYNAMIC_COPY);

  // VAOs 
  const vao1 = gl.createVertexArray();
  gl.bindVertexArray(vao1);
  gl.bindBuffer(gl.ARRAY_BUFFER, position1);
  gl.enableVertexAttribArray(0); // aNodePosition
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, velocity1);
  gl.enableVertexAttribArray(1); // aNodeVelocity
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

  const vao2 = gl.createVertexArray();
  gl.bindVertexArray(vao2);
  gl.bindBuffer(gl.ARRAY_BUFFER, position2);
  gl.enableVertexAttribArray(0); // aNodePosition
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, velocity2);
  gl.enableVertexAttribArray(1); // aNodeVelocity
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

  // transform feedback objects 
  const tf1 = gl.createTransformFeedback();
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf1);
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, position2);
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, velocity2);

  const tf2 = gl.createTransformFeedback();
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf2);
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, position1);
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, velocity1);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

  return {
    vao1, vao2,
    tf1, tf2,
    position1, position2,
    velocity1, velocity2,
    vertexCount: numVertices,
  };
}


export { initBuffers, initTFBuffers };