
import { GameType, SnakeType, DrawGameParamsType } from "@/src/types/GameTypes/GameTypes";
import { getLeaderSnake } from "./leaderboard";
import { getTongueExtend, drawSnakeTongue, drawCrown, helperForEach} from "./DrawGameHelper";
import { getGridCanvas } from "./DrawCanvasHelper";
import { drawSnakeHelper, drawSnakeHeadEyes} from "./DrawSnakeHelper";

export const DEFAULT_STEP = 150 / 1000;
export const CELL = 20;
export const SNAKE_SCALE = 1.3;
export const WORLD_MARGIN = CELL / 2;

// Draw snakes
function drawSnake (ctx:CanvasRenderingContext2D , snakes: SnakeType[], prev: GameType | null,  alpha: number, step: boolean) {

    const crownUserId = getLeaderSnake(snakes)?.userId ?? null;

    for (const snake of snakes) {
        if (snake.alive === false) continue;
        if (!snake.body || snake.body.length === 0) continue;

        const prevSnake = prev?.snakes.find( (s : SnakeType) => String(s.userId) === String(snake.userId));
        const headSeg = snake.body[0];
        const prevHeadSeg = prevSnake?.body[0] ?? headSeg;

        if (prevHeadSeg.x < headSeg.x) {
            snake.direction = "RIGHT";
        } else if (prevHeadSeg.x > headSeg.x) {
            snake.direction = "LEFT";
        } else if (prevHeadSeg.y < headSeg.y) {
            snake.direction = "DOWN";
        } else if (prevHeadSeg.y > headSeg.y) {
            snake.direction = "UP";
        }

        ctx.save();
        const head = drawSnakeHelper(ctx, snake, prevSnake, alpha, step);
        ctx.restore();
        if (!head) continue;
        const { headRenderX, headRenderY } = head;
        ctx.save();
        ctx.translate( (headRenderX + CELL / 2), (headRenderY + CELL / 2));
        ctx.scale( SNAKE_SCALE, SNAKE_SCALE );
        ctx.translate( -(headRenderX + CELL / 2), -(headRenderY + CELL / 2));

        const tongueExtend = getTongueExtend(snake.userId, performance.now());
        drawSnakeTongue(ctx, headRenderX, headRenderY, snake.direction, tongueExtend);
        drawSnakeHeadEyes(ctx, headRenderX, headRenderY, snake.direction);
        if ( String(snake.userId) === String(crownUserId)) {
            drawCrown( ctx, headRenderX, headRenderY );
        }
        ctx.restore();
    }
}

// Main renderer
export function drawGame({ ctx, curr, prev, alpha, step, screen, myUserId }: DrawGameParamsType) {
    const snakes = curr.snakes;
    const food = curr.food;
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = screen;
    const WORLD_WIDTH = curr.gridWidth * CELL;
    const WORLD_HEIGHT = curr.gridHeight * CELL;
    const mySnake = snakes.find( (s) => String(s.userId) === String(myUserId)  );

    if (!mySnake || mySnake.body.length === 0) {
        ctx.clearRect( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
        return;
    }
    const scale = Math.min( SCREEN_WIDTH / (WORLD_WIDTH + WORLD_MARGIN * 2), SCREEN_HEIGHT / (WORLD_HEIGHT + WORLD_MARGIN * 2));
    ctx.clearRect( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
    const background = ctx.createLinearGradient( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
    background.addColorStop( 0, "#101417" );
    background.addColorStop( 1, "#1c2226" );
    ctx.fillStyle = background;
    ctx.fillRect( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
    ctx.save();
    ctx.scale( scale, scale );
    ctx.translate( WORLD_MARGIN, WORLD_MARGIN );
    ctx.drawImage( getGridCanvas( WORLD_WIDTH, WORLD_HEIGHT ), 0, 0 );
    drawSnake(ctx, snakes, prev, alpha, step);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${CELL + 8}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", serif`;
    helperForEach( food, ctx, WORLD_WIDTH, WORLD_HEIGHT, (CELL + 8) / 2);
    ctx.restore();
}