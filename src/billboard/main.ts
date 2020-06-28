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

const gl = canvas.getContext("webgl") as WebGLRenderingContext
const program = util.createProgramWithShader(gl, vert, frag) as WebGLProgram

const position: number[] = [
    -1.0, 1.0, 0.0,
    1.0, 1.0, 0.0,
    -1.0, -1.0, 0.0,
    1.0, -1.0, 0.0
];

const color: number[] = [
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0
];

const textureCoord: number[] = [
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    1.0, 1.0
];

const index: number[] = [
    0, 1, 2,
    3, 2, 1
];

util.setVboAttribute(gl, program, position, "position", 3)
util.setVboAttribute(gl, program, color, "color", 4)
util.setVboAttribute(gl, program, textureCoord, "textureCoord", 2)
util.bindIbo(gl, index)

const uniLocation = util.UniformLocations(
    gl, program,
    "mvpMatrix",
    "texture",
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
gl.enable(gl.BLEND)

gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE)

let texture0: WebGLTexture = null
create_texture("../src/texture/texture2.png", 0)
let texture1: WebGLTexture = null
create_texture("../src/texture/texture3.png", 1)

const func = () => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const qMatrix = mat.identity(mat.create())
    qtn.toMatIV(qt, qMatrix)

    const camPosition = [0.0, 5.0, 10.0]
    mat.lookAt(camPosition, [0, 0, 0], [0, 1, 0], vMatrix)
    mat.lookAt([0, 0, 0], camPosition, [0, 1, 0], invMatrix)

    mat.multiply(vMatrix, qMatrix, vMatrix)
    mat.multiply(invMatrix, qMatrix, invMatrix)

    mat.inverse(invMatrix, invMatrix)

    mat.perspective(45, canvas.width / canvas.height, 0.1, 100, pMatrix)
    mat.multiply(pMatrix, vMatrix, tmpMatrix)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, texture1)
    gl.uniform1i(uniLocation[1], 1)

    mat.identity(mMatrix)
    mat.rotate(mMatrix, Math.PI / 2, [1, 0, 0], mMatrix)
    mat.scale(mMatrix, [3.0, 3.0, 1.0], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture0)
    gl.uniform1i(uniLocation[1], 0)

    mat.identity(mMatrix)
    mat.translate(mMatrix, [0.0, 1.0, 0.0], mMatrix)
    if (check.checked) {
        mat.multiply(mMatrix, invMatrix, mMatrix)
    }
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

    gl.flush()

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
        gl.bindTexture(gl.TEXTURE2, null)

        switch (number) {
            case 0:
                texture0 = tex
                break;
            case 1:
                texture1 = tex
            default:
                break;
        }
    }
    img.src = source
}