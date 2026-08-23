import { DirectionType , FoodType} from "@/src/types/GameTypes/GameTypes";

const TONGUE_REST_EXTEND = 0.40;
const CELL = 20;

const FOOD_KINDS: { emoji: string }[] = [
    { emoji: "🍒" },
    { emoji: "🍓" },
    { emoji: "🍐" },
    { emoji: "🍎" },
    { emoji: "🥭" },
    { emoji: "🍉" },
];

// Direction marker / tongue
export function  hashSeed(id: string | number): number {
    const str = String(id);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash;
}

export function getTongueExtend(userId: string | number, now: number): number {
    const period = 2400;
    const outDuration = 550;
    const offset = hashSeed(userId) % period;
    const t = (now + offset) % period;
    if (t > outDuration) return TONGUE_REST_EXTEND;
    const flick = Math.sin((t / outDuration) * Math.PI);
    return TONGUE_REST_EXTEND + (1 - TONGUE_REST_EXTEND) * flick;
}
// Crown
export function drawCrown( ctx: CanvasRenderingContext2D, renderX: number, renderY: number) {
    const crownWidth = CELL - 4;
    const crownLeft = renderX + 2;
    const crownTop = renderY - 8;

    ctx.save();
    // Glow
    ctx.shadowColor = "rgba(255, 215, 0, 0.65)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.moveTo(crownLeft, crownTop + 8);
    ctx.lineTo( crownLeft, crownTop );
    ctx.lineTo( crownLeft + 5, crownTop + 4 );
    ctx.lineTo( crownLeft + crownWidth / 2, crownTop - 3);
    ctx.lineTo( crownLeft + crownWidth - 5, crownTop + 4 );
    ctx.lineTo( crownLeft + crownWidth, crownTop );
    ctx.lineTo( crownLeft + crownWidth, crownTop + 8 );
    ctx.closePath();
    ctx.fill();

    // Crown band
    ctx.fillRect( crownLeft, crownTop + 6, crownWidth, 3);
    ctx.restore();
}

export function drawSnakeTongue( ctx: CanvasRenderingContext2D, renderX: number, renderY: number, facing: DirectionType, extend: number ) {
    if (extend <= 0.02) return;

    ctx.save();
    ctx.strokeStyle = "#ff3333";
    ctx.fillStyle = "#ff3333";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    const centerX = renderX + CELL / 2;
    const centerY = renderY + CELL / 2;
    const wiggle = Math.sin(performance.now() / 40) * 2.5 * extend;
    const reach = 7 * extend;
    const forkReach = 2 * extend;
    const spread = 3 * extend;

    ctx.beginPath();

    if (facing === "RIGHT") {
        const baseX = renderX + CELL - 1;
        const forkX = baseX + reach;
        ctx.moveTo(baseX, centerY);
        ctx.lineTo(forkX, centerY + wiggle);
        ctx.lineTo(forkX + forkReach, centerY + wiggle - spread);

        ctx.moveTo(forkX, centerY + wiggle);
        ctx.lineTo(forkX + forkReach, centerY + wiggle + spread);
    } else if (facing === "LEFT") {
        const baseX = renderX + 1;
        const forkX = baseX - reach;
        ctx.moveTo(baseX, centerY);
        ctx.lineTo(forkX, centerY + wiggle);
        ctx.lineTo(forkX - forkReach, centerY + wiggle - spread);

        ctx.moveTo(forkX, centerY + wiggle);
        ctx.lineTo(forkX - forkReach, centerY + wiggle + spread);
    } else if (facing === "UP") {
        const baseY = renderY + 1;
        const forkY = baseY - reach;
        ctx.moveTo(centerX + wiggle, baseY);
        ctx.lineTo(centerX + wiggle, forkY);
        ctx.lineTo(centerX + wiggle - spread, forkY - forkReach);

        ctx.moveTo(centerX + wiggle, forkY);
        ctx.lineTo(centerX + wiggle + spread, forkY - forkReach);
    } else {
        const baseY = renderY + CELL - 1;
        const forkY = baseY + reach;
        ctx.moveTo(centerX + wiggle, baseY);
        ctx.lineTo(centerX + wiggle, forkY);
        ctx.lineTo(centerX + wiggle - spread, forkY + forkReach);

        ctx.moveTo(centerX + wiggle, forkY);
        ctx.lineTo(centerX + wiggle + spread, forkY + forkReach);
    }
    ctx.stroke();
    ctx.restore();
}

export function helperForEach( food: FoodType[], ctx: CanvasRenderingContext2D, worldWidth: number, worldHeight: number, halfFruit: number) {
    const now = performance.now();

    food.forEach((f) => {
        if (f.eaten) return;
        const kind = FOOD_KINDS[f.kindIndex];
        if (!kind) return;
        const cx = Math.min( Math.max(f.position.x * CELL + CELL / 2, halfFruit), worldWidth - halfFruit);
        const cy = Math.min( Math.max(f.position.y * CELL + CELL / 2, halfFruit), worldHeight - halfFruit);
        const bob = Math.sin(now / 220 + f.position.x * 0.7 + f.position.y * 0.3) * 1.5;
        ctx.save();
        ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
        ctx.shadowBlur = 7;
        ctx.fillStyle = "#ffffff";
        ctx.fillText( kind.emoji, cx, cy + bob );
        ctx.restore();
    });
}