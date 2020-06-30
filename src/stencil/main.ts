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

// Line
var position = [
    -1.0, -1.0, 0.0,
    1.0, -1.0, 0.0,
    -1.0, 1.0, 0.0,
    1.0, 1.0, 0.0
];

var normal = [
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0
];

var color = [
    1.0, 1.0, 1.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0
];

var textureCoord = [
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    1.0, 1.0
];

var index = [
    0, 1, 2,
    3, 2, 1
];

util.setVboAttribute(gl, program, position, "position", 3)
util.setVboAttribute(gl, program, normal, "normal", 3)
util.setVboAttribute(gl, program, color, "color", 4)
util.setVboAttribute(gl, program, textureCoord, "textureCoord", 2)
util.bindIbo(gl, index)

// // Point
// const sphere = util.sphere(16, 16, 2.0, undefined)
// util.setVboAttribute(gl, program, sphere.p, "position", 3)
// util.setVboAttribute(gl, program, sphere.c, "color", 4)

const uniLocation = util.UniformLocations(
    gl, program,
    "mvpMatrix",
    "invMatrix",
    "lightDirection",
    "texture",
)

const mat = new matIV()
const mMatrix = mat.identity(mat.create())
const vMatrix = mat.identity(mat.create())
const pMatrix = mat.identity(mat.create())
const tmpMatrix = mat.identity(mat.create())
const mvpMatrix = mat.identity(mat.create())
const invMatrix = mat.identity(mat.create())

const lightDirection: number[] = [1.0, 1.0, 1.0]

gl.enable(gl.DEPTH_TEST)
gl.depthFunc(gl.LEQUAL)

let texture0: WebGLTexture = null
create_texture("../src/texture/texture0.png", 0)

let count: number = 0
const func = () => {
    gl.clearColor(0.0, 0.7, 0.7, 1.0)
    gl.clearDepth(1.0)
    gl.clearStencil(0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT || gl.STENCIL_BUFFER_BIT)

    mat.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix)
    mat.perspective(45, canvas.width / canvas.height, 0.1, 100, pMatrix)
    const qMatrix = mat.identity(mat.create())
    qtn.toMatIV(qt, qMatrix)
    mat.multiply(vMatrix, qMatrix, vMatrix)
    mat.multiply(pMatrix, vMatrix, tmpMatrix)

    gl.activeTexture(gl.TEXTURE0)
    console.log(texture0 === null)
    gl.bindTexture(gl.TEXTURE_2D, texture0)
    gl.uniform1i(uniLocation[3], 0)

    gl.enable(gl.STENCIL_TEST)

    gl.stencilFunc(gl.ALWAYS, 1, ~0);
    gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);
    render([-0.25, 0.25, -0.5]);

    gl.stencilFunc(gl.ALWAYS, 0, ~0);
    gl.stencilOp(gl.KEEP, gl.INCR, gl.INCR);
    render([0.0, 0.0, 0.0]);

    gl.stencilFunc(gl.EQUAL, 2, ~0);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    render([0.25, -0.25, 0.5]);

    gl.disable(gl.STENCIL_TEST)

    gl.flush()

    setTimeout(func, 1000 / 30);

    function render(tr: number[]): void {
        mat.identity(mMatrix)
        mat.translate(mMatrix, tr, mMatrix)
        mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
        mat.inverse(mMatrix, invMatrix)

        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix)
        gl.uniformMatrix4fv(uniLocation[1], false, invMatrix)
        gl.uniform3fv(uniLocation[2], lightDirection)
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)
    }
}

func()

function create_texture(source: string, number: number) {
    const img: HTMLImageElement = new Image()
    img.onload = function () {
        const tex: WebGLTexture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        gl.generateMipmap(gl.TEXTURE_2D)
        gl.bindTexture(gl.TEXTURE_2D, null)

        switch (number) {
            case 0:
                texture0 = tex
                break;
            default:
                break;
        }
    }
    img.src = source
}