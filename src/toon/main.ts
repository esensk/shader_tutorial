import * as util from "../util"
import matIV from "../lib/minMatrix"
import qtnIV from "../lib/minMatrixb"
import vert from "./vert.glsl"
import frag from "./frag.glsl"

const canvasSize: CanvasSize = {
    width: 500,
    height: 500
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

const check = document.getElementById("check") as HTMLInputElement

const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext

const prg = util.createProgramWithShader(gl, vert, frag) as WebGLProgram
const uniLocation = util.UniformLocations(
    gl, prg,
    "mMatrix",
    "invMatrix",
    "lightDirection",
    "texture",
    "edge",
    "edgeColor",
)

const sphere = util.sphere(64, 64, 1.5, undefined)
const torus = util.torus(64, 64, 0.5, 2.5, undefined)

const mat = new matIV()
const mMatrix = mat.identity(mat.create())
const vMatrix = mat.identity(mat.create())
const pMatrix = mat.identity(mat.create())
const tmpMatrix = mat.identity(mat.create())
const mvpMatrix = mat.identity(mat.create())
const invMatrix = mat.identity(mat.create())

let texture: WebGLTexture = null
createTexture("../src/texture/toon.png")
gl.activeTexture(gl.TEXTURE0)

const lightDirection = [-0.5, 0.5, 0.5]

gl.enable(gl.DEPTH_TEST)
gl.depthFunc(gl.LEQUAL)
gl.enable(gl.CULL_FACE)

let edgeColor = [0.0, 0.0, 0.0, 1.0]

let count: number = 0
const func = () => {
    gl.clearColor(0.0, 0.7, 0.7, 1.0)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    count++
    const rad = (count % 360) * Math.PI / 180

    gl.bindTexture(gl.TEXTURE_2D, texture)
    const eyePosition = new Array() as number[][]
    const camUpDirection = new Array() as number[][]
    qtn.toVecIII([0.0, 0.0, 10.0], qt, eyePosition)
    qtn.toVecIII([0.0, 1.0, 0.0], qt, camUpDirection)
    mat.lookAt(eyePosition, [0, 0, 0], camUpDirection, vMatrix)
    mat.perspective(45, canvas.width / canvas.height, 0.1, 100, pMatrix)
    mat.multiply(pMatrix, vMatrix, tmpMatrix)

    // Torus
    util.setVboAttributePosition(gl, prg, torus.p)
    util.setVboAttributeNormal(gl, prg, torus.n)
    util.setVboAttributeColor(gl, prg, torus.c)
    util.bindIbo(gl, torus.i)

    mat.identity(mMatrix);
    mat.rotate(mMatrix, rad, [0, 1, 1], mMatrix);
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
    mat.inverse(mMatrix, invMatrix);
    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
    gl.uniformMatrix4fv(uniLocation[1], false, invMatrix);
    gl.uniform3fv(uniLocation[2], lightDirection);
    gl.uniform1i(uniLocation[3], 0);

    // Render model
    gl.cullFace(gl.BACK);
    gl.uniform1i(uniLocation[4], 0);
    edgeColor = [0.0, 0.0, 0.0, 0.0];
    gl.uniform4fv(uniLocation[5], edgeColor);
    gl.drawElements(gl.TRIANGLES, torus.i.length, gl.UNSIGNED_SHORT, 0);

    // Render edge
    gl.cullFace(gl.FRONT);
    gl.uniform1i(uniLocation[4], 1);
    edgeColor = [0.0, 0.0, 0.0, 1.0];
    gl.uniform4fv(uniLocation[5], edgeColor);
    gl.drawElements(gl.TRIANGLES, torus.i.length, gl.UNSIGNED_SHORT, 0);

    // Sphere
    util.setVboAttributePosition(gl, prg, sphere.p)
    util.setVboAttributeNormal(gl, prg, sphere.n)
    util.setVboAttributeColor(gl, prg, sphere.c)
    util.bindIbo(gl, sphere.i)

    mat.identity(mMatrix);
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
    mat.inverse(mMatrix, invMatrix);
    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
    gl.uniformMatrix4fv(uniLocation[1], false, invMatrix);

    // Render model
    gl.cullFace(gl.BACK);
    gl.uniform1i(uniLocation[4], 0);
    edgeColor = [0.0, 0.0, 0.0, 0.0];
    gl.uniform4fv(uniLocation[5], edgeColor);
    gl.drawElements(gl.TRIANGLES, sphere.i.length, gl.UNSIGNED_SHORT, 0);

    // Render edge
    gl.cullFace(gl.FRONT);
    gl.uniform1i(uniLocation[4], 1);
    edgeColor = [0.0, 0.0, 0.0, 1.0];
    gl.uniform4fv(uniLocation[5], edgeColor);
    gl.drawElements(gl.TRIANGLES, sphere.i.length, gl.UNSIGNED_SHORT, 0);

    gl.flush();

    setTimeout(func, 1000 / 30);
}

func()

function createTexture(source) {
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