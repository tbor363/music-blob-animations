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

export { Node, Spring, createBlob };