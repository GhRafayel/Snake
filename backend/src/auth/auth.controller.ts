import { Body, Controller, Post, Delete, Patch, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
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
import { GoogleAuthGuard } from './common/guards/google-auth.guard';
import { GithubAuthGuard } from './common/guards/github-auth.guard';
import type { RequestWithOAuthProfileType } from 'src/types/Auth.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }
  private readonly logger = new LoggerService(AuthController.name);

  @Throttle({ long: { ttl: 60000, limit: 5 } })
  @Post('register')
  async signUp(@Body() dto: CreateUsersDto) {
    this.logger.log(`Register attempt for ${dto.Email}`);
    return await this.authService.signUp(dto);
  }

  @Throttle({ long: { ttl: 60000, limit: 5 } })
  @Post('login')
  async signIn(@Body() dto: LoginUsersDto ) {
    this.logger.log(`Login attempt for ${dto.Email}`);
    return await this.authService.signIn(dto);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string ) {
    this.logger.log('Token refresh requested');
    return await this.authService.refresh(refreshToken);
  }

  @Throttle({ long: { ttl: 60000, limit: 5 } })
  @Post("reset")
  async reset (@Body() body : ResetPasswordDto) {
    this.logger.log(`Password reset requested for ${body.Email}`);
    return await this.authService.reset(body);
  }

  @Throttle({ long: { ttl: 60000, limit: 5 } })
  @Post("resetCode")
  async resetCode (@Body() body : codeDto) {
    this.logger.log('Password reset code submitted');
    return await this.authService.resetCode(body);
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
    return await this.authService.changePassword(userId, body);
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
    const res = await this.authService.deleteUser(userId);
    return { success: true, res };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: RequestWithOAuthProfileType, @Res() res: Response) {
    this.logger.log(`Google OAuth login for ${req.user.email}`);
    const { accessToken, refreshToken } = await this.authService.oauthLogin(req.user);
    this.redirectWithTokens(res, accessToken, refreshToken);
  }

  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubAuth() {}

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req: RequestWithOAuthProfileType, @Res() res: Response) {
    this.logger.log(`GitHub OAuth login for ${req.user.email}`);
    const { accessToken, refreshToken } = await this.authService.oauthLogin(req.user);
    this.redirectWithTokens(res, accessToken, refreshToken);
  }

  private redirectWithTokens(res: Response, accessToken: string, refreshToken: string) {
    const redirectUrl = new URL('/api/auth', process.env.FRONTEND_URL);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('refreshToken', refreshToken);
    res.redirect(redirectUrl.toString());
  }
}
