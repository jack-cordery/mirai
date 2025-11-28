import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
        Card,
        CardAction,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
} from "@/components/ui/card"
import {
        ChartContainer,
        ChartTooltip,
        ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
} from "@/components/ui/select"
import {
        ToggleGroup,
        ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { getStats, type GetStatsResponse, type ByDate, type DataByDate, type Data } from "@/api/stats"
import { toast } from "sonner"

export const description = "An interactive area chart"

const chartConfig = {
        paid: {
                label: "Paid",
                color: "#4A90E2",
        },
        notPaid: {
                label: "Not Paid",
                color: "#9B9B9B",
        },
} satisfies ChartConfig

export function ChartAreaInteractive() {
        const isMobile = useIsMobile()
        const [timeRange, setTimeRange] = React.useState("90d")
        const [chartData, setChartData] = React.useState<DataByDate[]>([])
        const [statsData, setStatsData] = React.useState<Data | null>(null)
        const [filteredData, setFilteredData] = React.useState<DataByDate[]>([])


        React.useEffect(() => {
                async function fetchData() {
                        try {
                                const res: GetStatsResponse = await getStats("day");
                                setChartData(res.by_date);
                                setStatsData(res.totals);
                        } catch {
                                toast("failed to fetch stats");
                        }
                }

                fetchData();
        }, []);

        React.useEffect(() => {
                if (!chartData.length) return;

                const filtered = chartData.filter((item) => {
                        const date = new Date(item.date);
                        const referenceDate = new Date();

                        let daysToSubtract = 90;
                        if (timeRange === "30d") daysToSubtract = 30;
                        if (timeRange === "7d") daysToSubtract = 7;

                        const startDate = new Date(referenceDate);
                        startDate.setDate(startDate.getDate() - daysToSubtract);

                        return date >= startDate;
                });

                setFilteredData(filtered);
        }, [chartData, timeRange]);

        React.useEffect(() => {
                if (isMobile) {
                        setTimeRange("7d")
                }
        }, [isMobile])


        return (
                <Card className="@container/card">
                        <CardHeader>
                                <CardTitle>Revenue</CardTitle>
                                <CardDescription>
                                        <span className="hidden @[540px]/card:block">
                                                Total for the last 3 months
                                        </span>
                                        <span className="@[540px]/card:hidden">Last 3 months</span>
                                </CardDescription>
                                <CardAction>
                                        <ToggleGroup
                                                type="single"
                                                value={timeRange}
                                                onValueChange={setTimeRange}
                                                variant="outline"
                                                className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
                                        >
                                                <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
                                                <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
                                                <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
                                        </ToggleGroup>
                                        <Select value={timeRange} onValueChange={setTimeRange}>
                                                <SelectTrigger
                                                        className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                                                        size="sm"
                                                        aria-label="Select a value"
                                                >
                                                        <SelectValue placeholder="Last 3 months" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                        <SelectItem value="90d" className="rounded-lg">
                                                                Last 3 months
                                                        </SelectItem>
                                                        <SelectItem value="30d" className="rounded-lg">
                                                                Last 30 days
                                                        </SelectItem>
                                                        <SelectItem value="7d" className="rounded-lg">
                                                                Last 7 days
                                                        </SelectItem>
                                                </SelectContent>
                                        </Select>
                                </CardAction>
                        </CardHeader>
                        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                                <ChartContainer
                                        config={chartConfig}
                                        className="aspect-auto h-[250px] w-full"
                                >
                                        <AreaChart data={filteredData}>
                                                <defs>
                                                        <linearGradient id="fillPaid" x1="0" y1="0" x2="0" y2="1">
                                                                <stop
                                                                        offset="5%"
                                                                        stopColor="var(--color-paid)"
                                                                        stopOpacity={1.0}
                                                                />
                                                                <stop
                                                                        offset="95%"
                                                                        stopColor="var(--color-paid)"
                                                                        stopOpacity={0.1}
                                                                />
                                                        </linearGradient>
                                                        <linearGradient id="fillNotPaid" x1="0" y1="0" x2="0" y2="1">
                                                                <stop
                                                                        offset="5%"
                                                                        stopColor="var(--color-notPaid)"
                                                                        stopOpacity={0.8}
                                                                />
                                                                <stop
                                                                        offset="95%"
                                                                        stopColor="var(--color-notPaid)"
                                                                        stopOpacity={0.1}
                                                                />
                                                        </linearGradient>
                                                </defs>
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                        dataKey="date"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={8}
                                                        minTickGap={32}
                                                        tickFormatter={(value) => {
                                                                const date = new Date(value)
                                                                return date.toLocaleDateString("en-US", {
                                                                        month: "short",
                                                                        day: "numeric",
                                                                })
                                                        }}
                                                />
                                                <YAxis
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={8}
                                                        minTickGap={32}
                                                        tickFormatter={(value) => {
                                                                return "£" + (value / 100).toFixed(2).toString()
                                                        }}
                                                />
                                                <ChartTooltip
                                                        cursor={false}
                                                        content={
                                                                <ChartTooltipContent
                                                                        formatter={(value, name, item) => {
                                                                                const label = name === "data.open_paid.cost" ? "Paid" : "Not Paid";
                                                                                const amount = `£${(Number(value) / 100).toFixed(2)}`;

                                                                                return (
                                                                                        <div
                                                                                                style={{
                                                                                                        display: "flex",
                                                                                                        alignItems: "center",
                                                                                                        gap: "8px",
                                                                                                }}
                                                                                        >
                                                                                                <div
                                                                                                        style={{
                                                                                                                width: 10,
                                                                                                                height: 10,
                                                                                                                borderRadius: "50%",
                                                                                                                backgroundColor: item.color,
                                                                                                        }}
                                                                                                />

                                                                                                <div
                                                                                                        style={{
                                                                                                                display: "flex",
                                                                                                                justifyContent: "space-between",
                                                                                                                width: "120px",          // adjust width to align columns
                                                                                                                fontFamily: "monospace", // ensures perfect alignment
                                                                                                        }}
                                                                                                >
                                                                                                        <span>{label}:</span>
                                                                                                        <span style={{ textAlign: "right" }}>{amount}</span>
                                                                                                </div>
                                                                                        </div>
                                                                                );
                                                                        }}
                                                                        labelFormatter={(value) => {
                                                                                return new Date(value).toLocaleDateString("en-US", {
                                                                                        month: "short",
                                                                                        day: "numeric",
                                                                                })
                                                                        }}
                                                                        indicator="dot"
                                                                />
                                                        }
                                                />
                                                <Area
                                                        dataKey="data.open_paid.cost"
                                                        type="natural"
                                                        fill="url(#fillPaid)"
                                                        stroke="var(--color-paid)"
                                                        stackId="a"
                                                />
                                                <Area
                                                        dataKey="data.open_not_paid.cost"
                                                        type="natural"
                                                        fill="url(#fillNotPaid)"
                                                        stroke="var(--color-notPaid)"
                                                        stackId="a"
                                                />
                                        </AreaChart>
                                </ChartContainer>
                        </CardContent>
                </Card>
        )
}
