import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class FriendsService {

	public constructor(
		private readonly DB: DatabaseService,
		private readonly redis: RedisService,
	) { }

	async sendRequest(senderId: number, receiverId: number) {
		if (senderId === receiverId) {
			throw new BadRequestException('You cannot send a request to yourself');
		}
		const check = await this.DB.friendsRequest.findUnique({
			where: {
				senderId_receiverId: { senderId, receiverId, }
			},
		})
		if (check) {
			if (check.status === 'PENDING')
				throw new BadRequestException('Request already sent');
			if (check.status === 'ACCEPTED')
				throw new BadRequestException('You are friends already');
			if (check.status === 'REJECTED')
				await this.DB.friendsRequest.delete({
					where: { id: check.id },
				});
		}

		const reverse = await this.DB.friendsRequest.findUnique({
			where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } },
		});
		if (reverse?.status === 'PENDING') {
			throw new BadRequestException('The user already sent you a request');
		}
		if (reverse?.status === 'ACCEPTED') {
			throw new BadRequestException('You are friends already');
		}
		if (reverse?.status === 'REJECTED') {
			await this.DB.friendsRequest.delete({
				where: { id: reverse.id },
			});
		}
		const request = await this.DB.friendsRequest.create({
			data: { senderId, receiverId },
			select: { id: true }
		});
		return request;
	}

	async acceptRequest(userId: number, requestId: string) {
		const request = await this.DB.friendsRequest.findUniqueOrThrow({
			where: { id: requestId, },
		})
		if (request.receiverId !== userId) {
			throw new BadRequestException('You are not the receiver of this request');
		}
		if (request.status !== 'PENDING') {
			throw new BadRequestException('Request is not pending');
		}
		await this.DB.friendsRequest.update({
			where: { id: requestId },
			data: { status: 'ACCEPTED' },
		});
		return { success: true };
	}

	async rejectRequest(userId: number, requestId: string) {
		const request = await this.DB.friendsRequest.findUniqueOrThrow({
			where: { id: requestId, },
		})
		if (request.receiverId !== userId) {
			throw new BadRequestException('You are not the receiver of this request');
		}
		if (request.status !== 'PENDING') {
			throw new BadRequestException('Request is not pending');
		}
		await this.DB.friendsRequest.update({
			where: { id: requestId },
			data: { status: 'REJECTED' },
		});
		return { success: true };
	}

	async getFriends(userId: number) {
		const requests = await this.DB.friendsRequest.findMany({
			where: {
				OR: [
					{ senderId: userId },
					{ receiverId: userId },
				],
			},
			include: {
				sender: {
					select: { id: true, Username: true, history: { select: { totalScore: true } } },
				},
				receiver: {
					select: { id: true, Username: true, history: { select: { totalScore: true } } },
				},
			}
		});
		const list = requests.map(r => {
			const friend = r.senderId === userId ? r.receiver : r.sender;
			return {
				id: friend.id,
				Username: friend.Username,
				score: friend.history?.totalScore ?? 0,
				requestId: r.id,
				status: r.status,
				senderId: r.senderId,
			}
		});
		const friends = await Promise.all(
			list.map(async (user) => ({
				...user,
				isOnline: await this.redis.isOnline(user.id),
			})),
		);
		return friends;
	}

	async removeFriend(userId: number, friend: number) {

		const request = await this.DB.friendsRequest.findFirstOrThrow({
			where: {
				status: 'ACCEPTED',
				OR: [
					{ senderId: userId, receiverId: friend },
					{ senderId: friend, receiverId: userId },
				],
			},
		});
		await this.DB.friendsRequest.delete({
			where: { id: request.id },
		});
		return { success: true };
	}

	async incomingRequest(userId: number) {
		const requests = await this.DB.friendsRequest.findMany({
			where: {
				status: 'PENDING',
				receiverId: userId,
			},
			include: {
				sender: {
					select: { id: true, Username: true, history: { select: { totalScore: true } } }
				}
			}
		});
		const users = await Promise.all(
			requests.map(async (request) => ({
				...request,
				sender: {
					id: request.sender.id,
					Username: request.sender.Username,
					score: request.sender.history?.totalScore ?? 0,
					isOnline: await this.redis.isOnline(request.sender.id),
				},
			})),
		);
		return users;
	}

	async cancelRequest(userId: number, receiverId: number) {
		const request = await this.DB.friendsRequest.findFirstOrThrow({
			where: {
				status: 'PENDING',
				senderId: userId,
				receiverId: receiverId,
			},
		});
		await this.DB.friendsRequest.delete({ where: { id: request.id }, });
		return { success: true };
	}
}
