import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import formatToPesos from "@/lib/formatToPesos"

type SummaryCardProps = {} & CondoSummary

const SummaryCards = ({
    totalMaintenanceCost,
    totalExpenses,
    totalIncome,
    totalPaymentCount
}: SummaryCardProps) => {

    const netIncome = totalIncome - (totalExpenses + totalMaintenanceCost);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Income
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatToPesos(totalIncome)}</div>
                    <div className="text-xs text-muted-foreground mt-2">
                        From {totalPaymentCount} payments
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Expenses
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                        {formatToPesos(totalExpenses)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        Maintenance: {formatToPesos(totalMaintenanceCost)}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Net Income
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatToPesos(netIncome)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        {netIncome >= 0 ? "Profit" : "Loss"}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Occupancy Rate
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">26%</div>
                    <div className="mt-2">
                        <Progress value={26} className="h-2" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default SummaryCards