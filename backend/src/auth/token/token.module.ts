import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';

const {JWT_ACCESS_SECRET} = process.env;

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: JWT_ACCESS_SECRET,
      signOptions: { expiresIn: `15m`},
    }),

  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule { }
