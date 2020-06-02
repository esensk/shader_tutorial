import frag from "./shader.frag";
import vert from "./shader.vert";
import * as util from "./util";
import matIV from "./lib/minMatrix";

const canvasSize: CanvasSize = {
    width: 500,
    height: 500
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement
canvas.width = canvasSize.width
canvas.height = canvasSize.height

const gl = canvas.getContext("webgl") as WebGLRenderingContext
const program = util.createProgram(gl) as WebGLProgram

const attLocation: GLint[] = [gl.getAttribLocation(program, "position"), gl.getAttribLocation(program, "color")]
const attStride: number[] = [3, 4]

const vertexPosition: number[] = [
    0.0, 1.0, 0.0,
    1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    0.0, -1.0, 0.0
]
const positionVbo: WebGLBuffer = util.createVbo(gl, vertexPosition)
util.setAttribute(gl, positionVbo, attLocation[0], attStride[0])

const vertexColor: number[] = [
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0
]
const colorVbo: WebGLBuffer = util.createVbo(gl, vertexColor)
util.setAttribute(gl, colorVbo, attLocation[1], attStride[1])

const index: number[] = [
    0, 1, 2,
    1, 2, 3
]
const ibo: WebGLBuffer = util.createIbo(gl, index)
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)

const uniLocation = gl.getUniformLocation(program, "mvpMatrix")

const mat = new matIV()
const mMatrix = mat.identity(mat.create())
const vMatrix = mat.identity(mat.create())
const pMatrix = mat.identity(mat.create())
const tmpMatrix = mat.identity(mat.create())
const mvpMatrix = mat.identity(mat.create())

mat.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix)
mat.perspective(45, canvas.width / canvas.height, 0.1, 100, pMatrix)
mat.multiply(pMatrix, vMatrix, tmpMatrix)

let count: number = 0
const culling: HTMLInputElement = <HTMLInputElement>document.getElementById("cull")
const frontFace: HTMLInputElement = <HTMLInputElement>document.getElementById("front")
const depth: HTMLInputElement = <HTMLInputElement>document.getElementById("depth")

const func = function () {
    if (culling.checked) {
        gl.enable(gl.CULL_FACE)
    } else {
        gl.disable(gl.CULL_FACE)
    }

    if (frontFace.checked) {
        gl.frontFace(gl.CCW)
    } else {
        gl.frontFace(gl.CW)
    }

    if (depth.checked) {
        gl.enable(gl.DEPTH_TEST)
    } else {
        gl.disable(gl.DEPTH_TEST)
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    count++

    const rad: number = (count % 360) * Math.PI / 180
    const x: number = Math.cos(rad) * 1.5
    const z: number = Math.sin(rad) * 1.5

    mat.identity(mMatrix);
    mat.translate(mMatrix, [x, 0.0, z], mMatrix)
    mat.rotate(mMatrix, rad, [1, 0, 0], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation, false, mvpMatrix)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

    mat.identity(mMatrix)
    mat.translate(mMatrix, [-x, 0.0, -z], mMatrix)
    mat.rotate(mMatrix, rad, [0, 1, 0], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation, false, mvpMatrix)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

    gl.flush()

    setTimeout(func, 1000 / 30)
}

gl.depthFunc(gl.LEQUAL)

func()