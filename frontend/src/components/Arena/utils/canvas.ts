export interface FitCanvasPropsType {
    canvas: HTMLCanvasElement | null;
    ctx: CanvasRenderingContext2D | null;
    cssWidth: number;
    cssHeight: number;
}

export function fitCanvas({ canvas, ctx, cssWidth, cssHeight }: FitCanvasPropsType) {
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
}

export const lerp = (start: number, end: number, alpha: number): number => {
    return start + (end - start) * alpha;
};
