import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAllBookingsUser, postCancellation, type GetAllBookingsResponse } from "@/api/bookings"
import { toast } from "sonner"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { IconCircleCheck, IconCircleCheckFilled, IconCircleXFilled, IconDotsVertical, IconLoader, IconRefresh, IconX } from "@tabler/icons-react"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent } from "@radix-ui/react-dropdown-menu"
import { DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { CancelModal } from "./booking-table-modals"
import { useTableContext } from "@/contexts/table-context"

export default function UserBookings() {
        const { isCancelModalOpen, setIsCancelModalOpen, setCancelModalRow, bookingData, setBookingData } = useTableContext();

        async function fetchData() {
                try {
                        const res = await getAllBookingsUser();
                        if (res) {
                                setBookingData(res);
                        }
                        console.log(res);
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
                                                        <TableHead>Start Time</TableHead>
                                                        <TableHead>End Time</TableHead>
                                                        <TableHead>Provider</TableHead>
                                                        <TableHead>Service</TableHead>
                                                        <TableHead>Paid</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Amount</TableHead>
                                                        <TableHead>Cancel</TableHead>
                                                </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                                {(bookingData.length === 0) ? (
                                                        <TableRow>
                                                                <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                                                                        No bookings found.
                                                                </TableCell>
                                                        </TableRow>
                                                ) : (
                                                        bookingData.map((b) => (
                                                                <TableRow key={b.id}>
                                                                        <TableCell>{format(new Date(b.start_time), "dd-MMM-yy")}</TableCell>
                                                                        <TableCell>{format(new Date(b.start_time), "HH:mm")}</TableCell>
                                                                        <TableCell>{format(new Date(new Date(b.start_time).getTime() + 30 * 60000), "HH:mm")}</TableCell>
                                                                        <TableCell>{b.employee_name} {b.employee_surname}</TableCell>
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

                                                                        <TableCell align="center">
                                                                                {(b.status == "created" || b.status == "confirmed") &&
                                                                                        <Button
                                                                                                className="p-1 h-6 w-6 flex items-center justify-center cursor-pointer"
                                                                                                onClick={() => {
                                                                                                        setIsCancelModalOpen(true)
                                                                                                        setCancelModalRow(b)
                                                                                                }}
                                                                                        >
                                                                                                <IconX size={16} />
                                                                                        </Button>
                                                                                }
                                                                        </TableCell>

                                                                </TableRow>
                                                        ))
                                                )}
                                        </TableBody>
                                </Table>
                                <CancelModal />
                        </CardContent>
                </Card >

        )
}
