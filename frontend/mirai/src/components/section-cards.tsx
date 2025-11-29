import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
        Card,
        CardAction,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
} from "@/components/ui/card"
import { useTableContext } from "@/contexts/table-context"

export function SectionCards() {
        const { statsData } = useTableContext()

        return (
                <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                        <Card className="@container/card">
                                <CardHeader>
                                        <CardDescription>Total Paid</CardDescription>
                                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                                £{((statsData?.totals.paid.cost ?? 0) / 100).toFixed(2)}
                                        </CardTitle>
                                        <CardAction>
                                                <Badge variant="outline">
                                                        {((statsData?.meta.paid_monthly_delta ?? 0) >= 0) ? <IconTrendingUp className="text-green-500" /> : <IconTrendingDown className="text-red-500" />}
                                                        {((statsData?.meta.paid_monthly_delta ?? 0) >= 0) ? "+" : "-"}
                                                        £{((statsData?.meta.paid_monthly_delta ?? 0) / 100).toFixed(2)}
                                                </Badge>
                                        </CardAction>
                                </CardHeader>
                                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                        {(statsData?.meta.paid_monthly_delta ?? 0) >= 0 ? (
                                                <div className="line-clamp-1 flex gap-2 font-medium">
                                                        Trending up this month <IconTrendingUp className="size-4" />
                                                </div>
                                        ) : (
                                                <div className="line-clamp-1 flex gap-2 font-medium">
                                                        Trending down this month <IconTrendingDown className="size-4" />
                                                </div>
                                        )}
                                </CardFooter>
                        </Card>
                        <Card className="@container/card">
                                <CardHeader>
                                        <CardDescription>Total Users</CardDescription>
                                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                                {(statsData?.meta.users ?? 0)}
                                        </CardTitle>
                                        <CardAction>
                                                <Badge variant="outline">
                                                        {((statsData?.meta.user_monthly_delta ?? 0) >= 0) ? <IconTrendingUp className="text-green-500" /> : <IconTrendingDown className="text-red-500" />}
                                                        {((statsData?.meta.user_monthly_delta ?? 0) >= 0) ? "+" : "-"}
                                                        {(statsData?.meta.user_monthly_delta ?? 0)}
                                                </Badge>
                                        </CardAction>
                                </CardHeader>
                                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                        {(statsData?.meta.user_monthly_delta ?? 0) >= 0 ? (
                                                <div className="line-clamp-1 flex gap-2 font-medium">
                                                        Trending up this month <IconTrendingUp className="size-4" />
                                                </div>
                                        ) : (
                                                <div className="line-clamp-1 flex gap-2 font-medium">
                                                        Trending down this month <IconTrendingDown className="size-4" />
                                                </div>
                                        )}
                                </CardFooter>
                        </Card>
                        <Card className="@container/card">
                                <CardHeader>
                                        <CardDescription>Total Completed Bookings</CardDescription>
                                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                                {(statsData?.totals.completed.frequency ?? 0)}
                                        </CardTitle>
                                        <CardAction>
                                                <Badge variant="outline">
                                                        {((statsData?.meta.completed_monthly_delta ?? 0) >= 0) ? <IconTrendingUp className="text-green-500" /> : <IconTrendingDown className="text-red-500" />}
                                                        {((statsData?.meta.completed_monthly_delta ?? 0) >= 0) ? "+" : "-"}
                                                        {(statsData?.meta.completed_monthly_delta ?? 0)}
                                                </Badge>
                                        </CardAction>
                                </CardHeader>
                                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                        {(statsData?.meta.completed_monthly_delta ?? 0) >= 0 ? (
                                                <div className="line-clamp-1 flex gap-2 font-medium">
                                                        Trending up this month <IconTrendingUp className="size-4" />
                                                </div>
                                        ) : (
                                                <div className="line-clamp-1 flex gap-2 font-medium">
                                                        Trending down this month <IconTrendingDown className="size-4" />
                                                </div>
                                        )}
                                </CardFooter>
                        </Card>
                        <Card className="@container/card">
                                <CardHeader>
                                        <CardDescription>Total Confirmed Bookings</CardDescription>
                                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                                {(statsData?.totals.confirmed.frequency ?? 0)}
                                        </CardTitle>
                                        <CardAction>
                                                <Badge variant="outline">
                                                        {((statsData?.meta.confirmed_monthly_delta ?? 0) >= 0) ? <IconTrendingUp className="text-green-500" /> : <IconTrendingDown className="text-red-500" />}
                                                        {((statsData?.meta.confirmed_monthly_delta ?? 0) >= 0) ? "+" : "-"}
                                                        {(statsData?.meta.confirmed_monthly_delta ?? 0)}
                                                </Badge>
                                        </CardAction>
                                </CardHeader>
                                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                        {(statsData?.meta.confirmed_monthly_delta ?? 0) >= 0 ? (
                                                <div className="line-clamp-1 flex gap-2 font-medium">
                                                        Trending up this month <IconTrendingUp className="size-4" />
                                                </div>
                                        ) : (
                                                <div className="line-clamp-1 flex gap-2 font-medium">
                                                        Trending down this month <IconTrendingDown className="size-4" />
                                                </div>
                                        )}
                                </CardFooter>
                        </Card>
                </div >
        )
}
