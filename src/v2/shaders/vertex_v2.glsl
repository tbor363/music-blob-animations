#version 300 es

precision highp float;

in vec3 aNodePosition;
in vec4 aVertexColor;
in vec3 aNodeNormal;
uniform vec3 aNodeOGPosition;

// spring and point info 
in vec3 aNodeVelocity;
in float aNodeForce;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;
uniform float uTimeStep;
uniform float uStiffness;
uniform float uDamping;

out vec4 vColor;
out vec3 newNormal;
out vec3 newPosition;
out vec3 newVelocity;

const float NODE_MASS = 1.0;

void main() {
  // apply spring movements
  vec3 springForce = vec3(1.0); // for now just 1 
  springForce = aNodeForce * uStiffness * (aNodeOGPosition - aNodePosition);
  vec3 totalForce = springForce + aNodeForce;
  newVelocity = (aNodeVelocity + (totalForce / NODE_MASS) * uTimeStep) * uDamping; 
  newPosition = aNodePosition + newVelocity * uTimeStep;
  // newPosition = (uProjectionMatrix * uModelViewMatrix * vec4(newPosition, 1.0)).xyz;

  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(newPosition, 1.0);
  vColor = aVertexColor;
  newNormal = normalize((uNormalMatrix * vec4(aNodeNormal, 0.0)).xyz);
  // vPosition = (uModelViewMatrix * newPosition).xyz;
}