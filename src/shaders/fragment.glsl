varying lowp vec4 vColor;
varying highp vec3 vLighting;

void main() {
  gl_FragColor = vColor;
  // apply lighting
  highp vec3 light = normalize(vec3(0.86, 0.8, 0.75));
  highp float dProd = max(dot(vLighting, light), 0.0);
  gl_FragColor.rgb *= dProd;
}