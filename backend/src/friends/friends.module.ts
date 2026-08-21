import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { DatabaseModule } from 'src/database/database.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
    imports: [ DatabaseModule, RedisModule ],
    controllers: [FriendsController],
    providers: [FriendsService],
    exports: [FriendsService]
})
export class FriendsModule { }
