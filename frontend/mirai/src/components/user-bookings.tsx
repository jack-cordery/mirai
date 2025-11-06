import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAllBookingsUser, type GetAllBookingsResponse } from "@/api/bookings"
import { toast } from "sonner"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { IconCircleCheck, IconCircleCheckFilled, IconCircleXFilled, IconLoader, IconRefresh } from "@tabler/icons-react"

export default function UserBookings() {
        const [bookings, setBookings] = useState<GetAllBookingsResponse[]>([])

        async function fetchData() {
                try {
                        const res = await getAllBookingsUser();
                        setBookings(res);
                } catch (err) {
                        toast("data fetch failed. Please try again later")
                }
        }

        useEffect(() => {
                fetchData()
        }, [])

        return (
                <Card className="w-full">
                        <CardHeader>
                                <CardTitle>Your Bookings</CardTitle>
                                <CardDescription>View your previous and upcoming bookings here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                                <Table>
                                        <TableHeader>
                                                <TableRow>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Time</TableHead>
                                                        <TableHead>Service</TableHead>
                                                        <TableHead>Paid</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Amount</TableHead>
                                                </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                                {bookings.length === 0 ? (
                                                        <TableRow>
                                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                                                        No bookings found.
                                                                </TableCell>
                                                        </TableRow>
                                                ) : (
                                                        bookings.map((b) => (
                                                                <TableRow key={b.id}>
                                                                        <TableCell>{format(new Date(b.start_time), "dd-MMM-yy")}</TableCell>
                                                                        <TableCell>{format(new Date(b.start_time), "HH:mm")}</TableCell>
                                                                        <TableCell>{b.type_title}</TableCell>
                                                                        <TableCell>
                                                                                {b.paid ? (
                                                                                        <p>✅</p>

                                                                                ) : (

                                                                                        <p>❌</p>
                                                                                )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                                <Badge variant="outline" className="text-muted-foreground px-1.5">
                                                                                        {b.status === "completed" ? (
                                                                                                <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
                                                                                        ) : b.status === "cancelled" ? (
                                                                                                <IconCircleXFilled className="fill-red-500 dark:fill-red-400" />
                                                                                        ) : b.status === "confirmed" ? (
                                                                                                <IconCircleCheck className="stroke-green-500 dark:stroke-green-400" />
                                                                                        ) : b.status === "rescheduled" ? (
                                                                                                <IconRefresh className="stroke-yellow-500 dark:stroke-yellow-400" />
                                                                                        ) : b.status === "completed" ? (
                                                                                                <IconCircleXFilled className="fill-green-500 dark:fill-green-400" />
                                                                                        ) : (
                                                                                                <IconLoader />
                                                                                        )}
                                                                                        {b.status}
                                                                                </Badge>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                                £{(b.cost / 100).toFixed(2)}
                                                                        </TableCell>
                                                                </TableRow>
                                                        ))
                                                )}
                                        </TableBody>
                                </Table>
                        </CardContent>
                </Card>
        )
}
