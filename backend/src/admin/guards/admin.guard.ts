import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { RequestWithUserType } from 'src/types/Auth.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly databaseService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUserType>();
    if (!request.user)
      throw new Error();

    const user = await this.databaseService.users.findUnique({
      where: { id: request.user.userId },
      select: { role: true },
    });

    if (!user || user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
