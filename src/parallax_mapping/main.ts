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

const range = document.getElementById("range") as HTMLInputElement
const useBlur = document.getElementById("blur") as HTMLInputElement
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

const gl = canvas.getContext("webgl", { stencil: true }) as WebGLRenderingContext
const program = util.createProgramWithShader(gl, vert, frag) as WebGLProgram

const sphere = util.sphere(64, 64, 1.0, undefined)
util.setVboAttributePosition(gl, program, sphere.p)
util.setVboAttributeColor(gl, program, sphere.c)
util.setVboAttributeTextureCoord(gl, program, sphere.t)
util.setVboAttributeNormal(gl, program, sphere.n)
util.bindIbo(gl, sphere.i)

const uniLocation = util.UniformLocations(
    gl, program,
    "mMatrix",
    "mvpMatrix",
    "invMatrix",
    "lightPosition",
    "eyePosition",
    "normalMapTex",
    "heightMapTex",
    "height",
)

const mat = new matIV()
const mMatrix = mat.identity(mat.create())
const vMatrix = mat.identity(mat.create())
const pMatrix = mat.identity(mat.create())
const tmpMatrix = mat.identity(mat.create())
const mvpMatrix = mat.identity(mat.create())
const invMatrix = mat.identity(mat.create())

gl.enable(gl.DEPTH_TEST)
gl.depthFunc(gl.LEQUAL)

let texture0: WebGLTexture = null
create_texture("../src/texture/texture8.png", 0)
let texture1: WebGLTexture = null
create_texture("../src/texture/texture9.png", 1)

const lightPosition = [-10.0, 10.0, 10.0]
const eyePosition = [0.0, 0.0, 5.0]

let count: number = 0
const func = () => {
    count++;
    const rad = (count % 360) * Math.PI / 180;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const camUp = new Array()
    qtn.toVecIII([0.0, 0.0, 5.0], qt, eyePosition)
    qtn.toVecIII([0.0, 1.0, 0.0], qt, camUp)
    mat.lookAt(eyePosition, [0, 0, 0], camUp, vMatrix);
    mat.perspective(45, canvas.width / canvas.height, 0.1, 100, pMatrix)
    mat.multiply(pMatrix, vMatrix, tmpMatrix);

    const hScale = parseFloat(range.value) / 10000

    mat.identity(mMatrix)
    mat.rotate(mMatrix, -rad, [0, 1, 0], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    mat.inverse(mMatrix, invMatrix)
    gl.uniformMatrix4fv(uniLocation[0], false, mMatrix)
    gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation[2], false, invMatrix)
    gl.uniform3fv(uniLocation[3], lightPosition)
    gl.uniform3fv(uniLocation[4], eyePosition)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture0)
    gl.uniform1i(uniLocation[5], 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, texture1)
    gl.uniform1i(uniLocation[6], 1)

    gl.uniform1f(uniLocation[7], hScale)
    gl.drawElements(gl.TRIANGLES, sphere.i.length, gl.UNSIGNED_SHORT, 0)

    gl.flush();

    setTimeout(func, 1000 / 30);
}

func()

function create_texture(source: string, number: number) {
    const img: HTMLImageElement = new Image()
    img.onload = function () {
        const tex: WebGLTexture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        gl.generateMipmap(gl.TEXTURE_2D)

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        switch (number) {
            case 0:
                texture0 = tex
                break
            case 1:
                texture1 = tex
                break
            default:
                break
        }

        gl.bindTexture(gl.TEXTURE_2D, null)
    }
    img.src = source
}