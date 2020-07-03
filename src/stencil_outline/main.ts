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

const torus = util.torus(64, 64, 0.25, 1.0, undefined)
const sphere = util.sphere(64, 64, 1.0, [1.0, 1.0, 1.0, 1.0])

const uniLocation = util.UniformLocations(
    gl, program,
    "mvpMatrix",
    "invMatrix",
    "lightDirection",
    "useLight",
    "texture",
    "useTexture",
    "outline",
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
create_texture("../src/texture/texture5.png", 0)

let count: number = 0
const func = () => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clearStencil(0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    // カウンタのインクリメントとラジアンの算出
    count++;
    const rad = (count % 360) * Math.PI / 180;

    // ビュー×プロジェクション座標変換行列
    mat.lookAt([0.0, 0.0, 10.0], [0, 0, 0], [0, 1, 0], vMatrix);
    mat.perspective(45, canvas.width / canvas.height, 0.1, 100, pMatrix);
    const qMatrix = mat.identity(mat.create());
    qtn.toMatIV(qt, qMatrix);
    mat.multiply(vMatrix, qMatrix, vMatrix);
    mat.multiply(pMatrix, vMatrix, tmpMatrix);

    // テクスチャをバインド
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);

    // ステンシルテストを有効にする
    gl.enable(gl.STENCIL_TEST);

    // カラーと深度をマスク
    gl.colorMask(false, false, false, false);
    gl.depthMask(false);

    // トーラス(シルエット)用ステンシル設定
    gl.stencilFunc(gl.ALWAYS, 1, ~0);
    gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);

    // トーラスの頂点データ
    util.setVboAttribute(gl, program, torus.p, "position", 3)
    util.setVboAttribute(gl, program, torus.n, "normal", 3)
    util.setVboAttribute(gl, program, torus.c, "color", 4)
    util.setVboAttribute(gl, program, torus.t, "textureCoord", 2)
    util.bindIbo(gl, torus.i);

    // トーラスモデル座標変換行列の生成
    mat.identity(mMatrix);
    mat.rotate(mMatrix, rad, [0.0, 1.0, 1.0], mMatrix);
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix);

    // uniform変数の登録と描画
    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
    gl.uniform1i(uniLocation[3], 0);
    gl.uniform1i(uniLocation[5], 0);
    gl.uniform1i(uniLocation[6], 1);
    gl.drawElements(gl.TRIANGLES, torus.i.length, gl.UNSIGNED_SHORT, 0);

    // カラーと深度のマスクを解除
    gl.colorMask(true, true, true, true);
    gl.depthMask(true);

    // 球体モデル用ステンシル設定
    gl.stencilFunc(gl.EQUAL, 0, ~0);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

    // 球体モデルの頂点データ
    util.setVboAttribute(gl, program, sphere.p, "position", 3)
    util.setVboAttribute(gl, program, sphere.n, "normal", 3)
    util.setVboAttribute(gl, program, sphere.c, "color", 4)
    util.setVboAttribute(gl, program, sphere.t, "textureCoord", 2)
    util.bindIbo(gl, sphere.i);

    // 球体モデル座標変換行列の生成
    mat.identity(mMatrix);
    mat.scale(mMatrix, [50.0, 50.0, 50.0], mMatrix);
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix);

    // uniform変数の登録と描画
    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
    gl.uniform1i(uniLocation[3], 0);
    gl.uniform1i(uniLocation[4], 0);
    gl.uniform1i(uniLocation[5], 1);
    gl.uniform1i(uniLocation[6], 0);
    gl.drawElements(gl.TRIANGLES, sphere.i.length, gl.UNSIGNED_SHORT, 0);

    // ステンシルテストを無効にする
    gl.disable(gl.STENCIL_TEST);

    // トーラスの頂点データ
    util.setVboAttribute(gl, program, torus.p, "position", 3)
    util.setVboAttribute(gl, program, torus.n, "normal", 3)
    util.setVboAttribute(gl, program, torus.c, "color", 4)
    util.setVboAttribute(gl, program, torus.t, "textureCoord", 2)
    util.bindIbo(gl, torus.i);

    // トーラスモデル座標変換行列の生成
    mat.identity(mMatrix);
    mat.rotate(mMatrix, rad, [0.0, 1.0, 1.0], mMatrix);
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix);

    // uniform変数の登録と描画
    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
    gl.uniformMatrix4fv(uniLocation[1], false, invMatrix);
    gl.uniform3fv(uniLocation[2], lightDirection);
    gl.uniform1i(uniLocation[3], 1);
    gl.uniform1i(uniLocation[5], 0);
    gl.uniform1i(uniLocation[6], 0);
    gl.drawElements(gl.TRIANGLES, torus.i.length, gl.UNSIGNED_SHORT, 0);

    // コンテキストの再描画
    gl.flush();

    // ループのために再帰呼び出し
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