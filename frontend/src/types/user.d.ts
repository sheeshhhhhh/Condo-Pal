
const userRole = {
    tenant="tenant",
    landlord="landlord"
} as const
type role = typeof userRole[keyof typeof userRole]

const provider = {
    google="google",
    local="local",
} as const
type provider = typeof provider[keyof typeof provider]

type checkUser = {
    id: string,
    email: string,
    profile?: string,
    name?: string,
    
    role: role,
    isOauth: boolean,

    provider?: provider,
    providerId?: string

    subscription: subscriptionCheckUser[]

    createdAt: string,
    updatedAt: string,
}

