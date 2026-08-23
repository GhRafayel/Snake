import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from 'src/database/database.service';
import { RedisService } from '../redis/redis.service';
import { CreateUsersDto } from 'src/dto/create-users.dto';
import { UpdateUserDto } from 'src/dto/updata-users.dto';
import { FriendsService } from 'src/friends/friends.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {

	constructor(
		private readonly databaseService	:	DatabaseService,
		private readonly redisService 		: 	RedisService,
		private readonly friendsService 	:	FriendsService,
		private readonly mailService 		: 	MailService,
	) {}

	async createLanguage(body: Record<string, Prisma.InputJsonValue>) {
		const entries = Object.entries(body ?? {});
		if (!entries.length)
			throw new BadRequestException('No language data provided');
		await this.databaseService.$transaction(
			entries.map(([key, values]) =>
				this.databaseService.translation.upsert({
					where: { key },
					create: { key, values },
					update: { values },
				}),
			),
		);
		return { success: true };
	}

	async getLanguage(key?: string) {
		const translation = await this.databaseService.translation.findUnique({ where: { key: key || 'en' } });
		if (translation)
			return translation.values;
		const fallback = await this.databaseService.translation.findUnique({ where: { key: 'en' } });
		return fallback?.values ?? null;
	}

	async create(body: CreateUsersDto) {

		const res = await this.databaseService.users.create({ data: body});
		await this.databaseService.userStats.create({ data: { Email: body.Email } });
		return res;
	}

	async findByProvider(provider: string, providerId: string) {
		return await this.databaseService.users.findUnique({
			where: { provider_providerId: { provider, providerId } },
		});
	}

	async createOAuthUser(data: { Email: string; Username: string; provider: string; providerId: string }) {
		const res = await this.databaseService.users.create({
			data: {
				Email: data.Email,
				Username: data.Username,
				provider: data.provider,
				providerId: data.providerId,
				role: Role.PLAYER,
			},
		});
		await this.databaseService.userStats.create({ data: { Email: data.Email } });
		return res;
	}

	async getOrCreateBots(count: number) {
		const bots = [];
		for (let i = 1; i <= count; i++) {
			const email = `bot${i}@system.internal`;
			let bot = await this.databaseService.users.findFirst({ where: { Email: email } });
			if (!bot) {
				bot = await this.databaseService.users.create({
					data: {
						Email: email,
						Password: randomUUID(),
						Username: `AI ${i}`,
						isBot: true,
						role: Role.BOT,
					},
				});
			}
			bots.push(bot);
		}
		return bots;
	}

	async findById(userId: number) {
		return await this.databaseService.users.findUnique({
			where: {
			id: userId,
			},
		});
	}

	async search(id: number,  name: string) {
		const userFriends = await this.friendsService.getFriends(id);

		const friendIds = userFriends.map(f => f.id);
		const users = await this.databaseService.users.findMany({
			where: {
				id: { notIn: [id, ...friendIds] },
			},
			select: { id: true, Username: true },
		});
		users.filter((item) =>
              item.Username.toLowerCase().includes(name.toLowerCase())
        )
		return users;
	}

	async searchUsers(query: string) {
		const users = await this.databaseService.users.findMany({
			where: {
				OR: [
					{ Username: { contains: query, mode: 'insensitive' } },
					{ Email: { contains: query, mode: 'insensitive' } },
				],
			},
			select: {
				id: true,
				Username: true,
				Email: true,
				role: true,
				createdAt: true,
			},
		});
		if (users.length > 10) {
			const shuffled = users.sort(() => 0.5 - Math.random());
			return shuffled.slice(0, 10);
		}
		return users;
	}

	async findOneForAdmin(id: number) {
		return await  this.databaseService.users.findUnique({
			where: { id },
			select: {
				id: true,
				Username: true,
				Email: true,
				role: true,
			},
		});
	}

	async findAll(Role?: 'ADMIN' | 'PLAYER') {
		if (Role)
		{
			return this.databaseService.users.findMany( {
				where: { role: Role }
			});
		}
		return await this.databaseService.users.findMany();
	}

	async findOne(id: number) {
		const user = await this.databaseService.users.findUnique(
			{
				where: { id },
				select: {
					id: true,
					Username: true,
					role: true,
					language: true,
					color: true,
					avatar: true,
					theme: true,
					history: {
						select: {
							gamesLost: true,
							gamesWon: true,
							totalScore: true,
						}
					}
				}
			}
		);
		return user;
	}

	async changeLanguage(id: number, body : { language: string})
	{
		return await this.databaseService.users.update({ where: {id, }, data: body, })
	}

	async changeUsername(id: number, body: { Username: string }) {
		const Username = body.Username?.trim();
		if (!Username || Username.length < 3 || Username.length > 40)
			throw new BadRequestException('Username must be between 3 and 40 characters');
		return await this.databaseService.users.update({ where: { id }, data: { Username } });
	}

	async changeColor(id: number, body: { color: string | null }) {
		const res =  await this.databaseService.users.update({ where: { id }, data: { color: body.color } });
		return res;
	}

	async changeAvatar(id: number, body: { avatar: string }) {
		if (!/^[\w.-]+\.(png|jpe?g|gif|webp)$/i.test(body.avatar))
			throw new BadRequestException('Invalid avatar filename');
		return await this.databaseService.users.update({ where: { id }, data: { avatar: body.avatar } });
	}

	async contact(userId: number, message: string) {
		const user = await this.findById(userId);
		if (!user) throw new Error();
		await this.mailService.sendContactMessage(
			{message, Username: user.Username, Email: user.Email}
		);
		return {email: user.Email};
	}

	async update(id: number, updateUserDto: UpdateUserDto) {
		const user = await this.databaseService.users.update(
		{
			where: { id },
			data: updateUserDto,
		});
		return user;
	}

	async theme (userId: number, theme: boolean) {
		const res = await this.databaseService.users.update({
			where: {id: userId},
			data: {theme}
		})
		return res;
	}

	async remove(id: number) {
		const user = await this.databaseService.users.delete(
		{
			where: { id },
		});
		await this.redisService.deleteToken(user.id);
		return user;
	}
}
