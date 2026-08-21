import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { AdminUpdateUserDto } from 'src/dto/admin-update-user.dto';
import { UsersService } from 'src/users/users.service';
import { DatabaseService } from 'src/database/database.service';
import { LoggerService } from 'src/logger/logger.service';
import { LanguageSeed } from './seed/seed-translations';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new LoggerService(AdminService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly databaseService: DatabaseService,
  ) {}

  async onModuleInit() {
    const count = await this.databaseService.translation.count();
    if (count > 0) return;

    await this.databaseService.$transaction(
      Object.entries(LanguageSeed).map(([key, values]) =>
        this.databaseService.translation.create({
          data: { key, values: values as Prisma.InputJsonValue },
        }),
      ),
    );
    this.logger.log(`Seeded translations: ${Object.keys(LanguageSeed).join(', ')}`);
  }

  async searchUsers(query: string) {
    if (query === '')
      return this.usersService.searchUsers(query ?? '');
    const users = await this.usersService.findAll();
    return users.filter((item) => item.Username.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  }

  findOne(id: number) {
    return this.usersService.findOneForAdmin(id);
  }

  async update(id: number, updateUserDto: AdminUpdateUserDto) {
    const user = await this.usersService.findById(id);
    if (!user || user.role === "ADMIN") throw new Error();
    if (updateUserDto.Password) {
      updateUserDto.Password = await bcrypt.hash(updateUserDto.Password, 10);
    }
    return this.usersService.update(id, updateUserDto);
  }

  remove(id: number) {
    
    return this.usersService.remove(id);
  }
}
