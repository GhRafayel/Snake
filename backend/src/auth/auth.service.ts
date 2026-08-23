
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CreateUsersDto } from 'src/dto/create-users.dto';
import { UsersService } from 'src/users/users.service';
import { TokenService } from './token/token.service';
import { SessionService } from './session/session.service';
import { LoginUsersDto } from 'src/dto/login-users.dto';
import { DatabaseService } from 'src/database/database.service';
import  * as bcrypt from "bcrypt"
import { ResetPasswordDto } from 'src/dto/reset-password.dto';
import { ChangePasswordDto } from 'src/dto/ChangePasswordDto.dto';
import { MailService } from 'src/mail/mail.service';
import { codeDto } from 'src/dto/code.dto';
import { PayloadType } from 'src/types/Auth.interface';

@Injectable()
export class AuthService {

    constructor(
        private readonly dbService:         DatabaseService,
        private readonly usersService:      UsersService,
        private readonly tokenService:      TokenService,
        private readonly sessionService:    SessionService,
        private readonly mailService:       MailService
    ) {}

    async me(accessToken: string) {
        const payload : PayloadType | Error = await this.tokenService.verifyAccessToken(accessToken);
        if (payload instanceof Error)
            return payload;

        try {
            const userData = await this.usersService.findOne(payload.userId);
            if (userData)
                return userData
        }
        catch {
            throw new UnauthorizedException('Invalid credentials');
        }
        return payload
    }

    async signUp(body: CreateUsersDto) {
        const	hashedPassword = await bcrypt.hash(body.Password, 10);
		const	newBody = {
			Username: body.Username,
			Email: body.Email,
			Password: hashedPassword,
			resetCode: null,
			codeExpire: null,
			role: Role.PLAYER,
		}
        const newUser = await this.usersService.create(newBody);
        if (!newUser) {
            throw new ConflictException('User already exists');
        }
        const accessToken = await this.createTokenSession(newUser.id);
         return {...accessToken};
    }

    async signIn(body: LoginUsersDto) {
        
        const user = await this.dbService.users.findUnique( { where: { Email: body.Email } } );
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const isMatch = await bcrypt.compare(body.Password, user.Password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const accessToken = await this.createTokenSession(user.id);
        return {...accessToken};
    }

    async sendCode (userId: number, Email: string )
    {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.usersService.update(userId, {
            resetCode : code,
            codeExpire: new Date(Date.now() + 5 * 60 * 100),
        });
        await this.mailService.sendResetCode(Email, code);
        return {userId: userId}
    }

    async reset(body: ResetPasswordDto) {
        const user = await this.dbService.users.findUnique({where: {Email: body.Email}});
        if (!user)
            throw new UnauthorizedException();
        return await this.sendCode(user.id, user.Email);
    }

    async resetCode (body : codeDto) {
        const user = await this.usersService.findById(body.userId);
        if (!user)
            throw new UnauthorizedException('User not found');

        if(user.resetCode !== body.code)
            throw new UnauthorizedException('Wrong code');
        if (!user.codeExpire || user.codeExpire < new Date())
            throw new UnauthorizedException('Code expired');
        const hashedPassword = await bcrypt.hash(body.Password, 10);
        await this.usersService.update(user.id, {
            Password: hashedPassword,
            resetCode: null,
            codeExpire: null,
        })
        return { message: "Password changed successfully" }
    }

    async refresh(refreshToken: string) {

        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token missing');
        }

        const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
        const session = await this.sessionService.findSessionByHash(tokenHash);
        if (!session) {
            throw new UnauthorizedException('Invalid or expired session');
        }
        const newRefreshToken = this.tokenService.generateRefreshToken();
        await this.sessionService.rotateSession(session.id, newRefreshToken);
        const accessToken = await this.tokenService.generateAccessToken(session.userId, session.id);
        return { accessToken, refreshToken: newRefreshToken };
    }

    async logout(sessionId: string) {
        const count = await this.sessionService.deleteSession(sessionId);
        return count;
    }

    async logoutAll(userId: number) {
        const count = await this.sessionService.deleteAllUserSessions(userId);
        return count;
    }
    
    async createTokenSession(userId: number) {
        const refreshToken = this.tokenService.generateRefreshToken();
        const session = await this.sessionService.createSession(userId, refreshToken);
        const accessToken = await this.tokenService.generateAccessToken(userId, session.id);
        return { accessToken, refreshToken };
    }
    
    async changePassword(userId: number, body: ChangePasswordDto) {
        const user = await this.dbService.users.findUnique({
            where: { id: userId }
        });

        if (!user)  throw new UnauthorizedException();
        const isValidPassword = await bcrypt.compare(
            body.OldPassword,
            user.Password
        );
        if (!isValidPassword) throw new UnauthorizedException('Invalid old password');

        await this.sendCode(userId, user.Email);
        return { success: true };
    }

    async changePasswordCode (userId: number, code: string, newPassword : string) {
        const user = await this.dbService.users.findUnique({
            where: { id: userId }
        });
        if (!user)  throw new UnauthorizedException();
        return await this.resetCode({userId, code, Password: newPassword});
    }
    
    async deleteUser(userId: number) {
        await this.logoutAll(userId);
        const res = await this.usersService.remove(userId);
        return res;
    }
}

