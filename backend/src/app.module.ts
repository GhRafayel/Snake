import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from './logger/logger.module';
import { GameRoomModule } from './gameRoom/gameRoom.module';
import { RedisModule } from './redis/redis.module';
import { SocketService } from './socket/socket.service';
import { SocketModule } from './socket/socket.module';
import { FriendsModule } from 'src/friends/friends.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.modul';
import { GameEnginModule} from './game-engin/game-engin.module';
import { AdminModule } from './admin/admin.module';
@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    ConfigModule.forRoot( {  isGlobal: true, expandVariables: true } ),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3, },
      { name: 'long', ttl: 60000, limit: 100, },
    ]),
    LoggerModule,
    GameRoomModule,
    RedisModule,
    SocketModule,
    FriendsModule,
    AuthModule,
    MailModule,
    GameEnginModule,
    FriendsModule,
    AdminModule
  ],
  providers: [SocketService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
