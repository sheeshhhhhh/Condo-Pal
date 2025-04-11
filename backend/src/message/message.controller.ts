import { Body, Controller, Get, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from 'src/passport/jwt.strategy';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { User, UserJwt } from 'src/lib/decorators/User.decorator';

@Controller('message')
@UseGuards(JwtAuthGuard)
export class MessageController {
    constructor(
        private readonly messageService: MessageService,
    ) {}

    @Post("send-message")
    @UseInterceptors(FileInterceptor('attachments', {
        storage: multer.memoryStorage(),
    }))
    async sendMessageWithFile(@Query() query: { leaseAgreementId: string, receiverId: string }, @User() user: UserJwt,
    @Body() body: any, @UploadedFiles() attachments: Array<Express.Multer.File>) {
        return this.messageService.createMessageWithFile(query, user, body, attachments);
    }

    // need landlord guard
    @Get("getConversationListLandlord")
    async getActiveConversationListLandlord(@User() user: UserJwt) {
        return this.messageService.getActiveConversationListLandlord(user);
    }

    // need tenant guard
    @Get("getConversationListTenant")
    async getActiveConversationListTenant(@User() user: UserJwt) {
        return this.messageService.getActiveConversationListTenant(user);
    }

    @Get("getMessages")
    async getMessages(@Query() query: { leaseAgreementId: string, cursor?: string }, @User() user: UserJwt) {
        return this.messageService.getMessages(query, user);
    }
}
