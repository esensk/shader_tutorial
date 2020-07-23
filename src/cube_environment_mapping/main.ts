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

const cube = util.cube(2.0, [1.0, 1.0, 1.0, 1.0])
const sphere = util.sphere(64, 64, 2.5, [1.0, 1.0, 1.0, 1.0])
const torus = util.torus(64, 64, 1.0, 2.0, [1.0, 1.0, 1.0, 1.0])

const uniLocation = util.UniformLocations(
    gl, program,
    "mMatrix",
    "mvpMatrix",
    "eyePosition",
    "cubeTexture",
    "reflection",
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

let cubeTex: WebGLTexture = null
const cubeSource: string[] = new Array(
    "../src/texture/cube_PX.png",
    "../src/texture/cube_PY.png",
    "../src/texture/cube_PZ.png",
    "../src/texture/cube_NX.png",
    "../src/texture/cube_NY.png",
    "../src/texture/cube_NZ.png",
)
const cubeTarget: number[] = new Array(
    gl.TEXTURE_CUBE_MAP_POSITIVE_X,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
)

createCubeTexture(cubeSource, cubeTarget)

const eyePosition = [0.0, 0.0, 20.0]
let count: number = 0
const func = () => {
    count++;
    const rad1 = (count % 360) * Math.PI / 180;
    const rad2 = ((count + 180) % 360) * Math.PI / 180;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const camUp = new Array()
    qtn.toVecIII([0.0, 0.0, 20.0], qt, eyePosition)
    qtn.toVecIII([0.0, 1.0, 0.0], qt, camUp)
    mat.lookAt(eyePosition, [0, 0, 0], camUp, vMatrix);
    mat.perspective(45, canvas.width / canvas.height, 0.1, 200, pMatrix)
    mat.multiply(pMatrix, vMatrix, tmpMatrix);

    // Background
    util.setVboAttributePosition(gl, program, cube.p)
    util.setVboAttributeNormal(gl, program, cube.n)
    util.setVboAttributeColor(gl, program, cube.c)
    util.bindIbo(gl, cube.i)

    mat.identity(mMatrix)
    mat.scale(mMatrix, [100.0, 100.0, 100.0], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation[0], false, mMatrix)
    gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix)
    gl.uniform3fv(uniLocation[2], eyePosition)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTex)
    gl.uniform1i(uniLocation[3], 0)
    gl.uniform1i(uniLocation[4], 0)
    gl.drawElements(gl.TRIANGLES, cube.i.length, gl.UNSIGNED_SHORT, 0)

    // Sphere
    util.setVboAttributePosition(gl, program, sphere.p)
    util.setVboAttributeNormal(gl, program, sphere.n)
    util.setVboAttributeColor(gl, program, sphere.c)
    util.bindIbo(gl, sphere.i)

    mat.identity(mMatrix)
    mat.rotate(mMatrix, rad1, [0, 0, 1], mMatrix)
    mat.translate(mMatrix, [5.0, 0.0, 0.0], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation[0], false, mMatrix)
    gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix)
    gl.uniform1i(uniLocation[4], 1)
    gl.drawElements(gl.TRIANGLES, sphere.i.length, gl.UNSIGNED_SHORT, 0)

    // Torus
    util.setVboAttributePosition(gl, program, torus.p)
    util.setVboAttributeNormal(gl, program, torus.n)
    util.setVboAttributeColor(gl, program, torus.c)
    util.bindIbo(gl, torus.i)

    mat.identity(mMatrix)
    mat.rotate(mMatrix, rad2, [0, 0, 1], mMatrix)
    mat.translate(mMatrix, [5.0, 0.0, 0.0], mMatrix)
    mat.rotate(mMatrix, rad1, [1, 0, 1], mMatrix);
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)
    gl.uniformMatrix4fv(uniLocation[0], false, mMatrix)
    gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix)
    gl.uniform1i(uniLocation[4], 1)
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

        cubeTex = tex;
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
    }
} 