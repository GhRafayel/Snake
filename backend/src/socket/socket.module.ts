import { Module, forwardRef } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { GameRoomService } from 'src/gameRoom/gameRoom.service';
import { GameRoomModule } from 'src/gameRoom/gameRoom.module';
import { DatabaseModule } from 'src/database/database.module';
import { RedisModule } from 'src/redis/redis.module';
import { TokenModule } from 'src/auth/token/token.module';
import { UsersModule } from 'src/users/users.module';
import { GameEnginModule } from 'src/game-engin/game-engin.module';
@Module({
  imports: [GameRoomModule, DatabaseModule, TokenModule, RedisModule, UsersModule, forwardRef(() => GameEnginModule)],
  providers: [SocketGateway, SocketService, GameRoomService],
  exports: [SocketGateway],
})
export class SocketModule {}
