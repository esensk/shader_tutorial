import * as util from "../util"
import matIV from "../lib/minMatrix"
import qtnIV from "../lib/minMatrixb"
import vert from "./vertex.glsl"
import frag from "./fragment.glsl"

const canvasSize: CanvasSize = {
    width: 500,
    height: 500
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement
canvas.width = canvasSize.width
canvas.height = canvasSize.height

const gl = canvas.getContext("webgl") as WebGLRenderingContext
const program = util.createProgramWithShader(gl, vert, frag) as WebGLProgram

const torusData = util.torus(64, 64, 0.5, 1.5, undefined)

util.setVboAttribute(gl, program, torusData.p, "position", 3)
util.setVboAttribute(gl, program, torusData.n, "normal", 3)
util.setVboAttribute(gl, program, torusData.c, "color", 4)
util.bindIbo(gl, torusData.i)

const uniLocation = util.UniformLocations(
    gl, program,
    "mvpMatrix",
    "mMatrix",
    "invMatrix",
    "lightPosition",
    "eyeDirection",
    "ambientColor"
)

const mat = new matIV()
const mMatrix = mat.identity(mat.create())
const vMatrix = mat.identity(mat.create())
const pMatrix = mat.identity(mat.create())
const tmpMatrix = mat.identity(mat.create())
const mvpMatrix = mat.identity(mat.create())
const invMatrix = mat.identity(mat.create())

const q = new qtnIV()
const xQtn = q.identity(q.create())

const lightPosition = [15.0, 10.0, 15.0]
const ambientColor = [0.1, 0.1, 0.1, 1.0]
const camPosition = [0.0, 0.0, 10.0]
const camUpDirection = [0.0, 1.0, 0.0]

gl.enable(gl.DEPTH_TEST)
gl.depthFunc(gl.LEQUAL)
gl.enable(gl.CULL_FACE)

let count: number = 0;
const func = () => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    count++
    const rad = (count % 180) * Math.PI / 90
    const rad2 = (count % 720) * Math.PI / 360

    q.rotate(rad2, [1, 0, 0], xQtn)
    q.toVecIII([0.0, 0.0, 10.0], xQtn, camPosition)
    q.toVecIII([0.0, 1.0, 0.0], xQtn, camUpDirection)

    mat.lookAt(camPosition, [0, 0, 0], camUpDirection, vMatrix)
    mat.perspective(45, canvas.width / canvas.height, 0.1, 100, pMatrix)
    mat.multiply(pMatrix, vMatrix, tmpMatrix)

    mat.identity(mMatrix)
    mat.rotate(mMatrix, rad, [0, 1, 0], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    mat.inverse(mMatrix, invMatrix)

    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation[1], false, mMatrix)
    gl.uniformMatrix4fv(uniLocation[2], false, invMatrix)
    gl.uniform3fv(uniLocation[3], lightPosition)
    gl.uniform3fv(uniLocation[4], camPosition)
    gl.uniform4fv(uniLocation[5], ambientColor)

    gl.drawElements(gl.TRIANGLES, torusData.i.length, gl.UNSIGNED_SHORT, 0)

    gl.flush()

    setTimeout(func, 1000 / 30);
}

func()
