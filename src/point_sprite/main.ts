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

const gl = canvas.getContext("webgl") as WebGLRenderingContext
const program = util.createProgramWithShader(gl, vert, frag) as WebGLProgram

// Line
var position = [
    -1.0, -1.0, 0.0,
    1.0, -1.0, 0.0,
    -1.0, 1.0, 0.0,
    1.0, 1.0, 0.0
];

var color = [
    1.0, 1.0, 1.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0
];

util.setVboAttribute(gl, program, position, "position", 3)
util.setVboAttribute(gl, program, color, "color", 4)

// Point
const sphere = util.sphere(16, 16, 2.0, undefined)
util.setVboAttribute(gl, program, sphere.p, "position", 3)
util.setVboAttribute(gl, program, sphere.c, "color", 4)

const uniLocation = util.UniformLocations(
    gl, program,
    "mvpMatrix",
    "pointSize",
    "texture",
    "useTexture",
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

const pointSizeRange: number[] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)
console.log("point size range:" + pointSizeRange[0] + " to " + pointSizeRange[1])

let texture0: WebGLTexture = null
create_texture("../src/texture/texture4.png", 0)

let count: number = 0
const func = () => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    count++
    const rad = (count % 360) * Math.PI / 180

    const qMatrix = mat.identity(mat.create())
    qtn.toMatIV(qt, qMatrix)

    const camPos = [0.0, 5.0, 10.0]
    mat.lookAt(camPos, [0, 0, 0], [0, 1, 0], vMatrix)
    mat.multiply(vMatrix, qMatrix, vMatrix)
    mat.perspective(45, canvas.width / canvas.height, 0.1, 100, pMatrix)
    mat.multiply(pMatrix, vMatrix, tmpMatrix)

    var size = parseFloat(pointSize.value) / 10;

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture0)

    mat.identity(mMatrix);
    mat.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
    gl.uniform1f(uniLocation[1], size);
    gl.uniform1f(uniLocation[2], 0);
    gl.uniform1f(uniLocation[3], 1);
    gl.drawArrays(gl.POINTS, 0, sphere.p.length / 3);

    let lineOption: number = 0;
    if (lines.checked) {
        lineOption = gl.LINES;
    }
    if (lineStrip.checked) {
        lineOption = gl.LINE_STRIP;
    }
    if (lineLoop.checked) {
        lineOption = gl.LINE_LOOP;
    }

    // 線を描画
    mat.identity(mMatrix);
    mat.rotate(mMatrix, Math.PI / 2, [1, 0, 0], mMatrix);
    mat.scale(mMatrix, [3.0, 3.0, 1.0], mMatrix);
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
    gl.uniform1i(uniLocation[3], 0)
    gl.drawArrays(lineOption, 0, position.length / 3);

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
            default:
                break;
        }
    }
    img.src = source
}