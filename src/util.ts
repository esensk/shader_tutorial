import vert from "./shader.vert"
import frag from "./pointLightShader.frag"

export enum ShaderType {
    Vertex,
    Fragment
}

export function createShader(
    gl: WebGLRenderingContext,
    shaderType: ShaderType,
    shaderText: string
): WebGLShader | void {
    const glType = shaderType === ShaderType.Vertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER
    const shader: WebGLShader = gl.createShader(glType)
    gl.shaderSource(shader, shaderText)
    gl.compileShader(shader)
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : alert(gl.getShaderInfoLog(shader))
}

export function createProgram(gl: WebGLRenderingContext): WebGLProgram | void {
    const vertex: WebGLShader = createShader(gl, ShaderType.Vertex, vert) as WebGLShader
    const fragment: WebGLShader = createShader(gl, ShaderType.Fragment, frag) as WebGLSampler
    const program: WebGLProgram = gl.createProgram()
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return alert(gl.getProgramInfoLog(program))
    }

    gl.useProgram(program)
    return program
}

export function createProgramWithShader(gl: WebGLRenderingContext, vertCode: string, fragCode: string): WebGLProgram | void {
    const vertex: WebGLShader = createShader(gl, ShaderType.Vertex, vertCode) as WebGLShader
    const fragment: WebGLShader = createShader(gl, ShaderType.Fragment, fragCode) as WebGLShader
    const program: WebGLProgram = gl.createProgram()
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return alert(gl.getProgramInfoLog(program))
    }

    gl.useProgram(program)
    return program
}

export function AttribLocations(gl: WebGLRenderingContext, program: WebGLProgram, ...names: string[]): GLint[] {
    let locations: GLint[] = new Array()
    if (names === undefined || names === null || names.length < 1) {
        return locations
    }

    names.forEach(element => {
        locations.push(gl.getAttribLocation(program, element))
    })

    return locations
}

export function UniformLocations(gl: WebGLRenderingContext, program: WebGLProgram, ...names: string[]): WebGLUniformLocation[] {
    let locations: WebGLUniformLocation[] = new Array()
    if (names === undefined || names === null || names.length < 1) {
        return locations
    }

    names.forEach(element => {
        locations.push(gl.getUniformLocation(program, element))
    })

    return locations
}

export function createVbo(gl: WebGLRenderingContext, data: number[]): WebGLBuffer {
    const vbo: WebGLBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    return vbo
}

export function createIbo(gl: WebGLRenderingContext, data: number[]): WebGLBuffer {
    const ibo: WebGLBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
    return ibo
}

export function setAttribute(gl: WebGLRenderingContext, vbo: WebGLBuffer, location: GLint, stride: number): void {
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, stride, gl.FLOAT, false, 0, 0)
}

export function setVboAttribute(gl: WebGLRenderingContext, program: WebGLProgram, data: number[], paramName: string, stride: number): void {
    const vbo = createVbo(gl, data)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)

    const location: GLint = gl.getAttribLocation(program, paramName)
    gl.enableVertexAttribArray(location)

    gl.vertexAttribPointer(location, stride, gl.FLOAT, false, 0, 0)
}

export function bindIbo(gl: WebGLRenderingContext, indexes: number[]): void {
    const ibo: WebGLBuffer = createIbo(gl, indexes)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
}