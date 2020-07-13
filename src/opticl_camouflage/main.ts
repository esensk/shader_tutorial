import * as util from "../util"
import matIV from "../lib/minMatrix"
import qtnIV from "../lib/minMatrixb"
import vert from "./vert.glsl"
import frag from "./frag.glsl"
import spcl_vert from "./spcl_vert.glsl"
import spcl_frag from "./spcl_frag.glsl"
import cm_vert from "./cubemap_vert.glsl"
import cm_frag from "./cubemap_frag.glsl"

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

const opPrg = util.createProgramWithShader(gl, vert, frag) as WebGLProgram
const opUniLocation = util.UniformLocations(
    gl, opPrg,
    "mMatrix",
    "tMatrix",
    "mvpMatrix",
    "coefficient",
    "texture",
)

const spclPrg = util.createProgramWithShader(gl, spcl_vert, spcl_frag) as WebGLProgram
const spclUnilocation = util.UniformLocations(
    gl, spclPrg,
    "mvpMatrix",
    "invMatrix",
    "lightDirection",
    "eyeDirection",
    "ambientColor",
)

const cmPrg = util.createProgramWithShader(gl, cm_vert, cm_frag) as WebGLProgram
const cmUnilocation = util.UniformLocations(
    gl, cmPrg,
    "mMatrix",
    "mvpMatrix",
    "eyePosition",
    "cubeTexture",
    "reflection",
)

const cube = util.cube(2.0, [1.0, 1.0, 1.0, 1.0])
const torus = util.torus(64, 64, 2.5, 5.0, [1.0, 1.0, 1.0, 1.0])

const mat = new matIV()
const mMatrix = mat.identity(mat.create())
const vMatrix = mat.identity(mat.create())
const pMatrix = mat.identity(mat.create())
const tMatrix = mat.identity(mat.create())
const tvpMatrix = mat.identity(mat.create())
const tmpMatrix = mat.identity(mat.create())
const mvpMatrix = mat.identity(mat.create())
const invMatrix = mat.identity(mat.create())


let cubeTexture: WebGLTexture = null
const cubeSource = new Array(
    "../src/texture/cube_PX.png",
    "../src/texture/cube_PY.png",
    "../src/texture/cube_PZ.png",
    "../src/texture/cube_NX.png",
    "../src/texture/cube_NY.png",
    "../src/texture/cube_NZ.png",
) as string[]

const cubeTarget = new Array(
    gl.TEXTURE_CUBE_MAP_POSITIVE_X,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
) as number[]

createCubeTexture(cubeSource, cubeTarget)

const lightDirection = [-0.577, 0.577, 0.577]

gl.enable(gl.DEPTH_TEST)
gl.depthFunc(gl.LEQUAL)

const fbWidth = 500
const fbHeight = 500
const fb = util.createFrameBuffer(gl, fbWidth, fbHeight)

