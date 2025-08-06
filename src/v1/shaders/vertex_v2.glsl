attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute vec3 aVertexNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

varying lowp vec4 vColor;
// varying highp vec3 vLighting;
varying highp vec3 vNormal;
varying highp vec3 vPosition;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vColor = aVertexColor;
  vNormal = normalize((uNormalMatrix * vec4(aVertexNormal, 0.0)).xyz);
  vPosition = (uModelViewMatrix * aVertexPosition).xyz;
}