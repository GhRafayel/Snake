import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUserType } from 'src/types/Auth.interface';

export const Authorized = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<RequestWithUserType>();
        if (!request.user)
            throw new Error();

        if (data) {
            return request.user[data as keyof typeof request.user];
        }

        return request.user;
    },
);
