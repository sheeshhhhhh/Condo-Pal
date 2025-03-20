import { Body, Controller, Get, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { User, UserJwt } from 'src/lib/decorators/User.decorator';
import { JwtAuthGuard } from 'src/passport/jwt.strategy';
import { CondoPaymentService } from './condo-payment.service';
import { GcashPayment, GcashPaymentVerification, ManualPayment } from './dto/condo-payment.dto';

@Controller('condo-payment')
@UseGuards(JwtAuthGuard)
export class CondoPaymentController {
    constructor(
        private readonly condoPaymentService: CondoPaymentService
    ) {}

    @Get('getBill')
    async getPaymentInformation(@User() user: UserJwt, @Query('condoId') condoId: string) {
        return this.condoPaymentService.getPaymentInformation(user, condoId);
    }

    // GCASH
    @Post('createPayment/Gcash')
    @UseInterceptors(FileInterceptor('gcashPhoto', {
        storage: multer.memoryStorage()
    }))
    async createGcashPayment(@User() user: UserJwt, @Query('condoId') condoId: string, @Body() body: GcashPayment, @UploadedFile() gcashPhoto: Express.Multer.File) {
        return this.condoPaymentService.createGcashPayment(user, condoId, gcashPhoto, body);
    }

    @Get('getPayment/Gcash')
    async getGcashPayment(@Query('condoPaymentId') condoPaymentId: string) {
        return this.condoPaymentService.getGcashPayment(condoPaymentId);
    }

    @Patch('verifyPayment/Gcash')
    async verifyGsachPayment(@User() user: UserJwt, @Query('condoPaymentId') condoPaymentId: string, @Body() body: GcashPaymentVerification) {
        return this.condoPaymentService.verifyGcashPayment(user, condoPaymentId, body);
    }

    // MANUAL
    @Post('createPayment/Manual')
    async createManualPayment(@User() user: UserJwt, @Query('condoId') condoId: string, @Body() body: ManualPayment) {
        return this.condoPaymentService.createManualPayment(user, condoId, body);
    }

    // PAYMONGO
    @Post('createPayment/Paymongo')
    async createPaymongoPayment(@User() user: UserJwt, @Query('condoId') condoId: string) {
        return this.condoPaymentService.createPaymongoPayment(user, condoId)
    }

    @Get('verifyPayment/Paymongo')
    async verifyPaymongoPayment(@User() user: UserJwt, @Query('condoPaymentId') condoPaymentId: string) {
        return this.condoPaymentService.verifyPaymongoPayment(condoPaymentId, user);
    }

    // DASHBOARD
    
    @Get('condoPaymentsSummary')
    async getCondoPaymentsSummary(@User() user: UserJwt) {
        return this.condoPaymentService.getCondoPaymentsSummary(user);
    }

    @Get('condoPaymentsStats')
    async getCondoPaymentsStats(@Query('condoId') condoId: string) {
        return this.condoPaymentService.getCondoPaymentStatistic(condoId);
    }

    @Get('condoPayments')
    async getCondoPaymentsLandLord(@User() user: UserJwt, @Query() query: { search: string, page: string, status: string, paymentType: string, condoId: string | undefined }) {
        return this.condoPaymentService.getCondoPaymentsLandlord(user, query);
    }
}
