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

const torusData = torus(64, 64, 0.5, 1.5, [0.75, 0.25, 0.25, 1.0])
const sphereData = sphere(64, 64, 2.0, [0.25, 0.25, 0.75, 1.0])

const uniLocation: WebGLUniformLocation[] = [
    gl.getUniformLocation(program, "mvpMatrix"),
    gl.getUniformLocation(program, "mMatrix"),
    gl.getUniformLocation(program, "invMatrix"),
    gl.getUniformLocation(program, "lightPosition"),
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

const lightPosition: number[] = [0.0, 0.0, 0.0]
const eyeDirection: number[] = [0.0, 0.0, 20.0]
const ambientColor: number[] = [0.1, 0.1, 0.1, 0.1]

const torusVbos = [
    util.createVbo(gl, torusData.p),
    util.createVbo(gl, torusData.n),
    util.createVbo(gl, torusData.c),
]

const sphereVbos = [
    util.createVbo(gl, sphereData.p),
    util.createVbo(gl, sphereData.n),
    util.createVbo(gl, sphereData.c),
]

mat.lookAt(eyeDirection, [0, 0, 0], [0, 1, 0], vMatrix)
mat.perspective(45, canvas.width / canvas.height, 0.1, 100, pMatrix)
mat.multiply(pMatrix, vMatrix, tmpMatrix)

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
    const tx = Math.cos(rad) * 3.5
    const ty = Math.sin(rad) * 3.5
    const tz = Math.sin(rad) + 3.5

    util.setAttribute(gl, torusVbos[0], gl.getAttribLocation(program, "position"), 3)
    util.setAttribute(gl, torusVbos[1], gl.getAttribLocation(program, "normal"), 3)
    util.setAttribute(gl, torusVbos[2], gl.getAttribLocation(program, "color"), 4)
    util.bindIbo(gl, torusData.i)

    mat.identity(mMatrix)
    mat.translate(mMatrix, [tx, -ty, -tz], mMatrix)
    mat.rotate(mMatrix, -rad, [0, 1, 1], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    mat.inverse(mMatrix, invMatrix)

    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation[1], false, mMatrix)
    gl.uniformMatrix4fv(uniLocation[2], false, invMatrix)
    gl.uniform3fv(uniLocation[3], lightPosition)
    gl.uniform3fv(uniLocation[4], eyeDirection)
    gl.uniform4fv(uniLocation[5], ambientColor)
    gl.drawElements(gl.TRIANGLES, torusData.i.length, gl.UNSIGNED_SHORT, 0)

    util.setAttribute(gl, sphereVbos[0], gl.getAttribLocation(program, "position"), 3)
    util.setAttribute(gl, sphereVbos[1], gl.getAttribLocation(program, "normal"), 3)
    util.setAttribute(gl, sphereVbos[2], gl.getAttribLocation(program, "color"), 4)
    util.bindIbo(gl, sphereData.i)

    mat.identity(mMatrix)
    mat.translate(mMatrix, [-tx, ty, tz], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    mat.inverse(mMatrix, invMatrix)

    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation[1], false, mMatrix)
    gl.uniformMatrix4fv(uniLocation[2], false, invMatrix)
    gl.drawElements(gl.TRIANGLES, sphereData.i.length, gl.UNSIGNED_SHORT, 0)

    gl.flush()

    setTimeout(func, 1000 / 30)
}

func()

function sphere(row: number, column: number, rad: number, color: number[]): {
    p: number[],
    n: number[],
    c: number[],
    i: number[]
} {
    let pos: number[] = new Array()
    let nor: number[] = new Array()
    let col: number[] = new Array()
    let idx: number[] = new Array()

    for (let i = 0; i <= row; ++i) {
        const r: number = Math.PI / row * i
        const ry: number = Math.cos(r)
        const rr: number = Math.sin(r)

        for (let ii = 0; ii <= column; ++ii) {
            const tr: number = Math.PI * 2 / column * ii
            const tx: number = rr * rad * Math.cos(tr)
            const ty: number = ry * rad
            const tz: number = rr * rad * Math.sin(tr)
            const rx: number = rr * Math.cos(tr)
            const rz: number = rr * Math.sin(tr)

            let tc: number[] = new Array()
            if (color) {
                tc = color
            } else {
                tc = hsva(360 / row * i, 1, 1, 1)
            }

            pos.push(tx, ty, tz)
            nor.push(rx, ry, rz)
            col.push(tc[0], tc[1], tc[2], tc[3])
        }
    }

    let r: number = 0;
    for (let i = 0; i < row; ++i) {
        for (let ii = 0; ii < column; ++ii) {
            r = (column + 1) * i + ii
            idx.push(r, r + 1, r + column + 2)
            idx.push(r, r + column + 2, r + column + 1)
        }
    }

    return {
        p: pos,
        n: nor,
        c: col,
        i: idx
    }
}

function torus(row: number, column: number, irad: number, orad: number, color: number[]): {
    p: number[],
    n: number[],
    c: number[],
    i: number[]
} {
    let pos: number[] = new Array()
    let nor: number[] = new Array()
    let col: number[] = new Array()
    let idx: number[] = new Array()

    for (let i = 0; i <= row; ++i) {
        const r: number = Math.PI / row * i
        const ry: number = Math.cos(r)
        const rr: number = Math.sin(r)

        for (let ii = 0; ii <= column; ++ii) {
            const tr: number = Math.PI * 2 / column * ii
            const tx: number = (rr * irad + orad) * Math.cos(tr)
            const ty: number = ry * irad
            const tz: number = (rr * irad + orad) * Math.sin(tr)
            const rx: number = rr * Math.cos(tr)
            const rz: number = rr * Math.sin(tr)

            let tc: number[] = new Array()
            if (color) {
                tc = color
            } else {
                tc = hsva(360 / row * i, 1, 1, 1)
            }

            pos.push(tx, ty, tz)
            nor.push(rx, ry, rz)
            col.push(tc[0], tc[1], tc[2], tc[3])
        }
    }

    for (let i = 0; i < row; ++i) {
        for (let ii = 0; ii < column; ++ii) {
            const r: number = (column + 1) * i + ii
            idx.push(r, r + column + 1, r + 1)
            idx.push(r + column + 1, r + column + 2, r + 1)
        }
    }

    return {
        p: pos,
        n: nor,
        c: col,
        i: idx
    }
}

function hsva(h: number, s: number, v: number, a: number): number[] {
    if (s > 1 || v > 1 || a > 1) {
        return
    }

    const th: number = h % 360
    const i: number = Math.floor(th / 60)
    const f: number = th / 60 - i
    const m: number = v * (1 - s)
    const n: number = v * (1 - s * f)
    const k: number = v * (1 - s * (1 - f))

    let color: number[] = new Array()
    if (!(s > 0) && !(s < 0)) {
        color.push(v, v, v, a)
    } else {
        const r: number[] = new Array(v, n, m, m, k, v)
        const g: number[] = new Array(k, v, v, n, m, m)
        const b: number[] = new Array(m, m, k, v, v, n)
        color.push(r[i], g[i], b[i], a)
    }

    return color
}