
type condo = {
    id: string,
    name: string,
    address: string,
    photo: string,

    ownerId: string,
    // owner: any, // user

    tenantId: string,
    // tenant: any, // user

    rentAmount: number,
    isActive: boolean,

    createdAt: string,
    updatedAt: string,
}

type CondoCard = {
    id: condo['id'],
    name: condo['name'],
    address: condo['address'],
    photo: condo['photo'],

    ownerId: condo['ownerid'],

    tenantId: condo['tenantId'],
    tenant: {
        id: user['id'],
        name: user['name'],
        profile: user['profile']
    } | undefined;

    rentAmount: condo['rentAmount'],
    isActive: condo['isActive'],

    createdAt: condo['createdAt'],
    updatedAt: condo['updatedAt']
}

type CondoBillInformation = {
    id: condo['id'],
    name: condo['name'],
    address: condo['address'],
    photo: condo['photo'],
    rentCost: number,
    additionalCost: number,
    totalCost: number,
    billingMonth: string,
    dueDate: string,
    tenant?: {
        id: user['id']
        name: user['name']
    },
    owner: {
        id: user['id']
        name: user['name'],
        profile: user['profile']
    },
}

type CondoSummary = {
    totalMaintenanceCost: number,
    totalExpenses: number,
    totalIncome: number,
    totalPaymentCount: number,
}

type ViewCondoInformation = {
    tenant?: {
        id: user['id'],
        name: user['name'],
        profile: user['profile']
    },
    owner: {
        id: user['id'],
        name: user['name'],
        profile: user['profile']
    },
    condoSummary: CondoSummary,
    latestBill: billingMonth,
} & condo