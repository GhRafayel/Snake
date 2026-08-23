import { Injectable } from "@nestjs/common";
import { PositionType, DirectionType, GameStateType, SnakeType} from "src/types/Game.engin.interface";

function cellToDir(cell: PositionType, head: PositionType) : DirectionType{
	if (cell.x > head.x)
		return 'RIGHT';
	if (cell.x < head.x)
		return 'LEFT';
	if (cell.y < head.y)
		return 'UP';
	return 'DOWN';
}

function toString(pos: PositionType): string{
	const cell = `${pos.x},${pos.y}`;
	return cell;
}

function toPos(cell: string): PositionType{
	const parts = cell.split(',');
	const pos: PositionType = {
		x: Number(parts[0]),
		y: Number(parts[1]),
	}
	return pos;
}

function validCell(map: string[][], check: PositionType): boolean{
	const height = map[0].length;
	const width = map.length;
	
	if (check.x < 0 || check.y < 0)
		return false;
	if (check.x >= width || check.y >= height)
		return false;

	if (map[check.x][check.y] === '1')
		return false;

	return true;
}

function getNeighbours(cur: PositionType): PositionType[]{
	const neighbours: PositionType[] = [
		{x: cur.x - 1,	y: cur.y},
		{x: cur.x + 1,	y: cur.y},
		{x: cur.x,		y: cur.y + 1},
		{x: cur.x, 		y: cur.y -1},
	];
	return neighbours;
}

function goReverse(parent: Map<string, string | null>, food: string, head: string, map: string[][]): PositionType{
	let cur: string = food;
	while (true){
		const next = parent.get(cur);
		if (!next)
			return (nextRandom(toPos(head), map));
		if (next === head)
			return toPos(cur);
		cur = next;
	}
}

function nextRandom(head: PositionType, map: string[][]) : PositionType{
	for (const next of getNeighbours(head)){
		if (validCell(map, next))
			return next;
	}
	const invalid: PositionType = {x: head.x - 1,	y: head.y};
	return invalid;
}

function bfs(head: PositionType, map: string[][]): PositionType{
	const queue: PositionType[] = [head];
	const visited = new Set<string>();
	const parent = new Map<string, string | null>();
	let next: PositionType = {x:0, y:0};
	let foodFound: boolean = false;
	let start = 0;

	while(start < queue.length && !foodFound){
		const cur = queue[start];
		start++;
		const cell = toString(cur);
		if (visited.has(cell))
			continue;
		visited.add(cell);
		for (next of getNeighbours(cur)){
			if (!validCell(map, next))
				continue;
			const nextString = toString(next);
			if (!parent.has(nextString)){
				parent.set(nextString, cell);
				queue.push(next);
			}

			if (map[next.x][next.y] === 'F'){
				foodFound = true;
				break;
			}
		}
	}
	let nextPos: PositionType;
	if (foodFound)
		nextPos = goReverse(parent, toString(next), toString(head), map);
	else
		nextPos = nextRandom(head, map);
	return nextPos;
}


@Injectable()
export class AiOpponentService{
	
	createMap(game: GameStateType) : string[][]{
		let map: string[][] = Array.from({ length: game.gridWidth}, () => Array<string>(game.gridHeight).fill('0'));
		for (const snake of game.snakes){
			for (const pos of snake.body){
				map[pos.x][pos.y] = '1';
			}
		}
		for (const food of game.food){
			if (!food.eaten)
				map[food.position.x][food.position.y] = 'F';
		}
		return map;
	}

	newBotDirection(snake: SnakeType, map: string[][]): DirectionType{
		const nextCell = bfs(snake.body[0], map);
		const dir = cellToDir(nextCell, snake.body[0]);
		
		return dir;
	}

}