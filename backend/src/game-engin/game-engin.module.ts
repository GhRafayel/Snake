import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { RedisModule } from 'src/redis/redis.module';
import { GameEnginService } from './game-engin.service';
import { SocketModule } from 'src/socket/socket.module';
import { AiOpponentService } from './ai-opponent.service';

@Module({
	imports: [DatabaseModule, RedisModule, forwardRef(() => SocketModule)],
    providers: [GameEnginService, AiOpponentService],
	exports: [GameEnginService],
})
export class GameEnginModule {}
