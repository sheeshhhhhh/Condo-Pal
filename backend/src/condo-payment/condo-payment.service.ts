import { Injectable, NotFoundException } from '@nestjs/common';
import { CondoPaymentType, GcashPaymentStatus, Prisma } from '@prisma/client';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { UserJwt } from 'src/lib/decorators/User.decorator';
import { PaymongoService } from 'src/paymongo/paymongo.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GcashPayment, GcashPaymentVerification, ManualPayment } from './dto/condo-payment.dto';

@Injectable()
export class CondoPaymentService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly fileUploadService: FileUploadService,
        private readonly paymongoService: PaymongoService,
    ) {}

    private getBillingMonthOfDate(date: Date) {
        const month = date.getMonth() + 1; // base 1 means january is 1
        const year = date.getFullYear();

        return `${month.toString().padStart(2, '0')}-${year.toString()}`;
    }

    private async getBillingMonth(condoId: string, userId: string) {
        const [latestPayment, tenantLease] = await Promise.all([
            this.prisma.condoPayment.findFirst({
                where: {
                    AND: [
                        { condoId: condoId },
                        { OR: [ { tenantId: userId }, { condo: { ownerId: userId } } ] }
                    ]
                },
                select: { billingMonth: true },
                orderBy: { payedAt: 'desc' }, // getting the most recent payment
            }),
            this.prisma.leaseAgreement.findFirst({
                where: { 
                    AND: [
                        { condoId: condoId },
                        { OR: [ { condo: { ownerId: userId } }, { tenantId: userId }, ]}
                    ],
                },
                select: { leaseStart: true, due_date: true }
            })
        ])
        
        if(!tenantLease) {
            throw new NotFoundException("Lease not found for tenant")
        }

        const leaseStartDate = new Date(tenantLease.leaseStart);
        let billingMonth: string;

        if(!latestPayment) {
            // First-time payer: Use lease start month as the first billing month
            billingMonth = this.getBillingMonthOfDate(leaseStartDate);
            const dueDate = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${tenantLease.due_date}`;

            return { billingMonth, dueDate }
        }

        const lastBillingMonth = latestPayment.billingMonth;
        const [lastMonth, lastYear] = lastBillingMonth.split('-')
        .map((data) => Number(data)) // parsing to number

        // just get the next month and if it's 13(means it's january) 
        // increase year number and back to 1 in next Month(which means it's january)
        let nextMonth = lastMonth + 1;
        let nextYear = lastYear;
        if(nextMonth > 12) {
            nextMonth = 1; 
            nextYear += 1;
        }

        // TODO LATER: should also find out if it's an advanced payment
        billingMonth = `${nextMonth.toString().padStart(2, '0')}-${nextYear.toString()}`;
        const dueDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${tenantLease.due_date}`;

        return { billingMonth, dueDate };
    }

    async getTotalPayment(condoId: string, user: UserJwt) {
        const billingMonth = await this.getBillingMonth(condoId, user.id); 
        const [month, year] = billingMonth.billingMonth.split('-').map((data) => Number(data));

        const startOfMonth = new Date(year, month - 1, 1);
        
        const endOfMonth = new Date(year, month, 0); // 0 for last day of that month (dynamically)
        endOfMonth.setHours(23, 59, 59, 999);

        const [getCondoPayment, getAdditionalCost] = await Promise.all([
            this.prisma.condo.findUnique({
                where: { id: condoId },
                select: { rentAmount: true }
            }),
            // as of now we don't have penalties so just maintenance  (all where tenat is responble for payment)
            this.prisma.maintenance.aggregate({
                _sum: { totalCost: true },
                where: {
                    condoId: condoId,
                    paymentResponsibility: 'TENANT',
                    completionDate: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                }
            })
        ])
        
        if(!getCondoPayment) {
            throw new NotFoundException('condo not found')
        }

        return {
            rentCost: getCondoPayment.rentAmount,
            additionalCost: getAdditionalCost._sum.totalCost || 0,
            totalCost: getCondoPayment.rentAmount + (getAdditionalCost._sum.totalCost || 0),
            ...billingMonth,
        }
    }

    async getPaymentInformation(user: UserJwt, condoId: string) {
        // we need to know what month he or she is paying
        const [condoInfo, getBill] = await Promise.all([
            this.prisma.condo.findFirst({
                where: { AND: [
                    { id: condoId },
                    {
                        OR: [
                            { tenantId: user.id },
                            { ownerId: user.id },
                        ]
                    }
                ]},
                select: { 
                    id: true, name: true, address: true, photo: true, 
                    tenant: { select: { id: true, name: true } },
                    owner: { select: { id: true, name: true, profile: true } }
                }
            }),
            this.getTotalPayment(condoId, user)
        ])
        
        if(!condoInfo) {
            throw new NotFoundException('condo not found')
        }

        return {
            ...condoInfo,
            ...getBill,
        }
    }

    // GCASH PAYMENT
    async createGcashPayment(user: UserJwt, condoId: string, gcashPhoto: Express.Multer.File, body: GcashPayment) {
        const gcashUrl = (await this.fileUploadService.upload(gcashPhoto)).secure_url;
        const billingMonth = await this.getBillingMonth(condoId, user.id);

        const createPaymentGcash = await this.prisma.condoPayment.create({
            data: {
                type: CondoPaymentType.GCASH,
                rentCost: parseInt(body.rentCost),
                additionalCost: parseInt(body.additionalCost),
                totalPaid: parseInt(body.totalPaid),
                condoId: condoId,
                tenantId: user.id,

                receiptImage: gcashUrl,
                gcashStatus: 'PENDING',
                isVerified: false,

                billingMonth: billingMonth.billingMonth
            }
        })

        return createPaymentGcash
    }

    async getGcashPayment(condoPaymentId: string) {
        const gcashPayment =  await this.prisma.condoPayment.findFirst({
            where: {
                id: condoPaymentId
            },
            select: {
                id: true,
                type: true,
                rentCost: true,
                additionalCost: true,
                totalPaid: true,
                condo: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        photo: true,
                        tenant: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                receiptImage: true,
                isVerified: true,
                gcashStatus: true,

                billingMonth: true,
                payedAt: true
            }
        })

        if(!gcashPayment) throw new NotFoundException('gcashPayment not found')

        return gcashPayment
    }

    async verifyGcashPayment(user: UserJwt, condoPaymentId: string, body: GcashPaymentVerification) {
        const isVerified = body.gcashStatus === 'APPROVED';
        const isPaid = isVerified; // same thing but this is used for paymongo
        
        const updatePayment = await this.prisma.condoPayment.update({
            where: {
                id: condoPaymentId
            },
            data: {
                isVerified,
                isPaid,
                gcashStatus: body.gcashStatus
            }
        })

        return updatePayment
    }

    // MANUAL PAYMENT // only landlord are allowed
    async createManualPayment(user: UserJwt, condoId: string, body: ManualPayment) {
        const getCondo = await this.prisma.condo.findUnique({ 
            where: { id: condoId },
            select: { tenantId: true } 
        })

        if(!getCondo) throw new NotFoundException('condo not found!')

        if(!getCondo.tenantId) throw new NotFoundException('there is no tenant!')

        const billingMonth = await this.getBillingMonth(condoId, getCondo.tenantId);

        const createManualPayment = await this.prisma.condoPayment.create({
            data: {
                type: CondoPaymentType.MANUAL,
                condoId: condoId,
                rentCost: body.rentCost,
                additionalCost: body.additionalCost,
                totalPaid: body.totalPaid,
                isPaid: true,
                tenantId: getCondo.tenantId,

                billingMonth: billingMonth.billingMonth
            }
        })

        return createManualPayment;
    }

    // PAYMONGO
    async createPaymongoPayment(tenant: UserJwt, condoId: string) {
        const getCondo = await this.prisma.condo.findUnique({
            where: {
                id: condoId,
                tenantId: tenant.id
            },
            select: { name: true, photo: true, address: true, tenant: { select : { name: true } } }
        })

        if(!getCondo) throw new NotFoundException('condo not found!');

        const totalPayment = await this.getTotalPayment(condoId, tenant);

        const createCondoPayment = await this.prisma.$transaction(async txprisma => {
            
            const condoPayment = await txprisma.condoPayment.create({
                data: {
                    type: CondoPaymentType.PAYMONGO,
                    condoId: condoId,
                    tenantId: tenant.id,
                    rentCost: totalPayment.rentCost,
                    additionalCost: totalPayment.additionalCost,
                    totalPaid: totalPayment.totalCost,

                    billingMonth: totalPayment.billingMonth
                }
            })

            const title = `Monthly Rent and Additional Cost Payment for the condo "${getCondo.name}"`;

            const createPaymentLink = await this.paymongoService.createCondoPayment(
                totalPayment.rentCost, totalPayment.additionalCost, title, condoPayment.id, condoId
            )

            // updating the linkId
            await txprisma.condoPayment.update({
                where: {
                    id: condoPayment.id
                },
                data: {
                    linkId: createPaymentLink.id
                }
            })

            return createPaymentLink
        })

        return createCondoPayment;
    }

    async verifyPaymongoPayment(condoPaymentId: string, user: UserJwt) {
        const getSessionId = await this.prisma.condoPayment.findUnique({
            where: {
                id: condoPaymentId
            },
            select: {
                linkId: true // checkout_sessionId
            }
        })

        if(!getSessionId || !getSessionId.linkId) throw new NotFoundException({ name: 'CondoPayment', message: 'failed to find condo payment' })
            
        const getPayment = await this.paymongoService.getPaymentLink(getSessionId.linkId)
        const status = this.paymongoService.getStatusCheckoutSession(getPayment)

        if(status !== 'paid') {
            return {
                name: "Condo Payment",
                status: status || "pending",
                linkId: getSessionId.linkId,
                checkouturl: getPayment.attributes.checkout_url
            }
        }

        // update to isPaid to the database
        await this.prisma.condoPayment.update({
            where: {
                id: condoPaymentId,
                tenantId: user.id
            },
            data: {
                isPaid: true
            }
        })

        return {
            name: "Condo Payment",
            status: status,
            linkId: getSessionId,
            checkouturl: getPayment.attributes.checkout_url
        }
    }

    // LANDLORD DASHBOARD
    async getCondoPaymentsSummary(user: UserJwt) {
        const getCondoIds = await this.prisma.condo.findMany({
            where: { ownerId: user.id },
            select: { id: true }
        });
        const condoIds = getCondoIds.flatMap((condo) => condo.id)

        const now = new Date();
        const currMonth = `${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
        const prevMonth = new Date(now.setMonth(now.getMonth() - 1));
        const prevMonthFormatted = `${String(prevMonth.getMonth() + 1).padStart(2, "0")}-${prevMonth.getFullYear()}`;
        
        const [allPayments, currMonthPayments, prevMonthPayments, pendingVerifications] = await Promise.all([
            this.prisma.condoPayment.aggregate({ where: { condoId: { in: condoIds } }, _sum: { totalPaid: true } }),
            this.prisma.condoPayment.aggregate({ where: { condoId: { in: condoIds }, billingMonth: currMonth }, _sum: { totalPaid: true } }),
            this.prisma.condoPayment.aggregate({ where: { condoId: { in: condoIds }, billingMonth: prevMonthFormatted }, _sum: { totalPaid: true } }),
            this.prisma.condoPayment.aggregate({ where: { condoId: { in: condoIds }, gcashStatus: "PENDING", type: 'GCASH' }, _sum: { totalPaid: true } })
        ]);

        return {
            all: allPayments._sum.totalPaid || 0,
            currentMonth: {
                total: currMonthPayments._sum.totalPaid || 0,
                month: currMonth
            },
            previousMonth: {
                total: prevMonthPayments._sum.totalPaid || 0,
                month: prevMonthFormatted,
            },
            pendingVerification: pendingVerifications._sum.totalPaid || 0,
        }
    }

    async getCondoPaymentStatistic(condoId: string) {
        const [payments, landlordMaintenance] = await Promise.all([
            this.prisma.condoPayment.findMany({
                where: { condoId },
                select: { id: true, billingMonth: true, additionalCost: true, totalPaid: true },
            }),
            this.prisma.maintenance.findMany({
                where: { condoId, paymentResponsibility: 'LANDLORD', Status: 'COMPLETED' },
                select: { completionDate: true, totalCost: true },
            }),
        ]);
    
        // Create a Map for maintenance costs per billing month
        const maintenanceByMonth = new Map<string, number>();
        landlordMaintenance.forEach(({ completionDate, totalCost }) => {
            if (completionDate) {
                const month = this.getBillingMonthOfDate(completionDate);
                maintenanceByMonth.set(month, (maintenanceByMonth.get(month) || 0) + (totalCost || 0));
            }
        });
    
        return payments.map((payment) => ({
            ...payment,
            additionalCost: (payment.additionalCost || 0) + (maintenanceByMonth.get(payment.billingMonth) || 0),
        }));
    }

    async getCondoPaymentsLandlord(user: UserJwt, query: { 
        search: string, page: string, status: string, paymentType: string, condoId: string | undefined
    }) {
        const getCondoIds = await this.prisma.condo.findMany({
            where: { ownerId: user.id },
            select: { id: true }
        });
        const condoIds = query.condoId ? [query.condoId] : getCondoIds.flatMap((condo) => condo.id)

        const page = parseInt(query.page || '1');
        const take = 10;
        const skip = (page - 1) * take;

        const where: Prisma.CondoPaymentWhereInput = {
            condoId: { in: condoIds },
            ...(query.search && {
                OR: [
                    {tenant: {
                        name: { 
                            contains: query.search, 
                            mode: 'insensitive'
                        },
                    }},
                    {condo: {
                        name: {
                            contains: query.search,
                            mode: 'insensitive'
                        }
                    }},
                    {id: {
                        contains: query.search,
                        mode: 'insensitive'
                    }}
                ]
            }),
            ...((query.status && query.status !== "ALL") && {
                gcashStatus: query.status as GcashPaymentStatus
            }),
            ...((query.paymentType && query.paymentType !== "ALL") && {
                type: query.paymentType as CondoPaymentType
            })
        }

        const [getCondoPayments, condoPaymentsCount] = await Promise.all([
            this.prisma.condoPayment.findMany({
                where: where,
                include: { 
                    tenant: { select: { id: true, name: true, email: true } }, 
                    condo: { select: { id: true, name: true, address: true } } 
                },
                take: take,
                skip: skip,
                orderBy: {
                    payedAt: 'desc'
                }
            }),
            this.prisma.condoPayment.count({
                where: where
            })
        ])

        const hasNext = condoPaymentsCount > (skip + take);
        const totalPages = Math.ceil(condoPaymentsCount / take); // total pages available

        return {
            getCondoPayments,
            hasNext,
            totalPages,
        };
    }
}