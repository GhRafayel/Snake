import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { RequestWithCookiesType } from 'src/types/Auth.interface';

export const Cookie = createParamDecorator((data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithCookiesType>();
    if (!request.cookies)
        throw new InternalServerErrorException('Cookie parser is not configured');

    return data ? request.cookies?.[data] : request.cookies;
});
