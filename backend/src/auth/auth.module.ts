import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/database/database.module';
import { SessionModule } from './session/session.module';
import { TokenModule } from './token/token.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getJwtConfig } from './common/configs/jwt.config';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { GoogleStrategy } from './common/strategies/google.strategy';
import { GithubStrategy } from './common/strategies/github.strategy';
import { RedisModule } from 'src/redis/redis.module';
import { UsersModule } from 'src/users/users.module';
import { MailModule } from 'src/mail/mail.modul';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({ inject: [ConfigService], useFactory: getJwtConfig }),
    DatabaseModule, 
    UsersModule, 
    SessionModule, 
    TokenModule, 
    RedisModule,
    MailModule
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GithubStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule { }
