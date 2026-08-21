import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from '../token/token.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [TokenModule, DatabaseModule, RedisModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule { }
