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

const elmTransparency = document.getElementById("transparency") as HTMLInputElement
const elmAdd = document.getElementById("add") as HTMLInputElement
const elmRange = document.getElementById("range") as HTMLInputElement

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
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    1.0, 1.0
]

const index: number[] = [
    0, 1, 2,
    3, 2, 1,
]

util.setVboAttribute(gl, program, position, "position", 3)
util.setVboAttribute(gl, program, color, "color", 4)
util.setVboAttribute(gl, program, textureCoord, "textureCoord", 2)
util.bindIbo(gl, index)

let texture: WebGLTexture = null
create_texture("../../src/texture/texture0.png")

const uniLocation = util.UniformLocations(gl, program, "mvpMatrix", "vertexAlpha", "texture", "useTexture")

const mat = new matIV()
const mMatrix = mat.identity(mat.create())
const vMatrix = mat.identity(mat.create())
const pMatrix = mat.identity(mat.create())
const tmpMatrix = mat.identity(mat.create())
const mvpMatrix = mat.identity(mat.create())

mat.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix)
mat.perspective(45, canvas.width / canvas.height, 0.1, 100, pMatrix)
mat.multiply(pMatrix, vMatrix, tmpMatrix)

gl.enable(gl.DEPTH_TEST)
gl.depthFunc(gl.LEQUAL)

gl.activeTexture(gl.TEXTURE0)

let count: number = 0;
const func = () => {
    if (elmTransparency.checked) {
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    }

    if (elmAdd.checked) {
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
    }

    const vertexAlpha: number = parseFloat(elmRange.value) / 100

    gl.clearColor(0.0, 0.75, 0.75, 1.0)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    count++
    const rad = (count % 360) * Math.PI / 180

    mat.identity(mMatrix)
    mat.translate(mMatrix, [0.25, 0.25, -0.25], mMatrix)
    mat.rotate(mMatrix, rad, [0, 1, 0], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.disable(gl.BLEND)

    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix)
    gl.uniform1f(uniLocation[1], 1.0)
    gl.uniform1i(uniLocation[2], 0)
    gl.uniform1i(uniLocation[3], 1)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

    mat.identity(mMatrix)
    mat.translate(mMatrix, [-0.25, -0.25, 0.25], mMatrix)
    mat.rotate(mMatrix, rad, [0, 0, 1], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)

    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.enable(gl.BLEND)

    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix)
    gl.uniform1f(uniLocation[1], vertexAlpha)
    gl.uniform1i(uniLocation[2], 0)
    gl.uniform1i(uniLocation[3], 0)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

    gl.flush()

    setTimeout(func, 1000 / 30);
}

func()

function create_texture(source: string) {
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

        texture = tex
        gl.bindTexture(gl.TEXTURE_2D, null)
    }
    img.src = source
}
