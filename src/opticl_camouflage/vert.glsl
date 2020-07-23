attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;

uniform mat4 mMatrix;
uniform mat4 tMatrix;
uniform mat4 mvpMatrix;

uniform float coefficient;

varying vec4 vTexCoord;
varying vec4 vColor;

void main(void) {
    vec3 pos = (mMatrix * vec4(position, 1.0)).xyz;
    vec3 nor = normalize((mMatrix * vec4(normal, 1.0)).xyz);

    vColor = color;
    vTexCoord = tMatrix * vec4(pos + nor * coefficient, 1.0);
    gl_Position = mvpMatrix * vec4(pos, 1.0);
}
