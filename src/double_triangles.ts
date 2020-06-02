/*
import frag from "./shader.frag";
import vert from "./shader.vert";
import * as util from "./util";
import matIV from "./lib/minMatrix";

const canvasSize: CanvasSize = {
    width: 500,
    height: 500
};

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = canvasSize.width;
canvas.height = canvasSize.height;

const gl = canvas.getContext("webgl") as WebGLRenderingContext;
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clearDepth(1.0);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

const vertShader = createShader(ShaderType.vertex, vert) as WebGLShader;
const fragShader = createShader(ShaderType.fragment, frag) as WebGLShader;
const program = createProgram(vertShader, fragShader) as WebGLProgram;

const attLocation: GLint[] = [gl.getAttribLocation(program, "position"), gl.getAttribLocation(program, "color")];
const attStride: number[] = [3, 4];

const vertexPosition: number[] = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0];
const positionVbo: WebGLBuffer = createVbo(vertexPosition);
setAttribute(positionVbo, attLocation[0], attStride[0]);

const vertexColor: number[] = [1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0];
const colorVbo: WebGLBuffer = createVbo(vertexColor);
setAttribute(colorVbo, attLocation[1], attStride[1]);

const mat = new matIV();
const mMatrix = mat.identity(mat.create());
const vMatrix = mat.identity(mat.create());
const pMatrix = mat.identity(mat.create());
const tmpMatrix = mat.identity(mat.create());
const mvpMatrix = mat.identity(mat.create());

mat.lookAt([0.0, 0.0, 3.0], [0, 0, 0], [0, 1, 0], vMatrix);
mat.perspective(90, canvas.width / canvas.height, 0.1, 100, pMatrix);
mat.multiply(pMatrix, vMatrix, tmpMatrix);

mat.translate(mMatrix, [1.5, 0.0, 0.0], mMatrix);
mat.multiply(tmpMatrix, mMatrix, mvpMatrix);

const uniLocation: WebGLUniformLocation = gl.getUniformLocation(program, "mvpMatrix");
gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
gl.drawArrays(gl.TRIANGLES, 0, 3);

mat.identity(mMatrix);
mat.translate(mMatrix, [-1.5, 0.0, 0.0], mMatrix);
mat.multiply(tmpMatrix, mMatrix, mvpMatrix);

gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);
gl.drawArrays(gl.TRIANGLES, 0, 3);

gl.flush();
*/
