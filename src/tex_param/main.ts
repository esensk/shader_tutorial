import * as util from "../util"
import matIV from "../lib/minMatrix"
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

const position: number[] = [
    -1.0, 1.0, 0.0,
    1.0, 1.0, 0.0,
    -1.0, -1.0, 0.0,
    1.0, -1.0, 0.0,
]

const color: number[] = [
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
]

const textureCoord: number[] = [
    -0.75, -0.75,
    1.75, -0.75,
    -0.75, 1.75,
    1.75, 1.75
]

const index: number[] = [
    0, 1, 2,
    3, 2, 1,
]

util.setVboAttribute(gl, program, position, "position", 3)
util.setVboAttribute(gl, program, color, "color", 4)
util.setVboAttribute(gl, program, textureCoord, "textureCoord", 2)
util.bindIbo(gl, index)

let texture0: WebGLTexture = null
create_texture("../src/texture/texture0.png", 0)
let texture1: WebGLTexture = null
create_texture("../src/texture/texture1.png", 1)

const uniLocation = util.UniformLocations(gl, program, "mvpMatrix", "texture0", "texture1")

const mat = new matIV()
const mMatrix = mat.identity(mat.create())
const vMatrix = mat.identity(mat.create())
const pMatrix = mat.identity(mat.create())
const tmpMatrix = mat.identity(mat.create())
const mvpMatrix = mat.identity(mat.create())

mat.lookAt([0.0, 0.0, 12.0], [0, 0, 0], [0, 1, 0], vMatrix)
mat.perspective(45, canvas.width / canvas.height, 0.1, 100, pMatrix)
mat.multiply(pMatrix, vMatrix, tmpMatrix)

gl.enable(gl.DEPTH_TEST)
gl.depthFunc(gl.LEQUAL)

gl.activeTexture(gl.TEXTURE0)
gl.activeTexture(gl.TEXTURE1)

let count: number = 0;
const func = () => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    count++
    const rad = (count % 360) * Math.PI / 180

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture0)
    gl.uniform1i(uniLocation[1], 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, texture1)
    gl.uniform1i(uniLocation[2], 1)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    render([-6.25, 2.0, 0.0]);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    render([-3.75, 2.0, 0.0]);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    render([-1.25, 2.0, 0.0]);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    render([1.25, 2.0, 0.0]);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    render([3.75, 2.0, 0.0]);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    render([6.25, 2.0, 0.0]);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    render([-2.5, -2.0, 0.0]);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    render([0.0, -2.0, 0.0]);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    render([2.5, -2.0, 0.0]);

    gl.flush()

    setTimeout(func, 1000 / 30);

    function render(trans: number[]) {
        mat.identity(mMatrix)
        mat.translate(mMatrix, trans, mMatrix)
        mat.rotate(mMatrix, rad, [0, 1, 0], mMatrix)
        mat.multiply(tmpMatrix, mMatrix, mvpMatrix)

        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix)
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)
    }
}

func()

function create_texture(source: string, unit: number) {
    const img: HTMLImageElement = new Image()
    img.onload = function () {
        const tex: WebGLTexture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        gl.generateMipmap(gl.TEXTURE_2D)
        gl.bindTexture(gl.TEXTURE_2D, null)
        dispath_assign_unit(tex, unit)
    }
    img.src = source
}

function dispath_assign_unit(texture: WebGLTexture, unit: number) {
    switch (unit) {
        case 0:
            texture0 = texture
            break
        case 1:
            texture1 = texture
            break
    }
}