let count: number = 0
const func = () => {
    count++
    const rad = (count % 360) * Math.PI / 180

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb.f)

    gl.clearColor(0.0, 0.7, 0.7, 1.0)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const eyePosition = new Array() as number[]
    const camUpDirection = new Array() as number[]
    qtn.toVecIII([0.0, 1.0, 0.0], qt, eyePosition)
    qtn.toVecIII([0.0, 1.0, 0.0], qt, camUpDirection)
    mat.lookAt(eyePosition, [0, 0, 0], camUpDirection, vMatrix)
    mat.perspective(90, canvas.width / canvas.height, 0.1, 200, pMatrix)
    mat.multiply(pMatrix, vMatrix, tmpMatrix)

    gl.useProgram(cmPrg)
    util.setVboAttributePosition(gl, cmPrg, cube.p)
    util.setVboAttributeNormal(gl, cmPrg, cube.n)
    util.setVboAttributeColor(gl, cmPrg, cube.c)
    util.bindIbo(gl, cube.i)
    mat.identity(mMatrix)
    mat.scale(mMatrix, [100, 100, 100], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    gl.uniformMatrix4fv(cmUnilocation[0], false, mMatrix)
    gl.uniformMatrix4fv(cmUnilocation[1], false, mvpMatrix)
    gl.uniform3fv(cmUnilocation[2], [0, 0, 0])
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture)
    gl.uniform1i(cmUnilocation[3], 0)
    gl.uniform1i(cmUnilocation[4], 0)
    gl.drawElements(gl.TRIANGLES, cube.i.length, gl.UNSIGNED_SHORT, 0)

    gl.useProgram(spclPrg)
    util.setVboAttributePosition(gl, spclPrg, torus.p)
    util.setVboAttributeNormal(gl, spclPrg, torus.n)
    util.setVboAttributeColor(gl, spclPrg, torus.c)
    util.bindIbo(gl, torus.i)
    for (let idx = 0; idx < 9; ++idx) {
        const amb = util.hsva(idx * 40, 1, 1, 1)
        mat.identity(mMatrix)
        mat.rotate(mMatrix, idx * 2 * Math.PI / 9, [0, 1, 0], mMatrix)
        mat.translate(mMatrix, [0.0, 0.0, 30.0], mMatrix)
        mat.rotate(mMatrix, rad, [1, 1, 0], mMatrix)
        mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
        mat.inverse(mMatrix, invMatrix)
        gl.uniformMatrix4fv(spclUnilocation[0], false, mMatrix)
        gl.uniformMatrix4fv(spclUnilocation[1], false, mvpMatrix)
        gl.uniform3fv(spclUnilocation[2], lightDirection)
        gl.uniform3fv(spclUnilocation[3], eyePosition)
        gl.uniform4fv(spclUnilocation[4], amb)
        gl.drawElements(gl.TRIANGLES, cube.i.length, gl.UNSIGNED_SHORT, 0)
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    gl.clearColor(0.0, 0.7, 0.7, 1.0)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(cmPrg)
    util.setVboAttributePosition(gl, cmPrg, cube.p)
    util.setVboAttributeNormal(gl, cmPrg, cube.n)
    util.setVboAttributeTextureCoord(gl, cmPrg, cube.t)
    util.bindIbo(gl, cube.i)
    mat.identity(mMatrix);
    mat.scale(mMatrix, [100.0, 100.0, 100.0], mMatrix);
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(cmUnilocation[0], false, mMatrix);
    gl.uniformMatrix4fv(cmUnilocation[1], false, mvpMatrix);
    gl.uniform3fv(cmUnilocation[2], [0, 0, 0]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
    gl.uniform1i(cmUnilocation[3], 0);
    gl.uniform1i(cmUnilocation[4], 0);
    gl.drawElements(gl.TRIANGLES, cube.i.length, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(spclPrg);
    util.setVboAttributePosition(gl, spclPrg, torus.p)
    util.setVboAttributeNormal(gl, spclPrg, torus.n)
    util.setVboAttributeColor(gl, spclPrg, torus.c)
    util.bindIbo(gl, torus.i)
    for (let idx = 0; idx < 9; ++idx) {
        const amb = util.hsva(idx * 40, 1, 1, 1);
        mat.identity(mMatrix);
        mat.rotate(mMatrix, idx * 2 * Math.PI / 9, [0, 1, 0], mMatrix);
        mat.translate(mMatrix, [0.0, 0.0, 30.0], mMatrix);
        mat.rotate(mMatrix, rad, [1, 1, 0], mMatrix);
        mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
        mat.inverse(mMatrix, invMatrix);
        gl.uniformMatrix4fv(spclUnilocation[0], false, mvpMatrix);
        gl.uniformMatrix4fv(spclUnilocation[1], false, invMatrix);
        gl.uniform3fv(spclUnilocation[2], lightDirection);
        gl.uniform3fv(spclUnilocation[3], eyePosition);
        gl.uniform4fv(spclUnilocation[4], amb);
        gl.drawElements(gl.TRIANGLES, torus.i.length, gl.UNSIGNED_SHORT, 0);
    }

    mat.identity(tMatrix);
    tMatrix[0] = 0.5
    tMatrix[1] = 0.0
    tMatrix[2] = 0.0
    tMatrix[3] = 0.0
    tMatrix[4] = 0.0
    tMatrix[5] = 0.5
    tMatrix[6] = 0.0
    tMatrix[7] = 0.0
    tMatrix[8] = 0.0
    tMatrix[9] = 0.0
    tMatrix[10] = 1.0
    tMatrix[11] = 0.0
    tMatrix[12] = 0.5
    tMatrix[13] = 0.5
    tMatrix[14] = 0.0
    tMatrix[15] = 1.0

    mat.multiply(tMatrix, pMatrix, tvpMatrix)
    mat.multiply(tvpMatrix, vMatrix, tMatrix)

    const coeffcient = (parseFloat(range.value) - 50) / 50.0

    gl.bindTexture(gl.TEXTURE_2D, fb.t)

    gl.useProgram(opPrg)
    util.setVboAttributePosition(gl, opPrg, torus.p)
    util.setVboAttributeNormal(gl, opPrg, torus.n)
    util.setVboAttributeColor(gl, opPrg, torus.c)
    util.bindIbo(gl, torus.i)
    mat.identity(mat.create())
    mat.rotate(mMatrix, rad, [1, 0, 1], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    gl.uniformMatrix4fv(opUniLocation[0], false, mMatrix)
    gl.uniformMatrix4fv(opUniLocation[1], false, tMatrix)
    gl.uniformMatrix4fv(opUniLocation[2], false, mvpMatrix)
    gl.uniform1f(opUniLocation[3], coeffcient)
    gl.uniform1i(opUniLocation[4], 0)
    gl.drawElements(gl.TRIANGLES, torus.i.length, gl.UNSIGNED_SHORT, 0)

    gl.flush();

    setTimeout(func, 1000 / 30);
}

func()

function createCubeTexture(cubeSource: string[], cubeTarget: number[]) {
    const imgs = new Array()

    for (let idx = 0; idx < cubeSource.length; ++idx) {
        imgs[idx] = new cubeMapImage()
        imgs[idx].data.src = cubeSource[idx]
    }

    function cubeMapImage() {
        this.data = new Image() as HTMLImageElement
        this.data.onload = function () {
            this.imageDataLoaded = true
            checkLoaded()
        }
    }

    function checkLoaded() {
        if (imgs[0].data.imageDataLoaded &&
            imgs[1].data.imageDataLoaded &&
            imgs[2].data.imageDataLoaded &&
            imgs[3].data.imageDataLoaded &&
            imgs[4].data.imageDataLoaded &&
            imgs[5].data.imageDataLoaded) {
            generateCubeMap();
        }
    }

    function generateCubeMap() {
        const tex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex)

        for (let idx = 0; idx < cubeSource.length; ++idx) {
            gl.texImage2D(cubeTarget[idx], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgs[idx].data)
        }

        gl.generateMipmap(gl.TEXTURE_CUBE_MAP)

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        cubeTexture = tex;
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
    }
}
