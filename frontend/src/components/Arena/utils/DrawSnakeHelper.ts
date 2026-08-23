import { CELL , SNAKE_SCALE} from "./drawGame";
import { PositionType, DirectionType, SnakeType } from "@/src/types/GameTypes/GameTypes";
import { lerp } from "./canvas";
import { fixCorners } from "./DrawCanvasHelper";

export function drawSnakeHeadEyes( ctx: CanvasRenderingContext2D, renderX: number, renderY: number, facing: DirectionType) {
    let eye1 = { x: 0, y: 0 };
    let eye2 = { x: 0, y: 0 };

    if (facing === "RIGHT") {
        eye1 = { x: renderX + CELL - 8, y: renderY + 4, };

        eye2 = { x: renderX + CELL - 8, y: renderY + CELL - 9, };
    } else if (facing === "LEFT") {
        eye1 = { x: renderX + 4, y: renderY + 4, };
        eye2 = { x: renderX + 4, y: renderY + CELL - 9, };
    } else if (facing === "UP") {
        eye1 = { x: renderX + 4, y: renderY + 4, };
        eye2 = { x: renderX + CELL - 9, y: renderY + 4, };
    } else { 
        eye1 = { x: renderX + 4, y: renderY + CELL - 8, };
        eye2 = { x: renderX + CELL - 9, y: renderY + CELL - 8, };
    }
    // White eyes
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc( eye1.x + 2, eye1.y + 2, 2.2, 0, Math.PI * 2 );
    ctx.fill();
    ctx.beginPath();
    ctx.arc( eye2.x + 2, eye2.y + 2, 2.2, 0, Math.PI * 2 );
    ctx.fill();

    // Black pupils
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    ctx.arc( eye1.x + 2, eye1.y + 2, 1, 0, Math.PI * 2 );
    ctx.fill();
    ctx.beginPath();
    ctx.arc( eye2.x + 2, eye2.y + 2, 1, 0, Math.PI * 2 );
    ctx.fill();
}

export function drawSnakeHelperIndex0(ctx:CanvasRenderingContext2D, renderX: number, renderY: number, baseColor: string) {
    const headRenderX = renderX;
    const headRenderY = renderY;

    const gradient = ctx.createLinearGradient( renderX, renderY, renderX + CELL, renderY + CELL );
    gradient.addColorStop( 1, baseColor );
    gradient.addColorStop( 1, "rgba(0, 0, 0, 0.25)" );

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect( renderX, renderY, CELL - 3, CELL - 3, 6 );
    ctx.fill();
    // Small head highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
    ctx.beginPath();
    ctx.roundRect( renderX + 2, renderY + 2, (CELL - 3) - 5, 4, 3 );
    ctx.fill();
    return { headRenderX, headRenderY};
}

export function drawSnakeHelperIindx1 (prevSegBody : PositionType | undefined, renderX: number, renderY: number, step : boolean, seg: PositionType) {

        let p1 = { x: renderX, y: renderY + CELL - 1 };
        let p2 = { x: renderX, y: renderY };
        let tip = step
            ? { x: renderX + CELL, y: renderY + (CELL / 2 + 5) }
            : { x: renderX + CELL, y: renderY + (CELL / 2 - 5) };

        if (prevSegBody) {
            if (seg.x < prevSegBody.x) {
                p1 = { x: renderX + CELL, y: renderY };
                p2 = { x: renderX + CELL, y: renderY + CELL - 1 };
                tip = step
                    ? { x: renderX, y: renderY + (CELL / 2 + 5) }
                    : { x: renderX, y: renderY + (CELL / 2 - 5) };
            } 
            else if (seg.y > prevSegBody.y) {
                p1 = { x: renderX, y: renderY };
                p2 = { x: renderX + CELL - 1, y: renderY };
                tip = step
                    ? { x: renderX + (CELL / 2 + 5), y: renderY + CELL }
                    : { x: renderX + (CELL / 2 - 5), y: renderY + CELL };
            } 
            else if (seg.y < prevSegBody.y) {
                p1 = { x: renderX + CELL - 1, y: renderY + CELL };
                p2 = { x: renderX, y: renderY + CELL };
                tip = step
                    ? { x: renderX + (CELL / 2 + 5), y: renderY }
                    : { x: renderX + (CELL / 2 - 5), y: renderY };
            }
        }
        return { p1, p2, tip};
}

export function drawSnakeHelper(ctx : CanvasRenderingContext2D, snake: SnakeType, prevSnake:  SnakeType | undefined, alpha: number, step: boolean) {

    const baseColor = snake?.color || "#12ea94";
    const totalSegments = snake.body.length;
    let   position : { headRenderX: number; headRenderY: number } | undefined;

     for ( let index = 0; index < totalSegments; index++ ) {

            const seg = snake.body[index];
            const prevSeg = prevSnake?.body[index] ?? seg;
            const renderX = lerp( prevSeg.x,seg.x, alpha ) * CELL;
            const renderY = lerp( prevSeg.y, seg.y, alpha ) * CELL;

            ctx.save();
            ctx.translate( (renderX + CELL / 2), (renderY + CELL / 2) );

            // Tiny breathing animation
            const pulse = index === 0 ? 1 + Math.sin( performance.now() / 140 ) * 0.025 : 1;
            ctx.scale( SNAKE_SCALE * pulse, SNAKE_SCALE * pulse);
            ctx.translate( -(renderX + CELL / 2), -(renderY + CELL / 2));

            // Head
            if (index === 0) {
              position = drawSnakeHelperIndex0(ctx, renderX, renderY, baseColor);
            }
            // Body: head to tail (restored from legacy renderer)
            else {
                ctx.fillStyle = baseColor;

                if (index === totalSegments - 1) {
                    const prevSegBody = snake.body[index - 1];
                    const {p1, p2, tip} = drawSnakeHelperIindx1 (prevSegBody, renderX, renderY, step, seg);
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(tip.x, tip.y);
                    ctx.closePath();
                    ctx.fill();
                } 
                else if (index === totalSegments - 2) {
                    const tailSeg = snake.body[index + 1];
                    const corners = fixCorners(tailSeg, seg);
                    ctx.beginPath();
                    ctx.roundRect(renderX, renderY, CELL - 1, CELL - 1, corners);
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.roundRect(renderX, renderY, CELL - 1, CELL - 1, 7);
                    ctx.fill();
                }
            }
            ctx.restore();
        }
    return position;
}