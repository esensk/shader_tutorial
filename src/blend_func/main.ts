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

const elmRGBRed = document.getElementById("rangeBgRed") as HTMLInputElement
const elmRGBGreen = document.getElementById("rangeBgGreen") as HTMLInputElement
const elmRGBBlue = document.getElementById("rangeBgBlue") as HTMLInputElement
const elmRGBAlpha = document.getElementById("rangeBgAlpha") as HTMLInputElement

const elmRBCRed = document.getElementById("rangeBgRed") as HTMLInputElement
const elmRBCGreen = document.getElementById("rangeBgGreen") as HTMLInputElement
const elmRBCBlue = document.getElementById("rangeBgBlue") as HTMLInputElement
const elmRBCAlpha = document.getElementById("rangeBgAlpha") as HTMLInputElement

const elmIM1Blend = document.getElementById("m1Blend") as HTMLInputElement
const eRM1VAlpha = document.getElementById('rangeM1VertexAlpha') as HTMLInputElement
const eLM1CEquation = document.getElementById('m1cEquation') as HTMLSelectElement
const eLM1AEquation = document.getElementById('m1aEquation') as HTMLSelectElement
const eLM1CSRCBF = document.getElementById('m1cSrcBlendFunc') as HTMLSelectElement
const eLM1CDSTBF = document.getElementById('m1cDstBlendFunc') as HTMLSelectElement
const eLM1ASRCBF = document.getElementById('m1aSrcBlendFunc') as HTMLSelectElement
const eLM1ADSTBF = document.getElementById('m1aDstBlendFunc') as HTMLSelectElement

const eIM2Blend = document.getElementById('m2Blend') as HTMLInputElement
const eRM2VAlpha = document.getElementById('rangeM2VertexAlpha') as HTMLInputElement
const eLM2CEquation = document.getElementById('m2cEquation') as HTMLSelectElement
const eLM2AEquation = document.getElementById('m2aEquation') as HTMLSelectElement
const eLM2CSRCBF = document.getElementById('m2cSrcBlendFunc') as HTMLSelectElement
const eLM2CDSTBF = document.getElementById('m2cDstBlendFunc') as HTMLSelectElement
const eLM2ASRCBF = document.getElementById('m2aSrcBlendFunc') as HTMLSelectElement
const eLM2ADSTBF = document.getElementById('m2aDstBlendFunc') as HTMLSelectElement

const gl = canvas.getContext("webgl") as WebGLRenderingContext
const program = util.createProgramWithShader(gl, vert, frag) as WebGLProgram

// equation constant array
const equationList: number[] = new Array();
equationList[0] = gl.FUNC_ADD;
equationList[1] = gl.FUNC_SUBTRACT;
equationList[2] = gl.FUNC_REVERSE_SUBTRACT;

// blend factor constant array
const blendFctList: number[] = new Array();
blendFctList[0] = gl.ZERO;
blendFctList[1] = gl.ONE;
blendFctList[2] = gl.SRC_COLOR;
blendFctList[3] = gl.DST_COLOR;
blendFctList[4] = gl.ONE_MINUS_SRC_COLOR;
blendFctList[5] = gl.ONE_MINUS_DST_COLOR;
blendFctList[6] = gl.SRC_ALPHA;
blendFctList[7] = gl.DST_ALPHA;
blendFctList[8] = gl.ONE_MINUS_SRC_ALPHA;
blendFctList[9] = gl.ONE_MINUS_DST_ALPHA;
blendFctList[10] = gl.CONSTANT_COLOR;
blendFctList[11] = gl.ONE_MINUS_CONSTANT_COLOR;
blendFctList[12] = gl.CONSTANT_ALPHA;
blendFctList[13] = gl.ONE_MINUS_CONSTANT_ALPHA;
blendFctList[14] = gl.SRC_ALPHA_SATURATE;


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
gl.activeTexture(gl.TEXTURE0)

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

let count: number = 0;
const func = () => {
    let r = parseFloat(elmRGBRed.value) / 100
    let g = parseFloat(elmRGBGreen.value) / 100
    let b = parseFloat(elmRGBBlue.value) / 100
    let a = parseFloat(elmRGBAlpha.value) / 100
    gl.clearColor(r, g, b, a)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    r = parseFloat(elmRBCRed.value) / 100
    g = parseFloat(elmRBCGreen.value) / 100
    b = parseFloat(elmRBCBlue.value) / 100
    a = parseFloat(elmRBCAlpha.value) / 100
    gl.blendColor(r, b, g, a)

    const m1VertexAlpha = parseFloat(eRM1VAlpha.value) / 100
    const m2VertexAlpha = parseFloat(eRM2VAlpha.value) / 100

    count++
    const rad = (count % 360) * Math.PI / 180

    mat.identity(mMatrix)
    mat.translate(mMatrix, [0.25, 0.25, -0.25], mMatrix)
    mat.rotate(mMatrix, rad, [0, 1, 0], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)

    gl.bindTexture(gl.TEXTURE_2D, texture)

    if (elmIM1Blend.checked) {
        gl.enable(gl.BLEND)
    } else {
        gl.disable(gl.BLEND)
    }

    let equationColor = equationList[eLM1CEquation.selectedIndex]
    let equationAlpha = equationList[eLM1AEquation.selectedIndex]
    let blendFctCSRC = blendFctList[eLM1CSRCBF.selectedIndex]
    let blendFctCDST = blendFctList[eLM1CDSTBF.selectedIndex];
    let blendFctASRC = blendFctList[eLM1ASRCBF.selectedIndex];
    let blendFctADST = blendFctList[eLM1ADSTBF.selectedIndex];
    gl.blendEquationSeparate(equationColor, equationAlpha);
    gl.blendFuncSeparate(blendFctCSRC, blendFctCDST, blendFctASRC, blendFctADST);

    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix)
    gl.uniform1f(uniLocation[1], m1VertexAlpha)
    gl.uniform1i(uniLocation[2], 0)
    gl.uniform1i(uniLocation[3], 1)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

    mat.identity(mMatrix)
    mat.translate(mMatrix, [-0.25, -0.25, 0.25], mMatrix)
    mat.rotate(mMatrix, rad, [0, 0, 1], mMatrix)
    mat.multiply(tmpMatrix, mMatrix, mvpMatrix)

    gl.bindTexture(gl.TEXTURE_2D, null)

    if (eIM2Blend.checked) {
        gl.enable(gl.BLEND)
    }
    else {
        gl.disable(gl.BLEND);
    }

    equationColor = equationList[eLM2CEquation.selectedIndex];
    equationAlpha = equationList[eLM2AEquation.selectedIndex];
    blendFctCSRC = blendFctList[eLM2CSRCBF.selectedIndex];
    blendFctCDST = blendFctList[eLM2CDSTBF.selectedIndex];
    blendFctASRC = blendFctList[eLM2ASRCBF.selectedIndex];
    blendFctADST = blendFctList[eLM2ADSTBF.selectedIndex];
    gl.blendEquationSeparate(equationColor, equationAlpha);
    gl.blendFuncSeparate(blendFctCSRC, blendFctCDST, blendFctASRC, blendFctADST);


    gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix)
    gl.uniform1f(uniLocation[1], m2VertexAlpha)
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
