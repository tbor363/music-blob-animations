import { drawScene } from "./draw-scene.js";

function createBlob(latitudeBands, longitudeBands, positions, stiffness) {
  const nodes = createNodes(positions);
  const springs = createSprings(latitudeBands, longitudeBands, nodes, stiffness);

  return { nodes, springs };
}

function createNodes(positions) {
  let nodes = [];

  for (let i = 0; i < positions.length; i += 3) {
    nodes.push(new Node(positions[i], positions[i+1], positions[i+2]));
  }
  return nodes;
}

function createSprings(latitudeBands, longitudeBands, nodes, stiffness) {
  let springs = [];

    const index = (lat, lon) => lat * (longitudeBands + 1) + lon;

    for (let lat = 0; lat <= latitudeBands; lat++) {
        for (let lon = 0; lon <= longitudeBands; lon++) {
            if (lat < latitudeBands) {
                // Vertical spring
                springs.push(new Spring(nodes[index(lat, lon)], nodes[index(lat + 1, lon)], stiffness));
            }

            if (lon < longitudeBands) {
                // Horizontal spring
                springs.push(new Spring(nodes[index(lat, lon)], nodes[index(lat, lon + 1)], stiffness));
            }

            // Optional: Add diagonal springs for stability
            if (lat < latitudeBands && lon < longitudeBands) {
                springs.push(new Spring(nodes[index(lat, lon)], nodes[index(lat + 1, lon + 1)], stiffness));
                springs.push(new Spring(nodes[index(lat + 1, lon)], nodes[index(lat, lon + 1)], stiffness));
            }
        }
    }

    return springs;
}

class Node {
  constructor(x, y, z) {
    this.position = [x, y, z];
    this.velocity = [0, 0, 0];
    this.force = [0, 0, 0];
    this.mass = 1.0; 
    this.ogPosition = [x, y, z];
  }

  resetForce(){
    this.force = [0, 0, 0];
  }

  resetVelocity() {
    this.velocity = [0, 0, 0];
  }

  resetPosition() {
    this.position = [...this.ogPosition];
  } 

  resetNode() {
    this.resetForce();
    this.resetVelocity();
    this.resetPosition();
  }

  applyForce(fx, fy, fz) {
    this.force[0] += fx;
    this.force[1] += fy;
    this.force[2] += fz;
  }

  integrate(dt, mass, damping) {
    for (let d = 0; d < 3; d++) {
      this.velocity[d] += (this.force[d] / mass) * dt;
      this.position[d] += this.velocity[d] * dt;
      this.velocity[d] *= damping; // Apply damping
    }
    this.resetForce();
  }
}

class Spring {
  constructor(nodeA, nodeB, k = 1.5) {
    this.nodeA = nodeA;
    this.nodeB = nodeB;
    this.k = k;
    this.restLength = Spring.calculateRestLength(nodeA, nodeB);
    this.ogRestLength = this.restLength; 
  }

  static calculateRestLength(nodeA, nodeB) {
    const dx = nodeB.position[0] - nodeA.position[0];
    const dy = nodeB.position[1] - nodeA.position[1];
    const dz = nodeB.position[2] - nodeA.position[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  applyForce() {
    const dx = this.nodeB.position[0] - this.nodeA.position[0];
    const dy = this.nodeB.position[1] - this.nodeA.position[1];
    const dz = this.nodeB.position[2] - this.nodeA.position[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (distance === 0) return; 
    
    const forceMagnitude = this.k * (distance - this.restLength);
    
    const fx = (dx / distance) * forceMagnitude;
    const fy = (dy / distance) * forceMagnitude;
    const fz = (dz / distance) * forceMagnitude;

    this.nodeA.applyForce(fx, fy, fz);
    this.nodeB.applyForce(-fx, -fy, -fz);
  }

  resetSpring() {
    this.restLength = this.ogRestLength; // Reset to original rest length
    this.nodeA.resetNode();
    this.nodeB.resetNode();
  }
}

// function applyForce(nodes, forceVector, node) {
//   nodes[node].applyForce(forceVector[0], forceVector[1], forceVector[2]);
// }

function applyForce(nodes, springs, deltaTime, mass, damping, normals, impulseStrength, node) {
  // const node = Math.floor(Math.random() * nodes.length);
  
  // Apply spring forces
  for (let spring of springs) {
    spring.applyForce();
  }
  // apply a force 
  const normal = [normals[node * 3], normals[node * 3 + 1], normals[node * 3 + 2]];
  const forceVector = [normal[0] * impulseStrength, normal[1] * impulseStrength, normal[2] * impulseStrength];
  nodes[node].applyForce(forceVector[0], forceVector[1], forceVector[2]);
  // applyForce(nodes, forceVector, node); 

  // Integrate all nodes
  for (let node of nodes) {
      node.integrate(deltaTime, mass, damping);
  }
}

function animateStep(blobInfo, buffers, gl, programInfo, node, forceMag) {
  const dt = 0.016; // 60 FPS
  const mass = 1.0; // mass of each node
  applyForce(blobInfo.nodes, blobInfo.springs, dt, mass, blobInfo.damping, blobInfo.normals, forceMag, node);
  updatePositionBuffer(gl, buffers, blobInfo.nodes);
  const updatedNormals = updateNormals(gl, buffers, blobInfo.nodes);
  const {modelViewMatrix, projectionMatrix, normalMatrix} = drawScene(gl, programInfo, buffers);
  // updateNormalLines(gl, debugBuffers, blobInfo.nodes, updatedNormals);
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


export { Node, Spring, createBlob, animateStep };