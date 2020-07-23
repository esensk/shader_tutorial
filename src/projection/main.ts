import * as util from "../util"
import matIV from "../lib/minMatrix"
import qtnIV from "../lib/minMatrixb"
import vert from "./vert.glsl"
import frag from "./frag.glsl"

const canvasSize: CanvasSize = {
    width: 500,
    height: 300
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement
canvas.width = canvasSize.width
canvas.height = canvasSize.height

const useBlur = document.getElementById("blur") as HTMLInputElement
const range = document.getElementById("range") as HTMLInputElement
const pointSize = document.getElementById("point_size") as HTMLInputElement
const lines = document.getElementById("lines") as HTMLInputElement
const lineStrip = document.getElementById("line_strip") as HTMLInputElement
const lineLoop = document.getElementById("line_loop") as HTMLInputElement

const qtn = new qtnIV()
const qt = qtn.identity(qtn.create())

canvas.addEventListener("mousemove", e => {
    const w = canvas.width
    const h = canvas.height
    const wh = 1 / Math.sqrt(w * w + h * h)

    let x = e.clientX - canvas.offsetLeft - w * 0.5
    let y = e.clientY - canvas.offsetTop - h * 0.5
    let sqr = Math.sqrt(x * x + y * y)

    const r = sqr * 2.0 * Math.PI * wh
    if (sqr != 1) {
        sqr = 1 / sqr
        x *= sqr
        y *= sqr
    }

    qtn.rotate(r, [y, x, 0.0], qt)
})

const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext

const prg = util.createProgramWithShader(gl, vert, frag) as WebGLProgram
const uniLocation = util.UniformLocations(
    gl, prg,
    "mMatrix",
    "tMatrix",
    "mvpMatrix",
    "invMatrix",
    "lightPosition",
    "texture",
)

const torus = util.torus(64, 64, 1.0, 2.0, [1.0, 1.0, 1.0, 1.0])

const position = [
    -1.0, 0.0, -1.0,
    1.0, 0.0, -1.0,
    -1.0, 0.0, 1.0,
    1.0, 0.0, 1.0
];

const normal = [
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0
];

const color = [
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0
];

const index = [
    0, 1, 2,
    3, 2, 1
];

const mat = new matIV()
const mMatrix = mat.identity(mat.create())
const vMatrix = mat.identity(mat.create())
const pMatrix = mat.identity(mat.create())
const tmpMatrix = mat.identity(mat.create())
const mvpMatrix = mat.identity(mat.create())
const invMatrix = mat.identity(mat.create())
const tMatrix = mat.identity(mat.create())
const tvMatrix = mat.identity(mat.create())
const tpMatrix = mat.identity(mat.create())
const tvpMatrix = mat.identity(mat.create())

let texture: WebGLTexture = null
createTexture("../src/texture/chara.png")
gl.activeTexture(gl.TEXTURE0)

const lightPosition = [-10.0, 10.0, 10.0]
const lightUpDirection = [0.577, 0.577, -0.577]

gl.enable(gl.DEPTH_TEST)
gl.depthFunc(gl.LEQUAL)

let count: number = 0
const func = () => {
    gl.clearColor(0.0, 0.7, 0.7, 1.0)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    count++

    const eyePosition = new Array() as number[][]
    const camUpDirection = new Array() as number[][]
    qtn.toVecIII([0.0, 0.0, 70.0], qt, eyePosition)
    qtn.toVecIII([0.0, 1.0, 0.0], qt, camUpDirection)
    mat.lookAt(eyePosition, [0, 0, 0], camUpDirection, vMatrix)
    mat.perspective(45, canvas.width / canvas.height, 0.1, 150, pMatrix)
    mat.multiply(pMatrix, vMatrix, tmpMatrix)

    gl.bindTexture(gl.TEXTURE_2D, texture)

    tMatrix[0] = 0.5
    tMatrix[1] = 0.0
    tMatrix[2] = 0.0
    tMatrix[3] = 0.0
    tMatrix[4] = 0.0
    tMatrix[5] = -0.5
    tMatrix[6] = 0.0
    tMatrix[7] = 0.0
    tMatrix[8] = 0.0
    tMatrix[9] = 0.0
    tMatrix[10] = 1.0
    tMatrix[11] = 0.0
    tMatrix[12] = 0.5
    tMatrix[13] = 0.
    tMatrix[14] = 0.0
    tMatrix[15] = 1.0

    const r = parseFloat(range.value) / 5.0
    lightPosition[0] = -1.0 * r
    lightPosition[1] = 1.0 * r
    lightPosition[2] = 1.0 * r

    mat.lookAt(lightPosition, [0, 0, 0], lightUpDirection, tvMatrix)

    mat.perspective(90, 1.0, 0.1, 150, tpMatrix)

    mat.multiply(tMatrix, tpMatrix, tvpMatrix)
    mat.multiply(tvpMatrix, tvMatrix, tMatrix)

    // Torus
    util.setVboAttributePosition(gl, prg, torus.p)
    util.setVboAttributeNormal(gl, prg, torus.n)
    util.setVboAttributeColor(gl, prg, torus.c)
    util.bindIbo(gl, torus.i)

    for (let idx = 0; idx < 10; ++idx) {
        const trans = new Array()
        trans[0] = (idx % 5 - 2.0) * 7.0
        trans[1] = Math.floor(idx / 5) * 7.0 - 5.0
        trans[2] = (idx % 5 - 2.0) * 5.0
        const rad = ((count + idx * 36) % 360) * Math.PI / 180

        mat.identity(mMatrix);
        mat.translate(mMatrix, trans, mMatrix)
        mat.rotate(mMatrix, rad, [1.0, 1, 0], mMatrix);
        mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
        mat.inverse(mMatrix, invMatrix);
        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.uniformMatrix4fv(uniLocation[1], false, tMatrix);
        gl.uniformMatrix4fv(uniLocation[2], false, mvpMatrix)
        gl.uniformMatrix4fv(uniLocation[3], false, invMatrix)
        gl.uniform3fv(uniLocation[2], lightPosition);
        gl.uniform1i(uniLocation[5], 0)
        gl.drawElements(gl.TRIANGLES, torus.i.length, gl.UNSIGNED_SHORT, 0)
    }

    util.setVboAttributePosition(gl, prg, position)
    util.setVboAttributeNormal(gl, prg, normal)
    util.setVboAttributeColor(gl, prg, color)
    util.bindIbo(gl, index)

    mat.identity(mMatrix)
    mat.translate(mMatrix, [0.0, -10.0, 0.0], mMatrix)
    mat.scale(mMatrix, [20.0, 0.0, 20.0], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    mat.inverse(mMatrix, invMatrix)
    gl.uniformMatrix4fv(uniLocation[0], false, mMatrix)
    gl.uniformMatrix4fv(uniLocation[2], false, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation[3], false, invMatrix)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

    mat.identity(mMatrix)
    mat.translate(mMatrix, [0.0, 10.0, -20.0], mMatrix)
    mat.rotate(mMatrix, Math.PI / 2, [1, 0, 0], mMatrix)
    mat.scale(mMatrix, [20.0, 0.0, 20.0], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    mat.inverse(mMatrix, invMatrix)
    gl.uniformMatrix4fv(uniLocation[0], false, mMatrix)
    gl.uniformMatrix4fv(uniLocation[2], false, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation[3], false, invMatrix)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

    mat.identity(mMatrix)
    mat.translate(mMatrix, [20.0, 10.0, 0.0], mMatrix)
    mat.rotate(mMatrix, Math.PI / 2, [0, 0, 1], mMatrix)
    mat.scale(mMatrix, [20.0, 0.0, 20.0], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    mat.inverse(mMatrix, invMatrix)
    gl.uniformMatrix4fv(uniLocation[0], false, mMatrix)
    gl.uniformMatrix4fv(uniLocation[2], false, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation[3], false, invMatrix)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

    gl.flush()

    setTimeout(func, 1000 / 30)
}

func()

function createTexture(source: string) {
    const img = new Image() as HTMLImageElement
    img.onload = function () {
        const tex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        gl.generateMipmap(gl.TEXTURE_2D)

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        texture = tex
        gl.bindTexture(gl.TEXTURE_2D, null)
    }

    img.src = source
}
