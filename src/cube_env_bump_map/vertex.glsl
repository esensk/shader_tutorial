attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 textureCoord;

uniform mat4 mMatrix;
uniform mat4 mvpMatrix;

varying vec3 vPosition;
varying vec4 vColor;
varying vec2 vTextureCoord;
varying vec3 tNormal;
varying vec3 tTangent;

void main(void) {
    vPosition = (mMatrix * vec4(position, 1.0)).xyz;
    vColor = color;
    vTextureCoord = textureCoord;
    tNormal = (mMatrix * vec4(normal, 0.0)).xyz;
    tTangent = cross(tNormal, vec3(0.0, 1.0, 0.0));
    gl_Position = mvpMatrix * vec4(position, 1.0);
}