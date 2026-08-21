import { Body, Controller, Post, Delete, Patch } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CreateUsersDto } from 'src/dto/create-users.dto';
import { LoginUsersDto } from 'src/dto/login-users.dto';
import { Authorization } from './common/decorators/authorization.decorator';
import { Authorized } from './common/decorators/authorized.decorator';
import { ResetPasswordDto } from 'src/dto/reset-password.dto';
import { ChangePasswordDto } from 'src/dto/ChangePasswordDto.dto';
import { codeDto } from 'src/dto/code.dto';
import { LoggerService } from 'src/logger/logger.service';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }
  private readonly logger = new LoggerService(AuthController.name);

  @Throttle({ long: { ttl: 60000, limit: 5 } })
  @Post('register')
  signUp(@Body() dto: CreateUsersDto) {
    this.logger.log(`Register attempt for ${dto.Email}`);
    return this.authService.signUp(dto);
  }

  @Throttle({ long: { ttl: 60000, limit: 5 } })
  @Post('login')
  signIn(@Body() dto: LoginUsersDto ) {
    this.logger.log(`Login attempt for ${dto.Email}`);
    return this.authService.signIn(dto);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string ) {
    this.logger.log('Token refresh requested');
    return this.authService.refresh(refreshToken);
  }

  @Throttle({ long: { ttl: 60000, limit: 5 } })
  @Post("reset")
  reset (@Body() body : ResetPasswordDto) {
    this.logger.log(`Password reset requested for ${body.Email}`);
    return this.authService.reset(body);
  }

  @Throttle({ long: { ttl: 60000, limit: 5 } })
  @Post("resetCode")
  resetCode (@Body() body : codeDto) {
    this.logger.log('Password reset code submitted');
    return this.authService.resetCode(body);
  }

  @Delete('logout')
  @Authorization()
  async logout(@Authorized('sessionId') sessionId: string ) {
    this.logger.log(`Logout for session ${sessionId}`);
    const count = await this.authService.logout(sessionId);
    return { success: true, count };
  }

  @Patch('change-password')
  @Authorization()
  async changePassword( @Authorized('userId') userId: number, @Body() body: ChangePasswordDto ) {
    this.logger.log(`Change password for user ${userId}`);
    return this.authService.changePassword(userId, body);
  }

  @Patch("change-password-code")
  @Authorization()
  async changePasswordCode( @Authorized('userId') userId: number, @Body()  body:{code: string, newPassword : string} ) {
    this.logger.log(`Change password via code for user ${userId}`);
    return await this.authService.changePasswordCode(userId, body.code, body.newPassword);
  }

  @Post('logout-all')
  @Authorization()
  async logoutAll( @Authorized('userId') userId: string ) {
    this.logger.log(`Logout all sessions for user ${userId}`);
    const count = await this.authService.logoutAll(Number(userId));
    return { success: true, count };
  }

  @Delete("delete")
  @Authorization()
  async deleteUser (@Authorized('userId') userId: number) {
    this.logger.warn(`Delete account for user ${userId}`);
    const res = this.authService.deleteUser(userId);
    return { success: true, res };
  }
}
