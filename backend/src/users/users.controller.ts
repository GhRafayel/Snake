import { Controller, Query, Post, Get, Body, Patch, Param, Delete, ParseIntPipe, ValidationPipe, Ip, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { UpdateUserDto } from '../dto/updata-users.dto';
import { LoggerService } from 'src/logger/logger.service';
import { Authorized } from 'src/auth/common/decorators/authorized.decorator';
import { Authorization } from 'src/auth/common/decorators/authorization.decorator';
import { AdminGuard } from 'src/admin/guards/admin.guard';
import { Prisma } from '@prisma/client';
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}
  private readonly logger = new LoggerService(UsersController.name);

  @Authorization()
  @Get("search/:name")
  search( @Authorized('userId') userId: number, @Param('name') name: string) {
    this.logger.log(`User ${userId} searched for "${name}"`);
    return this.userService.search(userId, name);
  }

  @SkipThrottle({ short: true, long: true })
  @Get("me")
  @Authorization()
  async me(@Authorized('userId') userId: number) {
    this.logger.log(`User ${userId} requested own profile`);
    return await this.userService.findOne(userId);
  }

  @Post("create-language")
  @Authorization()
  @UseGuards(AdminGuard)
  async createLanguage(@Body() body: Record<string, Prisma.InputJsonValue>) {
    this.logger.log(`Seeding language translations: ${Object.keys(body).join(', ')}`);
    return await this.userService.createLanguage(body);
  }

  @Get("language/:key")
  async getLanguage(@Param('key') key: string) {
    return await this.userService.getLanguage(key);
  }

// this route for testing users will be delete
  @Get()
  async findAll(@Ip() ip: string, @Query('role') role?: 'ADMIN' | 'PLAYER') {
    this.logger.log(`IP ${ip} requested user list with role filter: ${role}`);
    return await this.userService.findAll(role);
  }

  @Get(':id')
  async findOne( @Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetch user ${id}`);
    return await this.userService.findOne(id);
  }

  @Post("contact")
  @Authorization()
  async contact(@Authorized("userId") userId : number, @Body("message") message: string)
  {
    this.logger.log(`User ${userId} submitted a contact message`);
    return await this.userService.contact(userId, message);
  }

  @Patch("change-language")
  @Authorization()
  async changeLanguage(@Authorized("userId") userId: number, @Body() body: { language: string }) {
    this.logger.log(`User ${userId} changed language to ${body.language}`);
    return await this.userService.changeLanguage(userId, body);
  }
  @Patch("change-theme")
  @Authorization()
  async theme(@Authorized("userId") userId: number, @Body("theme")  theme: boolean) {
    this.logger.log(`User ${userId} changed theme `);
    return await this.userService.theme(userId, theme);
  }

  @Patch("accept-terms")
  @Authorization()
  async acceptTerms(@Authorized("userId") userId: number) {
    this.logger.log(`User ${userId} accepted the Privacy Policy and Terms of Service`);
    return await this.userService.acceptTerms(userId);
  }

  @Patch("change-username")
  @Authorization()
  async changeUsername(@Authorized("userId") userId: number, @Body() body: { Username: string }) {
    this.logger.log(`User ${userId} changed username to ${body.Username}`);
    return await this.userService.changeUsername(userId, body);
  }

  @Patch("change-color")
  @Authorization()
  async changeColor(@Authorized("userId") userId: number, @Body() body: { color: string }) {
    this.logger.log(`User ${userId} changed snake color to ${body.color}`);
    return await this.userService.changeColor(userId, body);
  }

  @Patch("change-avatar")
  @Authorization()
  async changeAvatar(@Authorized("userId") userId: number, @Body() body: { avatar: string }) {
    this.logger.log(`User ${userId} changed avatar to ${body.avatar}`);
    return await this.userService.changeAvatar(userId, body);
  }

  @Patch(':id')
  async update( @Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) updatedUser: UpdateUserDto ) {
    this.logger.log(`Update user ${id}`);
    return await this.userService.update(id, updatedUser);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.warn(`Delete user ${id}`);
    return await this.userService.remove(id);
  }
}
