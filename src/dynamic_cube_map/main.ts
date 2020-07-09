import * as util from "../util"
import matIV from "../lib/minMatrix"
import qtnIV from "../lib/minMatrixb"
import lvert from "./light_vert.glsl"
import lfrag from "./light_frag.glsl"
import cvert from "./cube_vert.glsl"
import cfrag from "./cube_frag.glsl"

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

const sPrg = util.createProgramWithShader(gl, lvert, lfrag) as WebGLProgram
const sUniLocation = util.UniformLocations(
    gl, sPrg,
    "mMatrix",
    "invMatrix",
    "lightDirection",
    "eyeDirection",
    "ambientColor",
)

const cPrg = util.createProgramWithShader(gl, cvert, cfrag) as WebGLProgram
const cUniLocation = util.UniformLocations(
    gl, cPrg,
    "mMatrix",
    "mvpMatrix",
    "eyePosition",
    "cubeTexture",
    "reflection",
)

const cube = util.cube(2.0, [1.0, 1.0, 1.0, 1.0])
const sphere = util.sphere(64, 64, 3, [1.0, 1.0, 1.0, 1.0])
const torus = util.torus(64, 64, 0.5, 1.0, [1.0, 1.0, 1.0, 1.0])

const mat = new matIV()
const mMatrix = mat.identity(mat.create())
const vMatrix = mat.identity(mat.create())
const pMatrix = mat.identity(mat.create())
const tmpMatrix = mat.identity(mat.create())
const mvpMatrix = mat.identity(mat.create())
const invMatrix = mat.identity(mat.create())

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

const fb = util.createFrameBufferForCubeMap(gl, canvas.width, canvas.height, cubeTarget)

