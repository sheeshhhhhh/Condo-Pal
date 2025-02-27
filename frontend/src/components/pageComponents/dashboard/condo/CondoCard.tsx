import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { UserX } from "lucide-react"

type CondoCardProps = {
    condo: CondoCard
}

const CondoCard = ({
    condo
}: CondoCardProps) => {

    const formatToPesos = (amount: number) => {
        return new Intl.NumberFormat("en-Ph", {
            style: 'currency',
            currency: 'PHP'
        }).format(amount)
    }

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex h-full flex-col">
                <div className="relative h-58">
                    <img src={condo.photo} alt={condo.name} 
                    className="w-full h-full object-fill" />
                    <Badge variant={condo.isActive ? "default" : "secondary"} className="absolute top-3 right-3 rounded-full">
                        {condo.isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>
                <CardContent className="p-5 flex-1 flex-col">
                    <div className="mb-4">
                        <h3 className="text-xl font-semibold mb-1 text-foreground">{condo.name}</h3>
                        <p className="text-sm text-muted-foreground">{condo.address}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <TenantProfile tenant={condo.tenant} />
                        <div>
                            <p className="text-xs text-muted-foreground">Monthly Rent</p>
                            <p className="text-lg font-bold text-primary">{formatToPesos(condo.rentAmount)}</p>
                        </div>
                    </div>
                </CardContent>
            </div>
        </Card>
    )
}

type TenantProfile = {
    tenant: {
        id: string,
        name: string,
        profile: string,
    }
}

const TenantProfile = ({ 
    tenant
}: TenantProfile) => {
    if(tenant) {
        return (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={tenant.profile} alt={tenant.name} />
                    <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-xs text-muted-foreground">Tenant</p>
                    <p className="text-sm font-medium">{tenant.name}</p>
                </div>
            </div>
        )
    } else {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-8 w-8 rounded-full border-border flex items-center justify-center bg-muted">
                    <UserX className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-xs">Tenant</p>
                    <p className="text-sm">No tenant</p>
                </div>
            </div>
        )
    }
}

export default CondoCard