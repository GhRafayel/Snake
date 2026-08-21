import { Controller, Get, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/common/guards/jwt-auth.guard';
import { AdminUpdateUserDto } from 'src/dto/admin-update-user.dto';
import { LoggerService } from 'src/logger/logger.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  private readonly logger = new LoggerService(AdminController.name);

  @Get('users')
  searchUsers(@Query('q') q: string) {
    this.logger.log(`Admin search users with query: ${q}`);
    return this.adminService.searchUsers(q);
  }

  @Get('users/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Admin fetch user ${id}`);
    return this.adminService.findOne(id);
  }

  @Put('users/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) updateUserDto: AdminUpdateUserDto) {
    this.logger.log(`Admin update user ${id}`);
    return this.adminService.update(id, updateUserDto);
  }

  @Delete('users/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.warn(`Admin delete user ${id}`);
    return this.adminService.remove(id);
  }
}
