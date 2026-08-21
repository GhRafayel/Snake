import { Module } from '@nestjs/common';
import { GameRoomController } from './gameRoom.controller';
import { GameRoomService } from './gameRoom.service';
import { DatabaseModule } from 'src/database/database.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [GameRoomController],
  providers: [GameRoomService],
  exports: [GameRoomService],
})
export class GameRoomModule {}
