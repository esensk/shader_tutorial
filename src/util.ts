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

export function torus(row, column, irad, orad, color) {
    var pos = new Array(), nor = new Array(),
        col = new Array(), st = new Array(), idx = new Array();
    for (var i = 0; i <= row; i++) {
        var r = Math.PI * 2 / row * i;
        var rr = Math.cos(r);
        var ry = Math.sin(r);
        for (var ii = 0; ii <= column; ii++) {
            var tr = Math.PI * 2 / column * ii;
            var tx = (rr * irad + orad) * Math.cos(tr);
            var ty = ry * irad;
            var tz = (rr * irad + orad) * Math.sin(tr);
            var rx = rr * Math.cos(tr);
            var rz = rr * Math.sin(tr);
            if (color) {
                var tc = color;
            } else {
                tc = hsva(360 / column * ii, 1, 1, 1);
            }
            var rs = 1 / column * ii;
            var rt = 1 / row * i + 0.5;
            if (rt > 1.0) { rt -= 1.0; }
            rt = 1.0 - rt;
            pos.push(tx, ty, tz);
            nor.push(rx, ry, rz);
            col.push(tc[0], tc[1], tc[2], tc[3]);
            st.push(rs, rt);
        }
    }
    for (i = 0; i < row; i++) {
        for (ii = 0; ii < column; ii++) {
            r = (column + 1) * i + ii;
            idx.push(r, r + column + 1, r + 1);
            idx.push(r + column + 1, r + column + 2, r + 1);
        }
    }
    return { p: pos, n: nor, c: col, t: st, i: idx };
}

export function sphere(row: number, column: number, rad: number, color: number[]) {
    var pos = new Array(), nor = new Array(),
        col = new Array(), st = new Array(), idx = new Array();
    for (var i = 0; i <= row; i++) {
        var r = Math.PI / row * i;
        var ry = Math.cos(r);
        var rr = Math.sin(r);
        for (var ii = 0; ii <= column; ii++) {
            var tr = Math.PI * 2 / column * ii;
            var tx = rr * rad * Math.cos(tr);
            var ty = ry * rad;
            var tz = rr * rad * Math.sin(tr);
            var rx = rr * Math.cos(tr);
            var rz = rr * Math.sin(tr);
            if (color) {
                var tc = color;
            } else {
                tc = hsva(360 / row * i, 1, 1, 1);
            }
            pos.push(tx, ty, tz);
            nor.push(rx, ry, rz);
            col.push(tc[0], tc[1], tc[2], tc[3]);
            st.push(1 - 1 / column * ii, 1 / row * i);
        }
    }
    r = 0;
    for (i = 0; i < row; i++) {
        for (ii = 0; ii < column; ii++) {
            r = (column + 1) * i + ii;
            idx.push(r, r + 1, r + column + 2);
            idx.push(r, r + column + 2, r + column + 1);
        }
    }
    return { p: pos, n: nor, c: col, t: st, i: idx };
}

export function cube(side, color) {
    var hs = side * 0.5;
    var pos = [
        -hs, -hs, hs, hs, -hs, hs, hs, hs, hs, -hs, hs, hs,
        -hs, -hs, -hs, -hs, hs, -hs, hs, hs, -hs, hs, -hs, -hs,
        -hs, hs, -hs, -hs, hs, hs, hs, hs, hs, hs, hs, -hs,
        -hs, -hs, -hs, hs, -hs, -hs, hs, -hs, hs, -hs, -hs, hs,
        hs, -hs, -hs, hs, hs, -hs, hs, hs, hs, hs, -hs, hs,
        -hs, -hs, -hs, -hs, -hs, hs, -hs, hs, hs, -hs, hs, -hs
    ];
    var nor = [
        -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
        -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
        1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
        -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0
    ];
    var col = new Array();
    for (var i = 0; i < pos.length / 3; i++) {
        if (color) {
            var tc = color;
        } else {
            tc = hsva(360 / pos.length / 3 * i, 1, 1, 1);
        }
        col.push(tc[0], tc[1], tc[2], tc[3]);
    }
    var st = [
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
    ];
    var idx = [
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23
    ];
    return { p: pos, n: nor, c: col, t: st, i: idx };
}

export function hsva(h, s, v, a) {
    if (s > 1 || v > 1 || a > 1) { return; }
    var th = h % 360;
    var i = Math.floor(th / 60);
    var f = th / 60 - i;
    var m = v * (1 - s);
    var n = v * (1 - s * f);
    var k = v * (1 - s * (1 - f));
    var color = new Array();
    if (!(s > 0) && !(s < 0)) {
        color.push(v, v, v, a);
    } else {
        var r = new Array(v, n, m, m, k, v);
        var g = new Array(k, v, v, n, m, m);
        var b = new Array(m, m, k, v, v, n);
        color.push(r[i], g[i], b[i], a);
    }
    return color;
}
