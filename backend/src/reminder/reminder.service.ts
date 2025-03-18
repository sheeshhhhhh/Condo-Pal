import { Injectable } from '@nestjs/common';
import { EmailSenderService } from 'src/email-sender/email-sender.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReminderService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly emailSender: EmailSenderService
    ) {}

    getLastDayOftheMonth() {
        const currYear = new Date().getFullYear();
        const currMonth = new Date().getMonth();

        // plus 1 on the month so that we go in advance but 0 in day so that means
        // we will go back in the currMonth and the last day of that month 
        const lastDay = new Date(currYear, currMonth + 1, 0).getDate();

        return lastDay;
    }

    async wakeUpServer() {
        // this is needed to be called first by the cron-jobs.org
        // so that the onrender free instance waked up and then we can send the 
        // cron job runPaymentReminder();
        return "Already Waked Up From Sleep";
    }

    async runPaymentReminder() {
        // get all the lease Agreement to get the due date
        const notEndedLeaseAgreement = await this.prisma.leaseAgreement.findMany({
            where: {
                isLeaseEnded: false
            },
            select: {
                id: true,
                due_date: true,
                condo: {
                    select: { id: true, name: true, photo: true, rentAmount: true }
                },
                tenant: {
                    select: { id: true, name: true, email: true }
                }
            }
        })

        // calculate if the due date is 1 week before
        notEndedLeaseAgreement.forEach((leaseAgreement) => {
            // send email reminders if it is 1 week before (might want to have a queing system for it not to have a timeout)
            const isLastDayofMonthDue = leaseAgreement.due_date === -1;
            const is1WeekBeforeDue = isLastDayofMonthDue 
                ? this.getLastDayOftheMonth() === new Date().getDate() + 7 
                : leaseAgreement.due_date === new Date().getDate() + 7;
            
            if(is1WeekBeforeDue) {
                this.emailSender.sendDueReminderEmail(leaseAgreement.tenant.email, leaseAgreement);
            }
        })

        return `Sent the daily reminders for billing due dates`;
    }
}
