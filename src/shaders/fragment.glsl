varying lowp vec4 vColor;
varying highp vec3 vPosition;
varying highp vec3 vNormal;


void main() {
  // apply lighting effect
  highp vec3 ambientLight = vec3(0.5, 0.5, 0.5);
  highp vec3 directionalLightColor = vec3(1, 1, 1);
  highp vec3 directionalVector = normalize(vec3(0.0, 0.25, 0.65));

  highp float directional = max(dot(normalize(vNormal), directionalVector), 0.0);
  highp vec3 lighting = ambientLight + (directionalLightColor * directional);

  gl_FragColor = vec4(vColor.rgb * lighting, vColor.a);
}