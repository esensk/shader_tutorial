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

const torusData: number[][] = torus(32, 32, 1.0, 2.0)
const position: number[] = torusData[0]
const normal: number[] = torusData[1]
const color: number[] = torusData[2]
const index: number[] = torusData[3]

util.setVboAttribute(gl, program, position, "position", 3)
util.setVboAttribute(gl, program, normal, "normal", 3)
util.setVboAttribute(gl, program, color, "color", 4)

util.bindIbo(gl, index)

const uniLocation: WebGLUniformLocation[] = [
    gl.getUniformLocation(program, "mvpMatrix"),
    gl.getUniformLocation(program, "invMatrix"),
    gl.getUniformLocation(program, "lightDirection"),
    gl.getUniformLocation(program, "eyeDirection"),
    gl.getUniformLocation(program, "ambientColor")
]

const mat = new matIV()
const mMatrix = mat.identity(mat.create())
const vMatrix = mat.identity(mat.create())
const pMatrix = mat.identity(mat.create())
const invMatrix = mat.identity(mat.create())
const tmpMatrix = mat.identity(mat.create())
const mvpMatrix = mat.identity(mat.create())

mat.lookAt([0.0, 0.0, 20.0], [0, 0, 0], [0, 1, 0], vMatrix)
mat.perspective(45, canvas.width / canvas.height, 0.1, 100, pMatrix)
mat.multiply(pMatrix, vMatrix, tmpMatrix)

const lightDirection: number[] = [-0.5, 0.5, 0.5]
const eyeDirection: number[] = [0.0, 0.0, 20.0]
const ambientColor: number[] = [0.1, 0.1, 0.1, 0.1]

let count: number = 0

gl.enable(gl.DEPTH_TEST)
gl.depthFunc(gl.LEQUAL)
gl.enable(gl.CULL_FACE)

const func = function () {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    count++

    const rad: number = (count % 360) * Math.PI / 180

    mat.identity(mMatrix);
    mat.rotate(mMatrix, rad, [0, 1, 1], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)

    mat.inverse(mMatrix, invMatrix)

    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation[1], false, invMatrix)
    gl.uniform3fv(uniLocation[2], lightDirection)
    gl.uniform3fv(uniLocation[3], eyeDirection)
    gl.uniform4fv(uniLocation[4], ambientColor)

    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

    gl.flush()

    setTimeout(func, 1000 / 30)
}

func()

function torus(row: number, column: number, irad: number, orad: number): number[][] {
    let pos: number[] = new Array()
    let nor: number[] = new Array()
    let col: number[] = new Array()
    let idx: number[] = new Array()

    for (let i: number = 0; i <= row; i++) {
        const r: number = Math.PI * 2 / row * i;
        const rr: number = Math.cos(r)
        const ry: number = Math.sin(r)

        for (let ii: number = 0; ii <= column; ii++) {
            const tr: number = Math.PI * 2 / column * ii
            const tx: number = (rr * irad + orad) * Math.cos(tr)
            const ty: number = ry * irad
            const tz: number = (rr * irad + orad) * Math.sin(tr)
            const rx: number = rr * Math.cos(tr)
            const rz: number = rr * Math.sin(tr)
            pos.push(tx, ty, tz)
            nor.push(rx, ry, rz)
            const tc = hsva(360 / column * ii, 1, 1, 1)
            col.push(tc[0], tc[1], tc[2], tc[3])
        }
    }

    for (let i: number = 0; i < row; i++) {
        for (let ii: number = 0; ii < column; ii++) {
            const r: number = (column + 1) * i + ii
            idx.push(r, r + column + 1, r + 1)
            idx.push(r + column + 1, r + column + 2, r + 1)
        }
    }
    return [pos, nor, col, idx]
}

function hsva(hue: number, saturation: number, value: number, alpha: number): void | number[] {
    if (saturation > 1 || value > 1 || alpha > 1) {
        return
    }

    const th: number = hue % 360
    const i: number = Math.floor(th / 60)
    const f: number = th / 60 - i
    const m: number = value * (1 - saturation)
    const n: number = value * (1 - saturation * f)
    const k: number = value * (1 - saturation * (1 - f))

    let color: number[] = new Array()
    if (!(saturation > 0) && !(saturation < 0)) {
        color.push(value, value, value, alpha)
    } else {
        const r: number[] = new Array(value, n, m, m, k, value)
        const g: number[] = new Array(k, value, value, n, m, m)
        const b: number[] = new Array(m, m, k, value, value, n)
        color.push(r[i], g[i], b[i], alpha)
    }

    return color

}