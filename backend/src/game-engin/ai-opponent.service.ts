import { Injectable } from "@nestjs/common";
import { Position, Direction, GameState, Snake} from "src/types/interface";

function cellToDir(cell: Position, head: Position) : Direction{
	if (cell.x > head.x)
		return 'RIGHT';
	if (cell.x < head.x)
		return 'LEFT';
	if (cell.y < head.y)
		return 'UP';
	return 'DOWN';
}

function toString(pos: Position): string{
	const cell = `${pos.x},${pos.y}`;
	return cell;
}

function toPos(cell: string): Position{
	const parts = cell.split(',');
	const pos: Position = {
		x: Number(parts[0]),
		y: Number(parts[1]),
	}
	return pos;
}

function validCell(map: string[][], check: Position): boolean{
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

function getNeighbours(cur: Position): Position[]{
	const neighbours: Position[] = [
		{x: cur.x - 1,	y: cur.y},
		{x: cur.x + 1,	y: cur.y},
		{x: cur.x,		y: cur.y + 1},
		{x: cur.x, 		y: cur.y -1},
	];
	return neighbours;
}

function goReverse(parent: Map<string, string | null>, food: string, head: string, map: string[][]): Position{
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

function nextRandom(head: Position, map: string[][]) : Position{
	for (const next of getNeighbours(head)){
		if (validCell(map, next))
			return next;
	}
	const invalid: Position = {x: head.x - 1,	y: head.y};
	return invalid;
}

function bfs(head: Position, map: string[][]): Position{
	const queue: Position[] = [head];
	const visited = new Set<string>();
	const parent = new Map<string, string | null>();
	let next: Position = {x:0, y:0};
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
	let nextPos: Position;
	if (foodFound)
		nextPos = goReverse(parent, toString(next), toString(head), map);
	else
		nextPos = nextRandom(head, map);
	return nextPos;
}

@Injectable()
export class AiOpponentService{
	
	createMap(game: GameState) : string[][]{
		let map: string[][] = Array.from({ length: game.gridWidth}, () => Array(game.gridHeight).fill('0'));
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

	newBotDirection(snake: Snake, map: string[][]): Direction{
		const nextCell = bfs(snake.body[0], map);
		const dir = cellToDir(nextCell, snake.body[0]);
		
		return dir;
	}

}