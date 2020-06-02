declare module "*.frag"
declare module "*.vert"
declare module "*.glsl"

declare module "*.png" {
    const content: string
    export = content
}

interface CanvasSize {
    width: number
    height: number
}
