import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import CostDistributionChartTooltip from "../../common/CostDistributionChartTooltip";

const chartConfig = {
    landlord: {
        label: "Landlord",
        color: "#60a8fb",
    },
    tenant: {
        label: "Tenant",
        color: "#2563eb",
    }
} satisfies ChartConfig

type MaintenanceCostDistributionChartProps = {
    costDistributionStats?: {
        month: string,
        landlord: number,
        tenant: number,
    }[]
}

const MaintenanceCostDistributionChart = ({
    costDistributionStats
}: MaintenanceCostDistributionChartProps) => {

    return (
        <Card>
            <CardHeader>
                <CardTitle>Maintenance Cost</CardTitle>
                <CardDescription>
                    Monthly maintenance cost distribution (landlord and tenant)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart accessibilityLayer data={costDistributionStats}>
                            <CartesianGrid vertical={false} />
                            <XAxis 
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => new Date(`${value}, 1`).toLocaleString("default", { month: "short" })}
                            />
                            <YAxis tickLine={false} tickMargin={5} />
                            <ChartTooltip 
                            content={
                                <ChartTooltipContent 
                                labelFormatter={(label: any) => `Month: ${label}`}
                                className="w-[180px]"
                                formatter={(value, name, item, index) => (
                                    <CostDistributionChartTooltip payloads={['landlord', 'tenant']}
                                    chartConfig={chartConfig} value={value} name={name} item={item} index={index} />
                                )}
                                />
                            } />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar 
                            dataKey="landlord"
                            stackId="a"
                            fill="#60a8fb"
                            radius={[0, 0, 4, 4]}
                            />
                            <Bar 
                            dataKey="tenant"
                            stackId="a"
                            fill="#2563eb"
                            radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ChartContainer>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

export default MaintenanceCostDistributionChart