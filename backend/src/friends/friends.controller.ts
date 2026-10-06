import { Controller, Post, Body, Get, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { Authorization } from 'src/auth/common/decorators/authorization.decorator';
import { Authorized } from 'src/auth/common/decorators/authorized.decorator';
import { LoggerService } from 'src/logger/logger.service';

@Controller('friends')
export class FriendsController {
	constructor(
    private readonly friendsService: FriendsService,
  ) { }
	private readonly logger = new LoggerService(FriendsController.name);

	@Authorization()
	@Post('request')
	async sendRequest( @Authorized('userId') senderId: number, @Body('receiverId') receiverId: number,) {
		this.logger.log(`Friend request ${senderId} -> ${receiverId}`);
		return this.friendsService.sendRequest(senderId, receiverId);
	}

	@Authorization()
	@Patch('request/:id/accept')
	async acceptRequest( @Authorized('userId') userId: number, @Param("id") requestId: string,) {
		this.logger.log(`User ${userId} accepted friend request ${requestId}`);
		return this.friendsService.acceptRequest(userId, requestId);
	}

	@Authorization()
	@Patch('request/:id/reject')
	async rejectRequest( @Authorized('userId') userId: number, @Param("id") requestId: string) {
		this.logger.log(`User ${userId} rejected friend request ${requestId}`);
		return this.friendsService.rejectRequest(userId, requestId);
	}

	@Authorization()
	@Delete('request')
	async cancelRequest( @Authorized('userId') userId: number, @Body('receiverId') receiverId: number) {
		this.logger.log(`User ${userId} cancelled friend request to ${receiverId}`);
		return this.friendsService.cancelRequest(userId, receiverId);
	}

	@Authorization()
	@Get('')
	async getFriends( @Authorized('userId') userId: number) {
		this.logger.log(`User ${userId} requested friends list`);
		return this.friendsService.getFriends(userId);
	}

	@Authorization()
	@Delete(':friendId')
	async removeFriend( @Authorized('userId') userId: number, @Param('friendId', ParseIntPipe) friendId: number) {
		this.logger.log(`User ${userId} removed friend ${friendId}`);
		return this.friendsService.removeFriend(userId, friendId);
	}

	@Authorization()
	@Get('request/incoming')
	async incomingRequest( @Authorized('userId') userId: number) {
		this.logger.log(`User ${userId} requested incoming friend requests`);
		return this.friendsService.incomingRequest(userId);
	}
}