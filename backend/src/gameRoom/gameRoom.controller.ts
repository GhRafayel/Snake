import { Controller, Body, Post, Get, Delete, Param, Query, ParseIntPipe} from '@nestjs/common';
import { CreatePrivateGameRoom } from '../dto/create-private-gameRoom.dto';
import { GameRoomService } from './gameRoom.service';
import { LoggerService } from 'src/logger/logger.service';

@Controller('gameRoom')
export class GameRoomController {
  constructor(private readonly roomService: GameRoomService) {}
  private readonly logger = new LoggerService(GameRoomController.name);

  @Get()
  findAll(@Query('status') Status?: 'WAITING' | 'PLAYING' | 'FINISHED') {
    this.logger.log(`List game rooms with status filter: ${Status}`);
    return this.roomService.findAll(Status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`Fetch game room ${id}`);
    return this.roomService.findOne(id);
  }

  @Get("create/:id")
  async createRoom(@Param('id', ParseIntPipe) id:  number) {
    this.logger.log(`Create game room for user ${id}`);
    return this.roomService.createRoom(id);
  }

  @Post('private')
  async createPrivateRoom(@Body() obj: CreatePrivateGameRoom) {
    this.logger.log('Create private game room');
    return this.roomService.createPrivateRoom(obj);
  }

  @Delete(':id')
  async deleteRoom(@Param('id') id: string) {
    this.logger.log(`Delete game room ${id}`);
    return await this.roomService.deleteRoom(id);
  }
}
