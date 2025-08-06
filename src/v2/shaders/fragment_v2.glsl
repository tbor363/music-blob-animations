#version 300 es

precision mediump float; 

in vec4 vColor;
in vec3 newPosition;
in vec3 newNormal;
in vec3 newVelocity;

out vec4 fragColor; 

void main() {
  // apply lighting effect
  highp vec3 ambientLight = vec3(0.5, 0.5, 0.5);
  highp vec3 directionalLightColor = vec3(1, 1, 1);
  highp vec3 directionalVector = normalize(vec3(0.0, 0.25, 0.65));

  highp float directional = max(dot(normalize(newNormal), directionalVector), 0.0);
  highp vec3 lighting = ambientLight + (directionalLightColor * directional);

  fragColor = vec4(vColor.rgb * lighting, vColor.a);
}