let count: number = 0
const func = () => {
    count++;
    const rad = (count % 360) * Math.PI / 180;

    const eye: number[][] = new Array()
    const camUp: number[][] = new Array()
    const pos: number[][] = new Array()
    const amb: number[][] = new Array()

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb.f)

    // ライトベクトル
    const lightDirection = [-1.0, 1.0, 1.0];

    for (let i = 0; i < cubeTarget.length; i++) {
        // フレームバッファにテクスチャを関連付ける
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, cubeTarget[i], fb.t, 0);

        // フレームバッファを初期化
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // 方角を判別して処理する
        switch (cubeTarget[i]) {
            case gl.TEXTURE_CUBE_MAP_POSITIVE_X:
                eye[i] = [1, 0, 0];
                camUp[i] = [0, -1, 0];
                pos[i] = [6, 0, 0];
                amb[i] = [1.0, 0.5, 0.5, 1.0];
                break;
            case gl.TEXTURE_CUBE_MAP_POSITIVE_Y:
                eye[i] = [0, 1, 0];
                camUp[i] = [0, 0, 1];
                pos[i] = [0, 6, 0];
                amb[i] = [0.5, 1.0, 0.5, 1.0];
                break;
            case gl.TEXTURE_CUBE_MAP_POSITIVE_Z:
                eye[i] = [0, 0, 1];
                camUp[i] = [0, -1, 0];
                pos[i] = [0, 0, 6];
                amb[i] = [0.5, 0.5, 1.0, 1.0];
                break;
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_X:
                eye[i] = [-1, 0, 0];
                camUp[i] = [0, -1, 0];
                pos[i] = [-6, 0, 0];
                amb[i] = [0.5, 0.0, 0.0, 1.0];
                break;
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_Y:
                eye[i] = [0, -1, 0];
                camUp[i] = [0, 0, -1];
                pos[i] = [0, -6, 0];
                amb[i] = [0.0, 0.5, 0.0, 1.0];
                break;
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_Z:
                eye[i] = [0, 0, -1];
                camUp[i] = [0, -1, 0];
                pos[i] = [0, 0, -6];
                amb[i] = [0.0, 0.0, 0.5, 1.0];
                break;
            default:
                break;
        }

        // ビュー×プロジェクション座標変換行列
        mat.lookAt([0, 0, 0], eye[i], camUp[i], vMatrix);
        mat.perspective(90, 1.0, 0.1, 200, pMatrix);
        mat.multiply(pMatrix, vMatrix, tmpMatrix);

        // キューブマップテクスチャで背景用キューブをレンダリング
        gl.useProgram(cPrg);
        util.setVboAttributePosition(gl, cPrg, cube.p)
        util.setVboAttributeNormal(gl, cPrg, cube.n)
        util.setVboAttributeColor(gl, cPrg, cube.c)
        util.bindIbo(gl, cube.i)

        mat.identity(mMatrix);
        mat.scale(mMatrix, [100.0, 100.0, 100.0], mMatrix);
        mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
        gl.uniformMatrix4fv(cUniLocation[0], false, mMatrix);
        gl.uniformMatrix4fv(cUniLocation[1], false, mvpMatrix);
        gl.uniform3fv(cUniLocation[2], [0, 0, 0]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTex);
        gl.uniform1i(cUniLocation[3], 0);
        gl.uniform1i(cUniLocation[4], 0);
        gl.drawElements(gl.TRIANGLES, cube.i.length, gl.UNSIGNED_SHORT, 0);

        // 視線ベクトルの変換
        const invEye = new Array();
        invEye[0] = -eye[i][0];
        invEye[1] = -eye[i][1];
        invEye[2] = -eye[i][2];

        // スペキュラライティングシェーダでトーラスモデルをレンダリング
        gl.useProgram(sPrg);
        util.setVboAttributePosition(gl, sPrg, torus.p)
        util.setVboAttributeNormal(gl, sPrg, torus.n)
        util.setVboAttributeColor(gl, sPrg, torus.c)
        util.bindIbo(gl, torus.i)

        mat.identity(mMatrix);
        mat.translate(mMatrix, pos[i], mMatrix);
        mat.rotate(mMatrix, rad, eye[i], mMatrix);
        mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
        mat.inverse(mMatrix, invMatrix);
        gl.uniformMatrix4fv(sUniLocation[0], false, mvpMatrix);
        gl.uniformMatrix4fv(sUniLocation[1], false, invMatrix);
        gl.uniform3fv(sUniLocation[2], lightDirection);
        gl.uniform3fv(sUniLocation[3], invEye);
        gl.uniform4fv(sUniLocation[4], amb[i]);
        gl.drawElements(gl.TRIANGLES, torus.i.length, gl.UNSIGNED_SHORT, 0);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // ビュー×プロジェクション座標変換行列
    const camUpDirection = new Array();
    qtn.toVecIII([0.0, 0.0, 20.0], qt, eyePosition);
    qtn.toVecIII([0.0, 1.0, 0.0], qt, camUpDirection);
    mat.lookAt(eyePosition, [0, 0, 0], camUpDirection, vMatrix);
    mat.perspective(45, canvas.width / canvas.height, 0.1, 200, pMatrix);
    mat.multiply(pMatrix, vMatrix, tmpMatrix);

    // キューブ環境マッピングシェーダ
    gl.useProgram(cPrg);

    // 背景用キューブをレンダリング
    util.setVboAttributePosition(gl, cPrg, cube.p)
    util.setVboAttributeNormal(gl, cPrg, cube.n)
    util.setVboAttributeColor(gl, cPrg, cube.c)
    util.bindIbo(gl, cube.i)

    mat.identity(mMatrix);
    mat.scale(mMatrix, [100.0, 100.0, 100.0], mMatrix);
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(cUniLocation[0], false, mMatrix);
    gl.uniformMatrix4fv(cUniLocation[1], false, mvpMatrix);
    gl.uniform3fv(cUniLocation[2], eyePosition);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTex);
    gl.uniform1i(cUniLocation[3], 0);
    gl.uniform1i(cUniLocation[4], 0);
    gl.drawElements(gl.TRIANGLES, cube.i.length, gl.UNSIGNED_SHORT, 0);

    // 動的キューブマップテクスチャを適用して球体をレンダリング
    util.setVboAttributePosition(gl, cPrg, sphere.p)
    util.setVboAttributeNormal(gl, cPrg, sphere.n)
    util.setVboAttributeColor(gl, cPrg, sphere.c)
    util.bindIbo(gl, sphere.i)

    mat.identity(mMatrix);
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv(cUniLocation[0], false, mMatrix);
    gl.uniformMatrix4fv(cUniLocation[1], false, mvpMatrix);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, fb.t);
    gl.uniform1i(cUniLocation[3], 0);
    gl.uniform1i(cUniLocation[4], 1);
    gl.drawElements(gl.TRIANGLES, sphere.i.length, gl.UNSIGNED_SHORT, 0);

    // スペキュラライティングシェーダ
    gl.useProgram(sPrg);

    // トーラスをレンダリング
    util.setVboAttributePosition(gl, sPrg, torus.p)
    util.setVboAttributeNormal(gl, sPrg, torus.n)
    util.setVboAttributeColor(gl, sPrg, torus.c)
    util.bindIbo(gl, torus.i)
    for (let i = 0; i < cubeTarget.length; i++) {
        mat.identity(mMatrix);
        mat.translate(mMatrix, pos[i], mMatrix);
        mat.rotate(mMatrix, rad, eye[i], mMatrix);
        mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
        mat.inverse(mMatrix, invMatrix);
        gl.uniformMatrix4fv(sUniLocation[0], false, mvpMatrix);
        gl.uniformMatrix4fv(sUniLocation[1], false, invMatrix);
        gl.uniform3fv(sUniLocation[2], lightDirection);
        gl.uniform3fv(sUniLocation[3], eyePosition);
        gl.uniform4fv(sUniLocation[4], amb[i]);
        gl.drawElements(gl.TRIANGLES, torus.i.length, gl.UNSIGNED_SHORT, 0);
    }


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