import * as util from "../util"
import matIV from "../lib/minMatrix"
import qtnIV from "../lib/minMatrixb"
import vert from "./vertex.glsl"
import frag from "./fragment.glsl"
import bvert from "./blur_vertex.glsl"
import bfrag from "./blur_fragment.glsl"

const canvasSize: CanvasSize = {
    width: 500,
    height: 500
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement
canvas.width = canvasSize.width
canvas.height = canvasSize.height

const useBlur = document.getElementById("blur") as HTMLInputElement
const pointSize = document.getElementById("point_size") as HTMLInputElement
const lines = document.getElementById("lines") as HTMLInputElement
const lineStrip = document.getElementById("line_strip") as HTMLInputElement
const lineLoop = document.getElementById("line_loop") as HTMLInputElement

const qtn = new qtnIV()
const qt = qtn.identity(qtn.create())

// canvas.addEventListener("mousemove", e => {
//     const w = canvas.width
//     const h = canvas.height
//     const wh = 1 / Math.sqrt(w * w + h * h)

//     let x = e.clientX - canvas.offsetLeft - w * 0.5
//     let y = e.clientY - canvas.offsetTop - h * 0.5
//     let sqr = Math.sqrt(x * x + y * y)

//     const r = sqr * 2.0 * Math.PI * wh
//     if (sqr != 1) {
//         sqr = 1 / sqr
//         x *= sqr
//         y *= sqr
//     }

//     qtn.rotate(r, [y, x, 0.0], qt)
// })

const check = document.getElementById("check") as HTMLInputElement

const gl = canvas.getContext("webgl", { stencil: true }) as WebGLRenderingContext
const program = util.createProgramWithShader(gl, vert, frag) as WebGLProgram

// Shader for frame buffer
const earth = util.sphere(64, 64, 1.0, [1.0, 1.0, 1.0, 1.0])
const uniLocation = util.UniformLocations(
    gl, program,
    "mMatrix",
    "mvpMatrix",
    "invMatrix",
    "lightDirection",
    "useLight",
    "texture",
)

// Shader for blur filter
const blurPrg = util.createProgramWithShader(gl, bvert, bfrag) as WebGLProgram

var position = [
    -1.0, 1.0, 0.0,
    1.0, 1.0, 0.0,
    -1.0, -1.0, 0.0,
    1.0, -1.0, 0.0
];

var color = [
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0
];

var index = [
    0, 1, 2,
    3, 2, 1
];

const blurUniLocation = util.UniformLocations(
    gl, blurPrg,
    "mvpMatrix",
    "texture",
    "useBlur",
    "canvasWidth",
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
create_texture("../src/texture/texture6.png", 0)
let texture1: WebGLTexture = null
create_texture("../src/texture/texture7.png", 1)
gl.activeTexture(gl.TEXTURE0)

const fbWidth: number = 500
const fbHeight: number = 500
const fb = util.createFrameBuffer(gl, fbWidth, fbHeight)

let count: number = 0
const func = () => {
    count++;
    const rad = (count % 360) * Math.PI / 180;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb.f)

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(program)

    util.setVboAttributePosition(gl, program, earth.p)
    util.setVboAttributeNormal(gl, program, earth.n)
    util.setVboAttributeColor(gl, program, earth.c)
    util.setVboAttributeTextureCoord(gl, program, earth.t)
    util.bindIbo(gl, earth.i)

    let lightDirection: number[] = [-1.0, 2.0, 1.0]

    mat.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
    mat.perspective(45, fbWidth / fbHeight, 0.1, 100, pMatrix);
    mat.multiply(pMatrix, vMatrix, tmpMatrix);

    gl.bindTexture(gl.TEXTURE_2D, texture1);
    mat.identity(mMatrix);
    mat.scale(mMatrix, [50.0, 50.0, 50.0], mMatrix);
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
    mat.inverse(mMatrix, invMatrix);
    gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
    gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
    gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
    gl.uniform3fv(uniLocation[3], lightDirection);
    gl.uniform1i(uniLocation[4], 0);
    gl.uniform1i(uniLocation[5], 0);
    gl.drawElements(gl.TRIANGLES, earth.i.length, gl.UNSIGNED_SHORT, 0);

    gl.bindTexture(gl.TEXTURE_2D, texture0);
    mat.identity(mMatrix);
    mat.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
    mat.inverse(mMatrix, invMatrix);
    gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
    gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
    gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
    gl.uniform1i(uniLocation[4], 1);
    gl.drawElements(gl.TRIANGLES, earth.i.length, gl.UNSIGNED_SHORT, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(blurPrg)

    util.setVboAttributePosition(gl, blurPrg, position)
    util.setVboAttributeColor(gl, blurPrg, color)
    util.bindIbo(gl, index)

    gl.bindTexture(gl.TEXTURE_2D, fb.t)

    mat.lookAt([0.0, 0.0, 0.5], [0, 0, 0], [0, 1, 0], vMatrix);
    mat.ortho(-1.0, 1.0, 1.0, -1.0, 0.1, 1, pMatrix)
    mat.multiply(pMatrix, vMatrix, tmpMatrix);

    mat.identity(mMatrix);
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(blurUniLocation[0], false, mMatrix);
    gl.uniform1i(blurUniLocation[1], 0);
    gl.uniform1i(blurUniLocation[2], useBlur.checked ? 1 : 0);
    gl.uniform1i(blurUniLocation[3], canvas.width)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

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